export type PlatformRole = "USER" | "ADMIN";

export type TokenPayload = {
  userId: string;
  role: PlatformRole;
};

// Socket.io event types
export interface ClientToServerEvents {
  join_room: (data: { roomId: string }, ack?: (res: { ok: boolean; error?: string }) => void) => void;
  leave_room: (data: { roomId: string }) => void;
  send_message: (
    data: { roomId: string; content: string },
    ack?: (res: { ok: boolean; error?: string; messageId?: string }) => void
  ) => void;
  typing_start: (data: { roomId: string }) => void;
  typing_stop: (data: { roomId: string }) => void;
}

export interface ServerToClientEvents {
  receive_message: (data: {
    id: string;
    roomId: string;
    userId: string;
    content: string;
    createdAt: Date;
    type: string;
    isDeleted: boolean;
  }) => void;
  user_typing: (data: { userId: string; username?: string; roomId: string }) => void;
  user_stopped_typing: (data: { userId: string; roomId: string }) => void;
  user_joined: (data: { userId: string; username?: string; roomId: string }) => void;
  user_left: (data: { userId: string; roomId: string }) => void;
  online_users: (data: { roomId: string; users: Array<{ userId: string; username?: string }> }) => void;
}
