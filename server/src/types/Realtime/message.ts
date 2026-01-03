export type MessageDTO = {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  createdAt: Date;
  type: string;
  isDeleted: boolean;
  attachmentUrl?: string | null;
  attachment_url?: string | null;
};
