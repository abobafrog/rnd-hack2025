import {
  mysqlTable,
  int,
  varchar,
  datetime,
  tinyint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  openId: varchar("openId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 50 }),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: datetime("createdAt").notNull().default(new Date()),
  updatedAt: datetime("updatedAt").notNull().default(new Date()),
  lastSignedIn: datetime("lastSignedIn"),
});

export const rooms = mysqlTable("rooms", {
  id: int("id").primaryKey().autoincrement(),
  roomCode: varchar("roomCode", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: int("ownerId").notNull(),
  isActive: tinyint("isActive").default(1),
  createdAt: datetime("createdAt").notNull().default(new Date()),
  updatedAt: datetime("updatedAt").notNull().default(new Date()),
});

export const roomParticipants = mysqlTable("roomParticipants", {
  id: int("id").primaryKey().autoincrement(),
  roomId: int("roomId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  isOnline: tinyint("isOnline").default(1),
});

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").primaryKey().autoincrement(),
  roomId: int("roomId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  message: varchar("message", { length: 1000 }).notNull(),
  createdAt: datetime("createdAt").notNull().default(new Date()),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertRoomParticipant = typeof roomParticipants.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

