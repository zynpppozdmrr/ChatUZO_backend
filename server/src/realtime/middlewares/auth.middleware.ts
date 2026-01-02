import { Socket } from "socket.io";

/**
 * Socket authentication middleware
 * 
 * TODO:
 * - JWT doğrulama
 * - Tenant kontrolü
 * - Role / permission kontrolü
 */
export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  // Şimdilik herkese izin veriyoruz
  next();
};
