import { prisma } from "../config/prisma.js";

export async function ensureUserInRoom(userId: string, roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { id: true } });
  if (!room) return { ok: false as const, error: "ROOM_NOT_FOUND" };

  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { role: true, status: true },
  });

  if (!participant) return { ok: false as const, error: "ROOM_ACCESS_DENIED" };
  if (participant.status === "BANNED") return { ok: false as const, error: "ROOM_BANNED" };

  return { ok: true as const, role: participant.role, status: participant.status };
}
