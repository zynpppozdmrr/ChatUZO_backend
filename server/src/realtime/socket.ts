import { Server } from "socket.io";
import { socketAuthMiddleware } from "./middlewares/auth.middleware.js";
import { ensureUserInRoom } from "../services/roomAccess.service.js";
import { createMessage } from "../services/message.service.js";
import { getRoomParticipants } from "../services/room.service.js";
import { setUserTyping, clearUserTyping } from "../services/presence.service.js";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/Realtime/socket.js";

// Room-specific online users tracking: roomId -> Map<socketId, { userId, username, socketId }>
const roomUsers = new Map<string, Map<string, { userId: string; username: string; socketId: string }>>();

export const setupSocketIO = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`connected socket=${socket.id} userId=${user?.userId}`);

    socket.on("join_room", async ({ roomId }, ack) => {
      try {
        if (!user?.userId) return ack?.({ ok: false, error: "UNAUTHORIZED" });

        console.log(`[join_room] userId=${user.userId}, roomId=${roomId}`);
        const access = await ensureUserInRoom(user.userId, roomId);
        console.log(`[join_room] access result:`, access);
        
        if (!access.ok) {
          const errorMessages: Record<string, string> = {
            'ROOM_BANNED': 'Bu odaya banlandığınız için erişemezsiniz. Owner tarafından banınız açılana kadar giriş yapamaz.',
            'ROOM_ACCESS_DENIED': 'Bu odaya erişim izniniz yok.',
            'ROOM_NOT_FOUND': 'Oda bulunamadı.'
          };
          return ack?.({ ok: false, error: access.error, message: errorMessages[access.error] });
        }

        // ensureUserInRoom'dan gelen resolved roomId (UUID) kullan
        const resolvedRoomId = access.roomId;

        // Room'a katıl
        socket.join(resolvedRoomId);
        console.log(`[join_room] ✅ User joined room ${resolvedRoomId}`);

        // Bu room'un participants'larını DB'den çek (resolved UUID ile)
        const participantsResult = await getRoomParticipants(resolvedRoomId);
        const participantIds = participantsResult.participants.map(p => p.userId);

        // Room users map'ine ekle (sadece participant olan kullanıcıyı)
        if (participantIds.includes(user.userId)) {
          if (!roomUsers.has(resolvedRoomId)) {
            roomUsers.set(resolvedRoomId, new Map());
          }

          roomUsers.get(resolvedRoomId)!.set(socket.id, {
            userId: user.userId,
            username: user.username || 'Anonymous',
            socketId: socket.id
          });

          console.log(`[join_room] Added user to roomUsers: roomId=${resolvedRoomId}, userId=${user.userId}`);
        }

        // Odadaki diğer kullanıcılara bildir
        socket.to(resolvedRoomId).emit("user_joined", { 
          userId: user.userId, 
          username: user.username,
          roomId: resolvedRoomId
        });

        // O odanın online users listesini döndür
        const onlineUsers = roomUsers.has(resolvedRoomId) 
          ? Array.from(roomUsers.get(resolvedRoomId)!.values())
          : [];

        ack?.({ ok: true, onlineUsers });

        // Tüm room'a güncel listeyi gönder
        io.to(resolvedRoomId).emit("online_users", {
          roomId: resolvedRoomId,
          users: onlineUsers
        });

        console.log(`[join_room] 📋 Online users in room ${resolvedRoomId}:`, onlineUsers.length);
      } catch (error) {
        console.error(`[join_room] Error:`, error);
        ack?.({ ok: false, error: "JOIN_ROOM_FAILED", message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Get online users for a specific room
    socket.on("get_online_users", ({ roomId }) => {
      console.log(`[get_online_users] roomId=${roomId}`);
      
      const onlineUsers = roomUsers.has(roomId) 
        ? Array.from(roomUsers.get(roomId)!.values())
        : [];

      socket.emit("online_users", {
        roomId,
        users: onlineUsers
      });

      console.log(`[get_online_users] Sent ${onlineUsers.length} online users for room ${roomId}`);
    });

    socket.on("leave_room", ({ roomId }) => {
      console.log(`[leave_room] userId=${user?.userId}, roomId=${roomId}`);
      socket.leave(roomId);

      if (roomUsers.has(roomId) && user?.userId) {
        roomUsers.get(roomId)!.delete(socket.id);

        // Odadakilere bildir
        socket.to(roomId).emit("user_left", {
          userId: user.userId,
          username: user.username,
          roomId
        });

        // Güncel listeyi gönder
        const onlineUsers = Array.from(roomUsers.get(roomId)!.values());
        io.to(roomId).emit("online_users", {
          roomId,
          users: onlineUsers
        });

        // Room boşsa map'ten sil
        if (roomUsers.get(roomId)!.size === 0) {
          roomUsers.delete(roomId);
          console.log(`[leave_room] Room ${roomId} is now empty, deleted from map`);
        }

        clearUserTyping(roomId, user.userId);
        console.log(`[leave_room] User ${user.userId} left room ${roomId}`);
      }
    });

    socket.on("send_message", async ({ roomId, content }, ack) => {
      try {
        if (!user?.userId) return ack?.({ ok: false, error: "UNAUTHORIZED" });

        console.log(`[send_message] userId=${user.userId}, roomId=${roomId}, content=${content}`);
        
        // ÖNCE roomId'yi resolve et (slug -> UUID)
        const access = await ensureUserInRoom(user.userId, roomId);
        if (!access.ok) {
          const errorMessages: Record<string, string> = {
            'PARTICIPANT_MUTED': 'Sessize alındığınız için mesaj gönderemezsiniz.',
            'PARTICIPANT_BANNED': 'Banlandığınız için bu odaya erişemezsiniz.',
            'ROOM_BANNED': 'Bu odaya erişim izniniz yok.',
            'ROOM_NOT_FOUND': 'Oda bulunamadı.',
            'ROOM_ACCESS_DENIED': 'Bu odaya erişim izniniz yok.'
          };
          return ack?.({ ok: false, error: access.error, message: errorMessages[access.error] || 'Mesaj gönderilemedi.' });
        }
        
        const resolvedRoomId = access.roomId; // UUID
        
        const result = await createMessage({ userId: user.userId, roomId: resolvedRoomId, content });
        console.log(`[send_message] result:`, result);
        
        if (!result.ok) {
          const errorMessages: Record<string, string> = {
            'PARTICIPANT_MUTED': 'Sessize alındığınız için mesaj gönderemezsiniz.',
            'PARTICIPANT_BANNED': 'Banlandığınız için bu odaya erişemezsiniz.',
            'ROOM_BANNED': 'Bu odaya erişim izniniz yok.',
            'ROOM_NOT_FOUND': 'Oda bulunamadı.',
            'ROOM_ACCESS_DENIED': 'Bu odaya erişim izniniz yok.'
          };
          return ack?.({ ok: false, error: result.error, message: errorMessages[result.error] || 'Mesaj gönderilemedi.' });
        }

        console.log(`[send_message] ✅ Message saved to DB! messageId=${result.message.id}`);
        console.log(`[send_message] 📝 Message details:`, JSON.stringify(result.message, null, 2));

        // Clear typing indicator when message is sent
        clearUserTyping(resolvedRoomId, user.userId);
        socket.to(resolvedRoomId).emit("user_stopped_typing", { userId: user.userId, roomId: resolvedRoomId });

        // RESOLVED UUID ILE BROADCAST ET!
        io.to(resolvedRoomId).emit("receive_message", { ...result.message, roomId: resolvedRoomId });
        console.log(`[send_message] 📡 Broadcasted to room ${resolvedRoomId}`);

        ack?.({ ok: true, messageId: result.message.id });
      } catch (error) {
        console.error('[send_message] ERROR:', error);
        ack?.({ ok: false, error: "SEND_MESSAGE_FAILED", message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    socket.on("typing_start", async ({ roomId }) => {
      if (!user?.userId) return;

      try {
        // RoomId'yi resolve et (slug -> UUID)
        const access = await ensureUserInRoom(user.userId, roomId);
        if (!access.ok) return;
        
        const resolvedRoomId = access.roomId;

        setUserTyping(resolvedRoomId, user.userId);
        socket.to(resolvedRoomId).emit("user_typing", { 
          userId: user.userId, 
          username: user.username || 'Anonymous',
          roomId: resolvedRoomId
        });
        console.log(`[typing_start] User ${user.userId} typing in ${resolvedRoomId}`);
      } catch (error) {
        console.error('[typing_start] Error:', error);
      }
    });

    socket.on("typing_stop", async ({ roomId }) => {
      if (!user?.userId) return;

      try {
        // RoomId'yi resolve et (slug -> UUID)
        const access = await ensureUserInRoom(user.userId, roomId);
        if (!access.ok) return;
        
        const resolvedRoomId = access.roomId;

        clearUserTyping(resolvedRoomId, user.userId);
        socket.to(resolvedRoomId).emit("user_stopped_typing", { 
          userId: user.userId, 
          username: user.username || 'Anonymous',
          roomId: resolvedRoomId
        });
        console.log(`[typing_stop] User ${user.userId} stopped typing in ${resolvedRoomId}`);
      } catch (error) {
        console.error('[typing_stop] Error:', error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[disconnect] socket=${socket.id} userId=${user?.userId}`);

      // Kullanıcının olduğu tüm room'lardan çıkar
      roomUsers.forEach((users, roomId) => {
        if (users.has(socket.id) && user?.userId) {
          users.delete(socket.id);

          socket.to(roomId).emit("user_left", {
            userId: user.userId,
            username: user.username,
            roomId
          });

          const onlineUsers = Array.from(users.values());
          io.to(roomId).emit("online_users", {
            roomId,
            users: onlineUsers
          });

          if (users.size === 0) {
            roomUsers.delete(roomId);
            console.log(`[disconnect] Room ${roomId} is now empty, deleted from map`);
          }

          clearUserTyping(roomId, user.userId);
          console.log(`[disconnect] User ${user.userId} removed from room ${roomId}`);
        }
      });
    });
  });
};
