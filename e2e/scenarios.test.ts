import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDatabase } from "../server/test-setup";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { rooms, roomParticipants, chatMessages, users } from "../../drizzle/schema";

describe("End-to-End Scenarios", () => {
  let db: any;
  let router: any;

  beforeEach(async () => {
    db = await setupTestDatabase();
    
    // Создаем тестовый контекст с пользователем
    const mockReq = {} as any;
    const mockRes = {} as any;
    const mockUser = {
      id: 1,
      openId: "test-user-1",
      name: "Room Owner",
      email: "owner@example.com",
      role: "user" as const
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

  describe("Complete Room Lifecycle", () => {
    it("should handle full room creation and participation flow", async () => {
      // 1. Пользователь создает комнату
      const createResult = await router.room.create({ name: "E2E Test Room" });
      expect(createResult.roomCode).toBeDefined();

      // 2. Получаем информацию о комнате
      const room = await router.room.get({ roomCode: createResult.roomCode });
      expect(room.name).toBe("E2E Test Room");
      expect(room.ownerId).toBe(1);

      // 3. Второй пользователь присоединяется к комнате
      const joinResult = await router.room.join({
        roomCode: createResult.roomCode,
        userName: "Participant User",
        userId: 2
      });
      expect(joinResult.success).toBe(true);

      // 4. Проверяем участников комнаты
      const participants = await router.room.participants({ roomId: room.id });
      expect(participants).toHaveLength(1);
      expect(participants[0].userName).toBe("Participant User");

      // 5. Участники обмениваются сообщениями
      const message1 = await router.chat.send({
        roomId: room.id,
        userId: 1,
        userName: "Room Owner",
        message: "Welcome to the room!"
      });
      expect(message1.success).toBe(true);

      const message2 = await router.chat.send({
        roomId: room.id,
        userId: 2,
        userName: "Participant User",
        message: "Thank you for inviting me!"
      });
      expect(message2.success).toBe(true);

      // 6. Получаем историю сообщений
      const messages = await router.chat.messages({ roomId: room.id });
      expect(messages).toHaveLength(2);
      expect(messages[0].message).toBe("Thank you for inviting me!");
      expect(messages[1].message).toBe("Welcome to the room!");
    });

    it("should handle multiple participants joining", async () => {
      // Создаем комнату
      const createResult = await router.room.create({ name: "Multi-User Room" });
      const room = await router.room.get({ roomCode: createResult.roomCode });

      // Несколько пользователей присоединяются
      const participants = [
        { userId: 2, userName: "User 2" },
        { userId: 3, userName: "User 3" },
        { userId: 4, userName: "User 4" }
      ];

      for (const participant of participants) {
        await router.room.join({
          roomCode: createResult.roomCode,
          userName: participant.userName,
          userId: participant.userId
        });
      }

      // Проверяем всех участников
      const roomParticipants = await router.room.participants({ roomId: room.id });
      expect(roomParticipants).toHaveLength(3);
      
      const participantNames = roomParticipants.map(p => p.userName);
      expect(participantNames).toContain("User 2");
      expect(participantNames).toContain("User 3");
      expect(participantNames).toContain("User 4");
    });

    it("should handle chat with multiple participants", async () => {
      // Создаем комнату и добавляем участников
      const createResult = await router.room.create({ name: "Chat Room" });
      const room = await router.room.get({ roomCode: createResult.roomCode });

      // Добавляем участников
      await router.room.join({
        roomCode: createResult.roomCode,
        userName: "Alice",
        userId: 2
      });

      await router.room.join({
        roomCode: createResult.roomCode,
        userName: "Bob",
        userId: 3
      });

      // Участники отправляют сообщения
      const messages = [
        { userId: 1, userName: "Room Owner", message: "Hello everyone!" },
        { userId: 2, userName: "Alice", message: "Hi there!" },
        { userId: 3, userName: "Bob", message: "Nice to meet you all!" },
        { userId: 1, userName: "Room Owner", message: "Let's start the meeting" }
      ];

      for (const msg of messages) {
        await router.chat.send({
          roomId: room.id,
          userId: msg.userId,
          userName: msg.userName,
          message: msg.message
        });
      }

      // Получаем все сообщения
      const chatHistory = await router.chat.messages({ roomId: room.id });
      expect(chatHistory).toHaveLength(4);
      
      // Проверяем порядок сообщений (новые первыми)
      expect(chatHistory[0].message).toBe("Let's start the meeting");
      expect(chatHistory[1].message).toBe("Nice to meet you all!");
      expect(chatHistory[2].message).toBe("Hi there!");
      expect(chatHistory[3].message).toBe("Hello everyone!");
    });
  });

  describe("Error Scenarios", () => {
    it("should handle non-existent room gracefully", async () => {
      // Попытка получить несуществующую комнату
      await expect(
        router.room.get({ roomCode: "nonexistent" })
      ).rejects.toThrow("Room not found");

      // Попытка присоединиться к несуществующей комнате
      await expect(
        router.room.join({
          roomCode: "nonexistent",
          userName: "Test User",
          userId: 1
        })
      ).rejects.toThrow("Room not found");
    });

    it("should handle invalid input parameters", async () => {
      // Попытка создать комнату с пустым именем
      await expect(
        router.room.create({ name: "" })
      ).rejects.toThrow();

      // Попытка отправить сообщение в несуществующую комнату
      await expect(
        router.chat.send({
          roomId: 99999,
          userId: 1,
          userName: "Test User",
          message: "Test message"
        })
      ).rejects.toThrow();
    });
  });

  describe("Performance Scenarios", () => {
    it("should handle large number of messages efficiently", async () => {
      // Создаем комнату
      const createResult = await router.room.create({ name: "Performance Test Room" });
      const room = await router.room.get({ roomCode: createResult.roomCode });

      // Отправляем много сообщений
      const messageCount = 50;
      for (let i = 0; i < messageCount; i++) {
        await router.chat.send({
          roomId: room.id,
          userId: 1,
          userName: "Test User",
          message: `Message ${i + 1}`
        });
      }

      // Получаем сообщения (должно быть ограничено 100 сообщениями)
      const messages = await router.chat.messages({ roomId: room.id });
      expect(messages).toHaveLength(messageCount);
      
      // Проверяем, что сообщения отсортированы по времени (новые первыми)
      for (let i = 0; i < messages.length - 1; i++) {
        expect(messages[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          messages[i + 1].createdAt.getTime()
        );
      }
    });
  });
});


