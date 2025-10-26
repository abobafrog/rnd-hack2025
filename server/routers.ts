import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createRoom,
  getRoomByCode,
  addParticipant,
  getRoomParticipants,
  addChatMessage,
  getChatMessages,
  getAllRooms,
} from "./db";
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

        console.log(`[Room.create] Creating room with code: ${roomCode}, ownerId: ${ownerId}`);

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
        console.log(`[Room.create] Room added to createdRooms: ${roomCode}, total rooms: ${createdRooms.size}`);
        return { roomCode, ownerId };
      }),

    get: publicProcedure
      .input(z.object({ roomCode: z.string() }))
      .query(async ({ input }) => {
        console.log(`[Room.get] Requested roomCode: ${input.roomCode}`);
        console.log(`[Room.get] createdRooms:`, Array.from(createdRooms));
        
        let room = null;
        try {
          room = await getRoomByCode(input.roomCode);
          console.log(`[Room.get] getRoomByCode result:`, room ? "found in DB" : "not found in DB");
        } catch (error) {
          console.error("[Room.get] getRoomByCode error:", error);
          // Игнорируем ошибку БД и проверяем в памяти
        }

        // Если комната не найдена в БД, проверяем в памяти (демо-режим)
        if (!room) {
          // Проверяем есть ли комната в созданных
          if (!createdRooms.has(input.roomCode)) {
            console.log(`[Room.get] Room ${input.roomCode} not found in DB or createdRooms`);
            throw new Error("Room not found");
          }
          // Возвращаем демо-комнату если она была создана
          const demoOwnerId = roomOwners.get(input.roomCode) || 1;
          console.log(`[Room.get] Returning demo room for ${input.roomCode}`);
          return {
            id: Math.floor(Math.random() * 1000) + 1,
            roomCode: input.roomCode,
            name: `Демо комната ${input.roomCode}`,
            ownerId: demoOwnerId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }

        console.log(`[Room.get] Returning DB room for ${input.roomCode}`);
        return room;
      }),

    join: publicProcedure
      .input(
        z.object({
          roomCode: z.string(),
          userName: z.string(),
          userId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const room = await getRoomByCode(input.roomCode);

          // Если комната не найдена в БД, проверяем в памяти (демо-режим)
          if (!room) {
            // Проверяем есть ли комната в созданных
            if (!createdRooms.has(input.roomCode)) {
              throw new Error("Room not found");
            }
            // В демо-режиме не добавляем в БД, просто возвращаем success
            return { success: true };
          }

          await addParticipant({
            roomId: room.id,
            userId: input.userId,
            userName: input.userName,
          });
          return { success: true };
        } catch (error) {
          console.error("[Room.join] Error:", error);
          // В случае ошибки БД, проверяем в памяти
          if (createdRooms.has(input.roomCode)) {
            return { success: true };
          }
          throw new Error("Room not found");
        }
      }),

    participants: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        return await getRoomParticipants(input.roomId);
      }),

    getAll: publicProcedure.query(async () => {
      return await getAllRooms();
    }),
  }),

  chat: router({
    send: publicProcedure
      .input(
        z.object({
          roomId: z.number(),
          userId: z.number(),
          userName: z.string(),
          message: z.string(),
        })
      )
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
