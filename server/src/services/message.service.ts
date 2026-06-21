import { prisma } from "../config/prisma.js";
import { ensureUserInRoom } from "./roomAccess.service.js";
import type { MessageDTO } from "../types/Realtime/message.js";
import { filterMessage } from "../utils/profanityFilter.js";

export async function createMessage(params: {
  userId: string;
  roomId: string;
  content: string;
  type?: string;
  attachmentUrl?: string;
}) {
  const { userId, roomId, content, type = 'TEXT', attachmentUrl } = params;

  const access = await ensureUserInRoom(userId, roomId);
  if (!access.ok) return { ok: false as const, error: access.error };

  const resolvedRoomId = access.roomId;

  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId: resolvedRoomId, userId } },
  });

  if (participant?.status === 'MUTED') {
    return { ok: false as const, error: 'PARTICIPANT_MUTED' };
  }
  if (participant?.status === 'BANNED') {
    return { ok: false as const, error: 'PARTICIPANT_BANNED' };
  }

  const room = await prisma.room.findUnique({
    where: { id: resolvedRoomId },
    select: { logicConfig: true },
  });

  const logicConfig = room?.logicConfig as any;
  const profanityFilterEnabled = logicConfig?.profanityFilter === true;
  const filteredContent = profanityFilterEnabled ? filterMessage(content, true) : content;

  const message = await prisma.message.create({
    data: {
      userId,
      roomId: resolvedRoomId,
      content: filteredContent,
      type: (type?.toUpperCase() || 'TEXT') as any,
      attachmentUrl: attachmentUrl || null,
    },
    include: {
      user: { select: { username: true, avatarUrl: true } },
    },
  });

  const dto: MessageDTO & { sender: any } = {
    id: message.id,
    roomId: message.roomId,
    userId: message.userId,
    content: message.content,
    createdAt: message.createdAt,
    type: message.type,
    isDeleted: message.isDeleted,
    attachmentUrl: message.attachmentUrl,
    attachment_url: message.attachmentUrl,
    sender: message.user,
  };

  return { ok: true as const, message: dto };
}

export async function getRoomMessages(params: { userId: string; roomId: string; limit?: number; cursor?: string }) {
  const { userId, roomId, limit = 20, cursor } = params;

  const access = await ensureUserInRoom(userId, roomId);
  if (!access.ok) return { ok: false as const, error: access.error };

  const resolvedRoomId = access.roomId;
  const take = Math.min(Math.max(limit, 1), 100);

  const messages = await prisma.message.findMany({
    where: { roomId: resolvedRoomId },
    orderBy: { createdAt: "asc" },
    take: take + 1,
    include: {
      user: { select: { username: true, avatarUrl: true } },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > take;
  const items = hasMore ? messages.slice(0, take) : messages;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const dto = items.map((m) => ({
    id: m.id,
    roomId: m.roomId,
    userId: m.userId,
    content: m.content,
    createdAt: m.createdAt,
    type: m.type,
    isDeleted: m.isDeleted,
    attachmentUrl: m.attachmentUrl,
    attachment_url: m.attachmentUrl,
    sender: m.user,
  }));

  return { ok: true as const, messages: dto, nextCursor };
}
