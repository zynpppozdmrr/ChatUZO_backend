import { Server, Socket } from "socket.io";
import type { DefaultEventsMap } from "socket.io";
import { socketAuthMiddleware } from "./middlewares/auth.middleware.js";
import { ensureUserInRoom } from "../services/roomAccess.service.js";
import { createMessage } from "../services/message.service.js";
import {
  addRoomUser,
  removeRoomUser,
  getRoomUsers,
  removeSocketEverywhere,
  setUserTyping,
  clearUserTyping,
} from "../services/presence.service.js";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "../types/Realtime/socket.js";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>;

const ACCESS_ERROR_MESSAGES: Record<string, string> = {
  PARTICIPANT_MUTED: 'Sessize alındığınız için mesaj gönderemezsiniz.',
  PARTICIPANT_BANNED: 'Banlandığınız için bu odaya erişemezsiniz.',
  ROOM_BANNED: 'Bu odaya banlandığınız için erişemezsiniz. Owner banınızı açana kadar giriş yapamazsınız.',
  ROOM_ACCESS_DENIED: 'Bu odaya erişim izniniz yok.',
  ROOM_NOT_FOUND: 'Oda bulunamadı.',
};

const accessError = (error: string) => ACCESS_ERROR_MESSAGES[error] ?? 'İşlem gerçekleştirilemedi.';

// Resolves a roomId/slug to its UUID, caching the result per-socket to avoid
// repeated DB lookups on high-frequency events (typing, leave, etc).
const resolveRoomId = async (socket: AppSocket, roomId: string): Promise<string | null> => {
  const cached = socket.data.roomCache.get(roomId);
  if (cached) return cached;

  const access = await ensureUserInRoom(socket.data.user.userId, roomId);
  if (!access.ok) return null;

  socket.data.roomCache.set(roomId, access.roomId);
  return access.roomId;
};

export const setupSocketIO = (io: AppServer) => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    socket.data.roomCache = new Map();

    socket.on("join_room", async ({ roomId }, ack) => {
      try {
        const access = await ensureUserInRoom(user.userId, roomId);
        if (!access.ok) {
          return ack?.({ ok: false, error: access.error, message: accessError(access.error) });
        }

        const resolvedRoomId = access.roomId;
        socket.data.roomCache.set(roomId, resolvedRoomId);
        socket.join(resolvedRoomId);
        addRoomUser(resolvedRoomId, socket.id, user.userId, user.username || 'Anonymous');

        socket.to(resolvedRoomId).emit("user_joined", {
          userId: user.userId,
          username: user.username,
          roomId: resolvedRoomId,
        });

        const onlineUsers = getRoomUsers(resolvedRoomId);
        ack?.({ ok: true, onlineUsers });
        io.to(resolvedRoomId).emit("online_users", { roomId: resolvedRoomId, users: onlineUsers });
      } catch (error) {
        console.error('[join_room] Error:', error);
        ack?.({ ok: false, error: "JOIN_ROOM_FAILED", message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    socket.on("get_online_users", async ({ roomId }) => {
      const resolvedRoomId = await resolveRoomId(socket, roomId);
      if (!resolvedRoomId) return;
      socket.emit("online_users", { roomId: resolvedRoomId, users: getRoomUsers(resolvedRoomId) });
    });

    socket.on("leave_room", async ({ roomId }) => {
      const resolvedRoomId = await resolveRoomId(socket, roomId);
      if (!resolvedRoomId) return;

      socket.leave(resolvedRoomId);
      removeRoomUser(resolvedRoomId, socket.id);
      clearUserTyping(resolvedRoomId, user.userId);

      socket.to(resolvedRoomId).emit("user_left", { userId: user.userId, username: user.username, roomId: resolvedRoomId });
      io.to(resolvedRoomId).emit("online_users", { roomId: resolvedRoomId, users: getRoomUsers(resolvedRoomId) });
    });

    socket.on("send_message", async ({ roomId, content, type, attachment_url }, ack) => {
      try {
        const result = await createMessage({
          userId: user.userId,
          roomId,
          content,
          type,
          attachmentUrl: attachment_url,
        });

        if (!result.ok) {
          return ack?.({ ok: false, error: result.error, message: accessError(result.error) });
        }

        const resolvedRoomId = result.message.roomId;
        socket.data.roomCache.set(roomId, resolvedRoomId);

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
      const resolvedRoomId = await resolveRoomId(socket, roomId);
      if (!resolvedRoomId) return;

      setUserTyping(resolvedRoomId, user.userId);
      socket.to(resolvedRoomId).emit("user_typing", {
        userId: user.userId,
        username: user.username || 'Anonymous',
        roomId: resolvedRoomId,
      });
    });

    socket.on("typing_stop", async ({ roomId }) => {
      const resolvedRoomId = await resolveRoomId(socket, roomId);
      if (!resolvedRoomId) return;

      clearUserTyping(resolvedRoomId, user.userId);
      socket.to(resolvedRoomId).emit("user_stopped_typing", {
        userId: user.userId,
        username: user.username || 'Anonymous',
        roomId: resolvedRoomId,
      });
    });

    socket.on("disconnect", () => {
      for (const roomId of removeSocketEverywhere(socket.id)) {
        clearUserTyping(roomId, user.userId);
        socket.to(roomId).emit("user_left", { userId: user.userId, username: user.username, roomId });
        io.to(roomId).emit("online_users", { roomId, users: getRoomUsers(roomId) });
      }
    });
  });
};
