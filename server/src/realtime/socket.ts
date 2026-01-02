import { Server } from "socket.io";
import { socketAuthMiddleware } from "./middlewares/auth.middleware.js";
import { ensureUserInRoom } from "../services/roomAccess.service.js";
import { createMessage } from "../services/message.service.js";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/Realtime/socket.js";

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
        if (!access.ok) return ack?.({ ok: false, error: access.error });

        socket.join(roomId);
        console.log(`[join_room] ✅ User joined room ${roomId}`);
        ack?.({ ok: true });
      } catch (error) {
        console.error(`[join_room] error:`, error);
        ack?.({ ok: false, error: "JOIN_ROOM_FAILED" });
      }
    });

    socket.on("leave_room", ({ roomId }) => {
      socket.leave(roomId);
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
        
        // Odadaki herkese (gönderen dahil) mesajı broadcast et
        io.to(roomId).emit("receive_message", result.message);
        console.log(`[send_message] 📡 Broadcasted to room ${roomId}`);
        
        ack?.({ ok: true, messageId: result.message.id });
      } catch {
        ack?.({ ok: false, error: "SEND_MESSAGE_FAILED" });
      }
    });
  });
};
