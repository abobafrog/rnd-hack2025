import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDatabase } from "./test-setup";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import {
  rooms,
  roomParticipants,
  chatMessages,
  users,
} from "../drizzle/schema";

describe("tRPC API Integration Tests", () => {
  let db: any;
  let router: any;

  beforeEach(async () => {
    db = await setupTestDatabase();

    // Создаем тестовый контекст
    const mockReq = {} as any;
    const mockRes = {} as any;
    const mockUser = {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      role: "user" as const,
    };

    const context = await createContext({ req: mockReq, res: mockRes });
    context.user = mockUser;

    router = appRouter.createCaller(context);
  });

  afterEach(async () => {
    // Очищаем данные после каждого теста
    await db.delete(chatMessages);
    await db.delete(roomParticipants);
    await db.delete(rooms);
    await db.delete(users);
  });

  describe("Auth Router", () => {
    it("should return current user", async () => {
      const result = await router.auth.me();
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe("Test User");
    });

    it("should logout user", async () => {
      const result = await router.auth.logout();
      expect(result.success).toBe(true);
    });
  });

  describe("Room Router", () => {
    it("should create room", async () => {
      const result = await router.room.create({ name: "Test Room" });

      expect(result).toBeDefined();
      expect(result.roomCode).toBeDefined();
      expect(typeof result.roomCode).toBe("string");
      expect(result.roomCode.length).toBeGreaterThan(0);
    });

    it("should get room by code", async () => {
      // Сначала создаем комнату через API
      const createResult = await router.room.create({ name: "Test Room" });

      // Получаем комнату по коду
      const room = await router.room.get({ roomCode: createResult.roomCode });

      expect(room).toBeDefined();
      expect(room.name).toBe("Test Room");
      expect(room.roomCode).toBe(createResult.roomCode);
    });

    it("should throw error for non-existent room", async () => {
      await expect(
        router.room.get({ roomCode: "nonexistent" })
      ).rejects.toThrow("Room not found");
    });

    it("should join room", async () => {
      // Создаем комнату
      const createResult = await router.room.create({ name: "Test Room" });
      const room = await router.room.get({ roomCode: createResult.roomCode });

      // Присоединяемся к комнате
      const result = await router.room.join({
        roomCode: createResult.roomCode,
        userName: "New Participant",
        userId: 2,
      });

      expect(result.success).toBe(true);
    });

    it("should get room participants", async () => {
      // Создаем комнату
      const createResult = await router.room.create({ name: "Test Room" });
      const room = await router.room.get({ roomCode: createResult.roomCode });

      // Добавляем участника
      await router.room.join({
        roomCode: createResult.roomCode,
        userName: "Participant 1",
        userId: 2,
      });

      // Получаем участников
      const participants = await router.room.participants({ roomId: room.id });

      expect(participants).toHaveLength(1);
      expect(participants[0].userName).toBe("Participant 1");
    });
  });

  describe("Chat Router", () => {
    it("should send chat message", async () => {
      // Создаем комнату
      const createResult = await router.room.create({ name: "Test Room" });
      const room = await router.room.get({ roomCode: createResult.roomCode });

      // Отправляем сообщение
      const result = await router.chat.send({
        roomId: room.id,
        userId: 1,
        userName: "Test User",
        message: "Hello, world!",
      });

      expect(result.success).toBe(true);
    });

    it("should get chat messages", async () => {
      // Создаем комнату
      const createResult = await router.room.create({ name: "Test Room" });
      const room = await router.room.get({ roomCode: createResult.roomCode });

      // Отправляем несколько сообщений
      await router.chat.send({
        roomId: room.id,
        userId: 1,
        userName: "User 1",
        message: "First message",
      });

      await router.chat.send({
        roomId: room.id,
        userId: 2,
        userName: "User 2",
        message: "Second message",
      });

      // Получаем сообщения
      const messages = await router.chat.messages({ roomId: room.id });

      expect(messages).toHaveLength(2);
      expect(messages[0].message).toBe("Second message"); // Новые сообщения первыми
      expect(messages[1].message).toBe("First message");
    });
  });

  describe("Error Handling", () => {
    it("should handle room not found errors", async () => {
      await expect(
        router.room.join({
          roomCode: "nonexistent",
          userName: "Test User",
          userId: 1,
        })
      ).rejects.toThrow("Room not found");
    });

    it("should validate input parameters", async () => {
      await expect(router.room.create({ name: "" })).rejects.toThrow();
    });
  });
});
