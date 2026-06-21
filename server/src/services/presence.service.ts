import type { RoomUser, TypingUser } from "../types/Realtime/presence.js";

// roomId -> (socketId -> RoomUser)
const roomUsers = new Map<string, Map<string, RoomUser>>();
// `${roomId}:${userId}` -> timeout
const typingUsers = new Map<string, NodeJS.Timeout>();

export function addRoomUser(roomId: string, socketId: string, userId: string, username: string): void {
  if (!roomUsers.has(roomId)) {
    roomUsers.set(roomId, new Map());
  }
  roomUsers.get(roomId)!.set(socketId, { userId, username, socketId });
}

export function removeRoomUser(roomId: string, socketId: string): void {
  const users = roomUsers.get(roomId);
  if (!users) return;
  users.delete(socketId);
  if (users.size === 0) {
    roomUsers.delete(roomId);
  }
}

export function getRoomUsers(roomId: string): RoomUser[] {
  const users = roomUsers.get(roomId);
  return users ? Array.from(users.values()) : [];
}

// Removes a socket from every room it was in; returns the affected roomIds.
export function removeSocketEverywhere(socketId: string): string[] {
  const affected: string[] = [];
  for (const [roomId, users] of roomUsers) {
    if (users.delete(socketId)) {
      affected.push(roomId);
      if (users.size === 0) {
        roomUsers.delete(roomId);
      }
    }
  }
  return affected;
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
