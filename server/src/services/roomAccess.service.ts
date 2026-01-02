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

  const roomId = room.id; // Resolved UUID

  let participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { role: true, status: true },
  });

  // If not a participant, check if room is public and auto-join
  if (!participant) {
    if (!room.isPrivate) {
      try {
        participant = await prisma.roomParticipant.create({
          data: {
            roomId,
            userId,
            role: "MEMBER",
            status: "ACTIVE",
          },
          select: { role: true, status: true },
        });
      } catch (error) {
        // Handle race condition where user might have joined concurrently
        console.error("Auto-join failed:", error);
        return { ok: false as const, error: "JOIN_FAILED" };
      }
    } else {
      return { ok: false as const, error: "ROOM_ACCESS_DENIED" };
    }
  }

  if (participant.status === "BANNED") return { ok: false as const, error: "ROOM_BANNED" };

  return { ok: true as const, role: participant.role, status: participant.status, roomId };
}
