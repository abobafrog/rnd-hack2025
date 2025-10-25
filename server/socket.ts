import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// Хранилище созданных комнат в памяти (для демо-режима)
export const createdRooms = new Set<string>();

export function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Хранилище имен пользователей по socket ID
  const userNames = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomCode: string, userName: string) => {
      socket.join(roomCode);
      userNames.set(socket.id, userName);
      
      // Отправляем список существующих участников новому пользователю
      const existingUsers: Array<{ socketId: string, userName: string }> = [];
      const room = io.sockets.adapter.rooms.get(roomCode);
      if (room) {
        room.forEach((socketId) => {
          if (socketId !== socket.id) {
            const existingUserName = userNames.get(socketId);
            if (existingUserName) {
              existingUsers.push({ socketId, userName: existingUserName });
            }
          }
        });
      }
      
      // Отправляем список существующих участников новому пользователю
      socket.emit("existing-users", existingUsers);
      
      // Уведомляем существующих участников о новом пользователе
      socket.to(roomCode).emit("user-joined", { socketId: socket.id, userName });
      console.log(`${userName} joined room ${roomCode}`);
    });

    socket.on("offer", (roomCode: string, offer: RTCSessionDescriptionInit, targetSocketId: string) => {
      const userName = userNames.get(socket.id) || "Unknown User";
      socket.to(targetSocketId).emit("offer", offer, socket.id, userName);
    });

    socket.on("answer", (roomCode: string, answer: RTCSessionDescriptionInit, targetSocketId: string) => {
      const userName = userNames.get(socket.id) || "Unknown User";
      socket.to(targetSocketId).emit("answer", answer, socket.id, userName);
    });

    socket.on("ice-candidate", (roomCode: string, candidate: RTCIceCandidateInit, targetSocketId: string) => {
      const userName = userNames.get(socket.id) || "Unknown User";
      socket.to(targetSocketId).emit("ice-candidate", candidate, socket.id, userName);
    });

    socket.on("chat-message", (data: { roomCode: string, messageId: string, userName: string, message: string, timestamp: Date }) => {
      socket.to(data.roomCode).emit("chat-message", data);
      console.log(`Chat message in ${data.roomCode} from ${data.userName}: ${data.message}`);
    });

    socket.on("chat-message-update", (data: { roomCode: string, messageId: string, message: string }) => {
      socket.to(data.roomCode).emit("chat-message-update", { messageId: data.messageId, message: data.message });
      console.log(`Chat message updated in ${data.roomCode}: ${data.messageId}`);
    });

    socket.on("chat-message-delete", (data: { roomCode: string, messageId: string }) => {
      socket.to(data.roomCode).emit("chat-message-delete", { messageId: data.messageId });
      console.log(`Chat message deleted in ${data.roomCode}: ${data.messageId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      const userName = userNames.get(socket.id);
      if (userName) {
        // Уведомляем всех участников комнаты о выходе пользователя
        socket.broadcast.emit("user-left", { socketId: socket.id, userName });
      }
      userNames.delete(socket.id);
    });
  });

  return io;
}

