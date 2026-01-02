import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.query?.token as string);

  if (!token) {
    return next(new Error("AUTH_MISSING_TOKEN"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;

    const userId =
      payload.userId ??
      payload.id ??
      payload.sub;

    if (!userId) {
      return next(new Error("AUTH_INVALID_PAYLOAD"));
    }

    socket.data.user = {
      userId: String(userId),
      role: payload.role ?? "USER",
    };

    next();
  } catch {
    next(new Error("AUTH_INVALID_TOKEN"));
  }
};

