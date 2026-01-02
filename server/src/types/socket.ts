import type { MessageData } from "./chat.js";

export interface ClientToServerEvents {
  room: (roomName: string) => void;
  message: (data: MessageData) => void;
}

export interface ServerToClientEvents {
  messageReturn: (data: MessageData) => void;
}
