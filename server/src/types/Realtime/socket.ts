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
}
