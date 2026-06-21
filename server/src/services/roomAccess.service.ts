import { prisma } from "../config/prisma.js";

export async function ensureUserInRoom(userId: string, roomIdOrSlug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomIdOrSlug);

  let room;
  if (isUuid) {
    room = await prisma.room.findUnique({ where: { id: roomIdOrSlug }, select: { id: true, isPrivate: true } });
  } else {
    room = await prisma.room.findUnique({ where: { slug: roomIdOrSlug }, select: { id: true, isPrivate: true } });
  }

  if (!room) return { ok: false as const, error: "ROOM_NOT_FOUND" };

  const roomId = room.id;

  let participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { role: true, status: true },
  });

  if (participant && participant.status === "BANNED") {
    return { ok: false as const, error: "ROOM_BANNED" };
  }

  if (!participant) {
    if (!room.isPrivate) {
      try {
        participant = await prisma.roomParticipant.create({
          data: { roomId, userId, role: "MEMBER", status: "ACTIVE" },
          select: { role: true, status: true },
        });
      } catch (error) {
        console.error("Auto-join failed:", error);
        return { ok: false as const, error: "JOIN_FAILED" };
      }
    } else {
      return { ok: false as const, error: "ROOM_ACCESS_DENIED" };
    }
  }

  return { ok: true as const, role: participant.role, status: participant.status, roomId };
}
