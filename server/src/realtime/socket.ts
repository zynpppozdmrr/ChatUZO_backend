import { Server } from "socket.io";
import { socketAuthMiddleware } from "./middlewares/auth.middleware.js";
import { ensureUserInRoom } from "../services/roomAccess.service.js";
import { createMessage } from "../services/message.service.js";
import { addOnlineUser, removeOnlineUser, getOnlineUsersInRoom, setUserTyping, clearUserTyping } from "../services/presence.service.js";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/Realtime/socket.js";

export const setupSocketIO = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`connected socket=${socket.id} userId=${user?.userId}`);

    // Add user to online users
    if (user?.userId) {
      addOnlineUser(socket.id, user.userId);
    }

    socket.on("join_room", async ({ roomId }, ack) => {
      try {
        if (!user?.userId) return ack?.({ ok: false, error: "UNAUTHORIZED" });

        console.log(`[join_room] userId=${user.userId}, roomId=${roomId}`);
        const access = await ensureUserInRoom(user.userId, roomId);
        console.log(`[join_room] access result:`, access);
        if (!access.ok) return ack?.({ ok: false, error: access.error });

        socket.join(roomId);
        console.log(`[join_room] ✅ User joined room ${roomId}`);
        
        // Notify others in room
        socket.to(roomId).emit("user_joined", { userId: user.userId, roomId });
        
        // Send online users list to the user who just joined
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (roomSockets) {
          const onlineUsers = getOnlineUsersInRoom(roomId, roomSockets);
          socket.emit("online_users", {
            roomId,
            users: onlineUsers.map(u => ({ userId: u.userId, username: u.username }))
          });
        }
        
        ack?.({ ok: true });
      } catch (error) {
        console.error(`[join_room] error:`, error);
        ack?.({ ok: false, error: "JOIN_ROOM_FAILED" });
      }
    });

    socket.on("leave_room", ({ roomId }) => {
      socket.leave(roomId);
      
      // Notify others in room
      if (user?.userId) {
        socket.to(roomId).emit("user_left", { userId: user.userId, roomId });
        clearUserTyping(roomId, user.userId);
      }
    });

    socket.on("send_message", async ({ roomId, content }, ack) => {
      try {
        if (!user?.userId) return ack?.({ ok: false, error: "UNAUTHORIZED" });

        console.log(`[send_message] userId=${user.userId}, roomId=${roomId}, content=${content}`);
        const result = await createMessage({ userId: user.userId, roomId, content });
        console.log(`[send_message] result:`, result);
        if (!result.ok) return ack?.({ ok: false, error: result.error });

        console.log(`[send_message] ✅ Message saved to DB! messageId=${result.message.id}`);
        console.log(`[send_message] 📝 Message details:`, JSON.stringify(result.message, null, 2));
        
        // Clear typing indicator when message is sent
        clearUserTyping(roomId, user.userId);
        socket.to(roomId).emit("user_stopped_typing", { userId: user.userId, roomId });
        
        // Odadaki herkese (gönderen dahil) mesajı broadcast et
        io.to(roomId).emit("receive_message", result.message);
        console.log(`[send_message] 📡 Broadcasted to room ${roomId}`);
        
        ack?.({ ok: true, messageId: result.message.id });
      } catch {
        ack?.({ ok: false, error: "SEND_MESSAGE_FAILED" });
      }
    });

    socket.on("typing_start", ({ roomId }) => {
      if (!user?.userId) return;
      
      setUserTyping(roomId, user.userId);
      socket.to(roomId).emit("user_typing", { userId: user.userId, roomId });
      console.log(`[typing_start] User ${user.userId} typing in ${roomId}`);
    });

    socket.on("typing_stop", ({ roomId }) => {
      if (!user?.userId) return;
      
      clearUserTyping(roomId, user.userId);
      socket.to(roomId).emit("user_stopped_typing", { userId: user.userId, roomId });
      console.log(`[typing_stop] User ${user.userId} stopped typing in ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[disconnect] socket=${socket.id} userId=${user?.userId}`);
      
      // Remove from online users
      const offlineUser = removeOnlineUser(socket.id);
      
      // Notify all rooms this user was in
      if (offlineUser) {
        const rooms = Array.from(socket.rooms);
        rooms.forEach(roomId => {
          if (roomId !== socket.id) {
            socket.to(roomId).emit("user_left", { userId: offlineUser.userId, roomId });
            clearUserTyping(roomId, offlineUser.userId);
          }
        });
      }
    });
  });
};
