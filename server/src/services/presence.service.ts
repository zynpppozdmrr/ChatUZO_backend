import type { UserPresence, TypingUser } from "../types/Realtime/presence.js";

// In-memory store for online users and typing indicators
const onlineUsers = new Map<string, UserPresence>(); // socketId -> UserPresence
const typingUsers = new Map<string, NodeJS.Timeout>(); // `${roomId}:${userId}` -> timeout

/**
 * Online Users Management
 */
export function addOnlineUser(socketId: string, userId: string, username?: string): void {
  onlineUsers.set(socketId, {
    userId,
    username,
    socketId,
    lastSeen: new Date(),
  });
  console.log(`[Presence] ✅ User online: ${username || userId} (socket: ${socketId})`);
}

export function removeOnlineUser(socketId: string): UserPresence | undefined {
  const user = onlineUsers.get(socketId);
  if (user) {
    onlineUsers.delete(socketId);
    console.log(`[Presence] ❌ User offline: ${user.username || user.userId}`);
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

/**
 * Typing Indicator Management
 */
export function setUserTyping(roomId: string, userId: string, username?: string): TypingUser {
  const key = `${roomId}:${userId}`;
  
  // Clear existing timeout
  const existingTimeout = typingUsers.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Auto-clear after 3 seconds
  const timeout = setTimeout(() => {
    typingUsers.delete(key);
    console.log(`[Presence] ⌛ Typing timeout: ${username || userId} in ${roomId}`);
  }, 3000);

  typingUsers.set(key, timeout);
  console.log(`[Presence] ⌨️ User typing: ${username || userId} in ${roomId}`);

  return { userId, username, roomId };
}

export function clearUserTyping(roomId: string, userId: string): void {
  const key = `${roomId}:${userId}`;
  const timeout = typingUsers.get(key);
  if (timeout) {
    clearTimeout(timeout);
    typingUsers.delete(key);
    console.log(`[Presence] 🛑 Typing stopped: ${userId} in ${roomId}`);
  }
}

export function isUserTyping(roomId: string, userId: string): boolean {
  const key = `${roomId}:${userId}`;
  return typingUsers.has(key);
}
