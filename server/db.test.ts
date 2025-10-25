import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDatabase, cleanupTestDatabase } from "./test-setup";
import { 
  createRoom, 
  getRoomByCode, 
  addParticipant, 
  getRoomParticipants, 
  addChatMessage, 
  getChatMessages,
  upsertUser,
  getUserByOpenId
} from "./db";
import { rooms, roomParticipants, chatMessages, users } from "../drizzle/schema";

describe("Database Functions", () => {
  let db: any;

  beforeEach(async () => {
    db = await setupTestDatabase();
  });

  afterEach(async () => {
    // Очищаем данные после каждого теста
    await db.delete(chatMessages);
    await db.delete(roomParticipants);
    await db.delete(rooms);
    await db.delete(users);
  });

  describe("User Management", () => {
    it("should create and retrieve user", async () => {
      const userData = {
        openId: "test-openid-123",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "google"
      };

      await upsertUser(userData);
      const user = await getUserByOpenId("test-openid-123");

      expect(user).toBeDefined();
      expect(user?.name).toBe("Test User");
      expect(user?.email).toBe("test@example.com");
      expect(user?.loginMethod).toBe("google");
    });

    it("should update existing user", async () => {
      const initialUser = {
        openId: "test-openid-456",
        name: "Initial Name",
        email: "initial@example.com"
      };

      await upsertUser(initialUser);
      
      const updatedUser = {
        openId: "test-openid-456",
        name: "Updated Name",
        email: "updated@example.com"
      };

      await upsertUser(updatedUser);
      const user = await getUserByOpenId("test-openid-456");

      expect(user?.name).toBe("Updated Name");
      expect(user?.email).toBe("updated@example.com");
    });
  });

  describe("Room Management", () => {
    it("should create room", async () => {
      const roomData = {
        roomCode: "test123",
        name: "Test Room",
        ownerId: 1
      };

      const result = await createRoom(roomData);
      expect(result).toBeDefined();
    });

    it("should get room by code", async () => {
      const roomData = {
        roomCode: "test456",
        name: "Test Room 2",
        ownerId: 1
      };

      await createRoom(roomData);
      const room = await getRoomByCode("test456");

      expect(room).toBeDefined();
      expect(room?.name).toBe("Test Room 2");
      expect(room?.roomCode).toBe("test456");
    });

    it("should return undefined for non-existent room", async () => {
      const room = await getRoomByCode("nonexistent");
      expect(room).toBeUndefined();
    });
  });

  describe("Participant Management", () => {
    it("should add participant to room", async () => {
      // Сначала создаем комнату
      const roomData = {
        roomCode: "test789",
        name: "Test Room 3",
        ownerId: 1
      };
      await createRoom(roomData);
      const room = await getRoomByCode("test789");

      // Добавляем участника
      const participantData = {
        roomId: room!.id,
        userId: 1,
        userName: "Test Participant"
      };

      const result = await addParticipant(participantData);
      expect(result).toBeDefined();
    });

    it("should get room participants", async () => {
      // Создаем комнату
      const roomData = {
        roomCode: "test101",
        name: "Test Room 4",
        ownerId: 1
      };
      await createRoom(roomData);
      const room = await getRoomByCode("test101");

      // Добавляем участников
      await addParticipant({
        roomId: room!.id,
        userId: 1,
        userName: "Participant 1"
      });

      await addParticipant({
        roomId: room!.id,
        userId: 2,
        userName: "Participant 2"
      });

      const participants = await getRoomParticipants(room!.id);
      expect(participants).toHaveLength(2);
      expect(participants[0].userName).toBe("Participant 1");
      expect(participants[1].userName).toBe("Participant 2");
    });
  });

  describe("Chat Management", () => {
    it("should add chat message", async () => {
      // Создаем комнату
      const roomData = {
        roomCode: "test202",
        name: "Test Room 5",
        ownerId: 1
      };
      await createRoom(roomData);
      const room = await getRoomByCode("test202");

      // Добавляем сообщение
      const messageData = {
        roomId: room!.id,
        userId: 1,
        userName: "Test User",
        message: "Hello, world!"
      };

      const result = await addChatMessage(messageData);
      expect(result).toBeDefined();
    });

    it("should get chat messages", async () => {
      // Создаем комнату
      const roomData = {
        roomCode: "test303",
        name: "Test Room 6",
        ownerId: 1
      };
      await createRoom(roomData);
      const room = await getRoomByCode("test303");

      // Добавляем несколько сообщений
      await addChatMessage({
        roomId: room!.id,
        userId: 1,
        userName: "User 1",
        message: "First message"
      });

      await addChatMessage({
        roomId: room!.id,
        userId: 2,
        userName: "User 2",
        message: "Second message"
      });

      const messages = await getChatMessages(room!.id);
      expect(messages).toHaveLength(2);
      expect(messages[0].message).toBe("Second message"); // Новые сообщения первыми
      expect(messages[1].message).toBe("First message");
    });
  });
});

