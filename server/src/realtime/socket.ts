import { Server } from "socket.io";
import { socketAuthMiddleware } from "./middlewares/auth.middleware.js";
import { ensureUserInRoom } from "../services/roomAccess.service.js";
import { createMessage } from "../services/message.service.js";
import { getRoomParticipants } from "../services/room.service.js";
import { setUserTyping, clearUserTyping } from "../services/presence.service.js";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/Realtime/socket.js";

const roomUsers = new Map<string, Map<string, { userId: string; username: string; socketId: string }>>();

const ACCESS_ERROR_MESSAGES: Record<string, string> = {
  PARTICIPANT_MUTED: 'Sessize alındığınız için mesaj gönderemezsiniz.',
  PARTICIPANT_BANNED: 'Banlandığınız için bu odaya erişemezsiniz.',
  ROOM_BANNED: 'Bu odaya banlandığınız için erişemezsiniz. Owner banınızı açana kadar giriş yapamazsınız.',
  ROOM_ACCESS_DENIED: 'Bu odaya erişim izniniz yok.',
  ROOM_NOT_FOUND: 'Oda bulunamadı.',
};

const accessError = (error: string) => ACCESS_ERROR_MESSAGES[error] ?? 'İşlem gerçekleştirilemedi.';

export const setupSocketIO = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.data.user;

    socket.on("join_room", async ({ roomId }, ack) => {
      try {
        if (!user?.userId) return ack?.({ ok: false, error: "UNAUTHORIZED" });

        const access = await ensureUserInRoom(user.userId, roomId);
        if (!access.ok) {
          return ack?.({ ok: false, error: access.error, message: accessError(access.error) });
        }

        const resolvedRoomId = access.roomId;
        socket.join(resolvedRoomId);

        const participantsResult = await getRoomParticipants(resolvedRoomId);
        const participantIds = participantsResult.participants.map((p) => p.userId);

        if (participantIds.includes(user.userId)) {
          if (!roomUsers.has(resolvedRoomId)) {
            roomUsers.set(resolvedRoomId, new Map());
          }
          roomUsers.get(resolvedRoomId)!.set(socket.id, {
            userId: user.userId,
            username: user.username || 'Anonymous',
            socketId: socket.id,
          });
        }

        socket.to(resolvedRoomId).emit("user_joined", {
          userId: user.userId,
          username: user.username,
          roomId: resolvedRoomId,
        });

        const onlineUsers = roomUsers.has(resolvedRoomId)
          ? Array.from(roomUsers.get(resolvedRoomId)!.values())
          : [];

        ack?.({ ok: true, onlineUsers });
        io.to(resolvedRoomId).emit("online_users", { roomId: resolvedRoomId, users: onlineUsers });
      } catch (error) {
        console.error(`[join_room] Error:`, error);
        ack?.({ ok: false, error: "JOIN_ROOM_FAILED", message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    socket.on("get_online_users", ({ roomId }) => {
      const onlineUsers = roomUsers.has(roomId)
        ? Array.from(roomUsers.get(roomId)!.values())
        : [];
      socket.emit("online_users", { roomId, users: onlineUsers });
    });

    socket.on("leave_room", ({ roomId }) => {
      socket.leave(roomId);

      if (roomUsers.has(roomId) && user?.userId) {
        roomUsers.get(roomId)!.delete(socket.id);

        socket.to(roomId).emit("user_left", { userId: user.userId, username: user.username, roomId });

        const onlineUsers = Array.from(roomUsers.get(roomId)!.values());
        io.to(roomId).emit("online_users", { roomId, users: onlineUsers });

        if (roomUsers.get(roomId)!.size === 0) {
          roomUsers.delete(roomId);
        }

        clearUserTyping(roomId, user.userId);
      }
    });

    socket.on("send_message", async ({ roomId, content, type, attachment_url }, ack) => {
      try {
        if (!user?.userId) return ack?.({ ok: false, error: "UNAUTHORIZED" });

        const access = await ensureUserInRoom(user.userId, roomId);
        if (!access.ok) {
          return ack?.({ ok: false, error: access.error, message: accessError(access.error) });
        }

        const resolvedRoomId = access.roomId;

        const result = await createMessage({
          userId: user.userId,
          roomId: resolvedRoomId,
          content,
          type,
          attachmentUrl: attachment_url,
        });

        if (!result.ok) {
          return ack?.({ ok: false, error: result.error, message: accessError(result.error) });
        }

        clearUserTyping(resolvedRoomId, user.userId);
        socket.to(resolvedRoomId).emit("user_stopped_typing", { userId: user.userId, roomId: resolvedRoomId });

        io.to(resolvedRoomId).emit("receive_message", { ...result.message, roomId: resolvedRoomId });

        ack?.({ ok: true, messageId: result.message.id });
      } catch (error) {
        console.error('[send_message] ERROR:', error);
        ack?.({ ok: false, error: "SEND_MESSAGE_FAILED", message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    socket.on("typing_start", async ({ roomId }) => {
      if (!user?.userId) return;

      try {
        const access = await ensureUserInRoom(user.userId, roomId);
        if (!access.ok) return;

        const resolvedRoomId = access.roomId;
        setUserTyping(resolvedRoomId, user.userId);
        socket.to(resolvedRoomId).emit("user_typing", {
          userId: user.userId,
          username: user.username || 'Anonymous',
          roomId: resolvedRoomId,
        });
      } catch (error) {
        console.error('[typing_start] Error:', error);
      }
    });

    socket.on("typing_stop", async ({ roomId }) => {
      if (!user?.userId) return;

      try {
        const access = await ensureUserInRoom(user.userId, roomId);
        if (!access.ok) return;

        const resolvedRoomId = access.roomId;
        clearUserTyping(resolvedRoomId, user.userId);
        socket.to(resolvedRoomId).emit("user_stopped_typing", {
          userId: user.userId,
          username: user.username || 'Anonymous',
          roomId: resolvedRoomId,
        });
      } catch (error) {
        console.error('[typing_stop] Error:', error);
      }
    });

    socket.on("disconnect", () => {
      roomUsers.forEach((users, roomId) => {
        if (users.has(socket.id) && user?.userId) {
          users.delete(socket.id);

          socket.to(roomId).emit("user_left", { userId: user.userId, username: user.username, roomId });

          const onlineUsers = Array.from(users.values());
          io.to(roomId).emit("online_users", { roomId, users: onlineUsers });

          if (users.size === 0) {
            roomUsers.delete(roomId);
          }

          clearUserTyping(roomId, user.userId);
        }
      });
    });
  });
};
