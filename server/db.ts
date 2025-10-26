import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

import {
  rooms,
  InsertRoom,
  roomParticipants,
  InsertRoomParticipant,
  chatMessages,
  InsertChatMessage,
} from "../drizzle/schema";
import { desc } from "drizzle-orm";

// Создание комнаты
export async function createRoom(room: InsertRoom) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Database not available, using demo mode");
    // В демо-режиме выбрасываем ошибку, чтобы клиент мог использовать fallback
    throw new Error("Database not available - demo mode");
  }

  try {
    const result = await db.insert(rooms).values(room);
    return result;
  } catch (error) {
    console.warn("[Database] Database insert failed, using demo mode:", error);
    // В демо-режиме выбрасываем ошибку, чтобы клиент мог использовать fallback
    throw new Error("Database insert failed - demo mode");
  }
}

// Получение комнаты по коду
export async function getRoomByCode(roomCode: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Database not available, returning undefined");
    // В демо-режиме без БД возвращаем undefined - комната должна быть создана явно
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(rooms)
      .where(eq(rooms.roomCode, roomCode))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.warn("[Database] Database query failed:", error);
    // При ошибке возвращаем undefined
    return undefined;
  }
}

// Добавление участника в комнату
export async function addParticipant(participant: InsertRoomParticipant) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Database not available, using demo mode");
    return { success: true };
  }
  const result = await db.insert(roomParticipants).values(participant);
  return result;
}

// Получение участников комнаты
export async function getRoomParticipants(roomId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Database not available, using demo mode");
    return [];
  }
  return await db
    .select()
    .from(roomParticipants)
    .where(eq(roomParticipants.roomId, roomId));
}

// Добавление сообщения в чат
export async function addChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Database not available, using demo mode");
    return { success: true };
  }
  const result = await db.insert(chatMessages).values(message);
  return result;
}

// Получение сообщений чата
export async function getChatMessages(roomId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Database not available, using demo mode");
    return [];
  }
  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.roomId, roomId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(100);
}

// Обновление статуса участника
export async function updateParticipantStatus(
  participantId: number,
  isOnline: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Database not available, using demo mode");
    return { success: true };
  }
  return await db
    .update(roomParticipants)
    .set({ isOnline })
    .where(eq(roomParticipants.id, participantId));
}

// Получение всех комнат (не приватных)
export async function getAllRooms() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Database not available, using demo mode");
    // Возвращаем демо-комнаты
    return [
      {
        id: 1,
        roomCode: "demo123",
        name: "Демо комната 1",
        ownerId: 1,
        isActive: 1,
        createdAt: new Date(Date.now() - 86400000), // 1 день назад
      },
      {
        id: 2,
        roomCode: "demo456",
        name: "Демо комната 2",
        ownerId: 1,
        isActive: 1,
        createdAt: new Date(Date.now() - 172800000), // 2 дня назад
      },
    ];
  }

  try {
    const result = await db
      .select()
      .from(rooms)
      .where(eq(rooms.isActive, 1))
      .orderBy(desc(rooms.createdAt))
      .limit(10);
    return result;
  } catch (error) {
    console.warn("[Database] Database query failed, using demo mode:", error);
    // Возвращаем демо-комнаты при ошибке
    return [
      {
        id: 1,
        roomCode: "demo123",
        name: "Демо комната 1",
        ownerId: 1,
        isActive: 1,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: 2,
        roomCode: "demo456",
        name: "Демо комната 2",
        ownerId: 1,
        isActive: 1,
        createdAt: new Date(Date.now() - 172800000),
      },
    ];
  }
}
