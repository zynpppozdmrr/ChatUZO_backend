export type RoomUser = {
  userId: string;
  username: string;
  socketId: string;
};

export type TypingUser = {
  userId: string;
  username?: string;
  roomId: string;
};
