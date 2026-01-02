// Typing indicator ve online users için tipler

export type UserPresence = {
  userId: string;
  username?: string;
  socketId: string;
  lastSeen: Date;
};

export type TypingUser = {
  userId: string;
  username?: string;
  roomId: string;
};

export type RoomPresence = {
  roomId: string;
  onlineUsers: UserPresence[];
  typingUsers: TypingUser[];
};
