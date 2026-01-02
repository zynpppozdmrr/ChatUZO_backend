import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== "string") return next(new Error("AUTH_MISSING_TOKEN"));

    const payload = jwt.verify(token, env.JWT_SECRET) as any;

    const userId = payload.userId ?? payload.sub ?? payload.id;
    const role = payload.role;

    if (!userId || !role) return next(new Error("AUTH_INVALID_PAYLOAD"));

    socket.data.user = { userId, role };
    next();
  } catch {
    next(new Error("AUTH_INVALID_TOKEN"));
  }
};
