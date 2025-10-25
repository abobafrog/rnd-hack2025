import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createRoom, getRoomByCode, addParticipant, getRoomParticipants, addChatMessage, getChatMessages, getAllRooms } from "./db";
import { createdRooms, roomOwners } from "./socket";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  room: router({
    create: publicProcedure
      .input(z.object({ name: z.string(), userId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const roomCode = Math.random().toString(36).substring(2, 10);
        // Используем userId из контекста (если есть), из input или дефолтное значение 1
        const ownerId = ctx.user?.id || input.userId || 1;
        
        try {
          await createRoom({
            roomCode,
            name: input.name,
            ownerId,
          });
        } catch (error) {
          // В демо-режиме продолжаем работу даже если база данных недоступна
          console.log("[Room] Created room in demo mode:", roomCode);
        }
        // Сохраняем комнату в памяти для проверки существования
        createdRooms.add(roomCode);
        // Сохраняем владельца комнаты
        roomOwners.set(roomCode, ownerId);
        return { roomCode, ownerId };
      }),
    
    get: publicProcedure
      .input(z.object({ roomCode: z.string() }))
      .query(async ({ input }) => {
        const room = await getRoomByCode(input.roomCode);
        
        // Если комната не найдена в БД, проверяем в памяти (демо-режим)
        if (!room) {
          // Проверяем есть ли комната в созданных
          if (!createdRooms.has(input.roomCode)) {
            throw new Error("Room not found");
          }
          // Возвращаем демо-комнату если она была создана
          const demoOwnerId = roomOwners.get(input.roomCode) || 1;
          return {
            id: Math.floor(Math.random() * 1000) + 1,
            roomCode: input.roomCode,
            name: `Демо комната ${input.roomCode}`,
            ownerId: demoOwnerId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        return room;
      }),
    
    join: publicProcedure
      .input(z.object({ roomCode: z.string(), userName: z.string(), userId: z.number() }))
      .mutation(async ({ input }) => {
        const room = await getRoomByCode(input.roomCode);
        
        // Если комната не найдена в БД, проверяем в памяти (демо-режим)
        if (!room) {
          // Проверяем есть ли комната в созданных
          if (!createdRooms.has(input.roomCode)) {
            throw new Error("Room not found");
          }
          // В демо-режиме создаем виртуальную комнату
          const demoRoom = {
            id: Math.floor(Math.random() * 1000) + 1,
            roomCode: input.roomCode,
            name: `Демо комната ${input.roomCode}`,
            ownerId: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await addParticipant({
            roomId: demoRoom.id,
            userId: input.userId,
            userName: input.userName,
          });
          return { success: true };
        }
        
        await addParticipant({
          roomId: room.id,
          userId: input.userId,
          userName: input.userName,
        });
        return { success: true };
      }),
    
    participants: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        return await getRoomParticipants(input.roomId);
      }),
    
    getAll: publicProcedure
      .query(async () => {
        return await getAllRooms();
      }),
  }),
  
  chat: router({
    send: publicProcedure
      .input(z.object({ roomId: z.number(), userId: z.number(), userName: z.string(), message: z.string() }))
      .mutation(async ({ input }) => {
        await addChatMessage(input);
        return { success: true };
      }),
    
    messages: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        return await getChatMessages(input.roomId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
