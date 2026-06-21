import type { UserPresence, TypingUser } from "../types/Realtime/presence.js";

const onlineUsers = new Map<string, UserPresence>();
const typingUsers = new Map<string, NodeJS.Timeout>();

export function addOnlineUser(socketId: string, userId: string, username?: string): void {
  onlineUsers.set(socketId, { userId, username, socketId, lastSeen: new Date() });
}

export function removeOnlineUser(socketId: string): UserPresence | undefined {
  const user = onlineUsers.get(socketId);
  if (user) {
    onlineUsers.delete(socketId);
  }
  return user;
}

export function getOnlineUsersInRoom(roomId: string, roomSockets: Set<string>): UserPresence[] {
  const users: UserPresence[] = [];
  for (const socketId of roomSockets) {
    const user = onlineUsers.get(socketId);
    if (user) {
      users.push(user);
    }
  }
  return users;
}

export function setUserTyping(roomId: string, userId: string, username?: string): TypingUser {
  const key = `${roomId}:${userId}`;

  const existingTimeout = typingUsers.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(() => {
    typingUsers.delete(key);
  }, 3000);

  typingUsers.set(key, timeout);

  return { userId, username, roomId };
}

export function clearUserTyping(roomId: string, userId: string): void {
  const key = `${roomId}:${userId}`;
  const timeout = typingUsers.get(key);
  if (timeout) {
    clearTimeout(timeout);
    typingUsers.delete(key);
  }
}

export function isUserTyping(roomId: string, userId: string): boolean {
  return typingUsers.has(`${roomId}:${userId}`);
}
