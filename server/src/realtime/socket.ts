import { Server } from "socket.io";
import { socketAuthMiddleware } from "./middlewares/auth.middleware.js";
import { ensureUserInRoom } from "../services/roomAccess.service.js";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/Realtime/socket.js";

export const setupSocketIO = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  // GEÇICI: Test için auth devre dışı
  // io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`connected socket=${socket.id} userId=${user?.userId}`);

    socket.on("join_room", async ({ roomId }, ack) => {
      try {
        if (!user?.userId) return ack?.({ ok: false, error: "UNAUTHORIZED" });

        const access = await ensureUserInRoom(user.userId, roomId);
        if (!access.ok) return ack?.({ ok: false, error: access.error });

        socket.join(roomId);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, error: "JOIN_ROOM_FAILED" });
      }
    });

    socket.on("leave_room", ({ roomId }) => {
      socket.leave(roomId);
    });
  });
};
