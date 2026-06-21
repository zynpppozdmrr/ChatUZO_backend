import { prisma } from '../config/prisma.js';
import type { CreateRoomDto } from '../types/Room/room.type.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const ROLE_RANK: Record<string, number> = {
  OWNER: 3,
  ROOM_ADMIN: 2,
  ROOM_MODERATOR: 1,
  MEMBER: 0,
};

const rankOf = (role: string | null): number => (role ? ROLE_RANK[role] ?? 0 : -1);

const getRoomRole = async (roomId: string, userId: string): Promise<string | null> => {
  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { role: true },
  });
  return participant?.role ?? null;
};

const getRequesterRank = async (
  roomId: string,
  ownerId: string,
  requestingUserId: string,
  isAdmin: boolean
): Promise<number> => {
  if (isAdmin) return Infinity;
  if (ownerId === requestingUserId) return ROLE_RANK.OWNER;
  return rankOf(await getRoomRole(roomId, requestingUserId));
};

export const createRoom = async (ownerId: string, data: CreateRoomDto) => {
  const { name, slug, isPrivate, password, allowedDomains, uiSettings, logicConfig, roomPlanId } = data;

  const existingRoom = await prisma.room.findUnique({ where: { slug } });
  if (existingRoom) {
    throw new Error('Bu slug zaten kullanılıyor.');
  }

  const plan = await prisma.roomPlan.findUnique({ where: { id: roomPlanId } });
  if (!plan) {
    throw new Error('Geçersiz plan seçimi.');
  }

  let passwordHash: string | undefined;
  if (isPrivate && password) {
    passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  const room = await prisma.room.create({
    data: {
      name,
      slug,
      isPrivate,
      maxUsers: plan.maxUsers,
      allowedDomains,
      ownerId,
      roomPlanId,
      uiSettings: uiSettings as any,
      logicConfig: logicConfig as any,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      apiKey: true,
      isPrivate: true,
      maxUsers: true,
      allowedDomains: true,
      uiSettings: true,
      logicConfig: true,
      createdAt: true,
    },
  });

  await prisma.roomParticipant.create({
    data: {
      roomId: room.id,
      userId: ownerId,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  return room;
};

export const getRoomBySlug = async (slug: string) => {
  const room = await prisma.room.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, username: true, email: true } },
      roomPlan: true,
      _count: { select: { participants: true, messages: true } },
    },
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  return room;
};

export const getUserRooms = async (userId: string) => {
  return prisma.room.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      isPrivate: true,
      maxUsers: true,
      createdAt: true,
      _count: { select: { participants: true, messages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getPublicRooms = async () => {
  return prisma.room.findMany({
    where: { isPrivate: false },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      isPrivate: true,
      maxUsers: true,
      createdAt: true,
      owner: { select: { username: true } },
      _count: { select: { participants: true, messages: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const getRoomByApiKey = async (apiKey: string) => {
  const room = await prisma.room.findUnique({
    where: { apiKey },
    select: {
      id: true,
      name: true,
      slug: true,
      apiKey: true,
      isPrivate: true,
      maxUsers: true,
      allowedDomains: true,
      uiSettings: true,
      logicConfig: true,
      owner: { select: { id: true, username: true } },
      roomPlan: { select: { name: true, maxUsers: true, retentionDays: true, features: true } },
      _count: { select: { participants: true, messages: true } },
      createdAt: true,
    },
  });

  if (!room) {
    throw new Error('Geçersiz API key.');
  }

  return room;
};

export const updateRoom = async (roomId: string, userId: string, isAdmin: boolean, data: any) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, ownerId: true, roomPlanId: true },
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  const requesterRank = await getRequesterRank(roomId, room.ownerId, userId, isAdmin);
  if (requesterRank < ROLE_RANK.ROOM_ADMIN) {
    throw new Error('Bu odayı güncelleme yetkiniz yok.');
  }

  if (data.maxUsers) {
    const plan = await prisma.roomPlan.findUnique({ where: { id: room.roomPlanId! } });
    if (plan && data.maxUsers > plan.maxUsers) {
      throw new Error(`Plan maksimum ${plan.maxUsers} kullanıcıyı desteklemektedir.`);
    }
  }

  let passwordHash: string | undefined;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  return prisma.room.update({
    where: { id: roomId },
    data: {
      name: data.name,
      isPrivate: data.isPrivate,
      passwordHash,
      maxUsers: data.maxUsers,
      allowedDomains: data.allowedDomains,
      uiSettings: data.uiSettings as any,
      logicConfig: data.logicConfig as any,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      apiKey: true,
      isPrivate: true,
      maxUsers: true,
      allowedDomains: true,
      uiSettings: true,
      logicConfig: true,
      updatedAt: true,
    },
  });
};

export const deleteRoom = async (roomId: string, userId: string, isAdmin: boolean) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { _count: { select: { messages: true, participants: true } } },
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  if (room.ownerId !== userId && !isAdmin) {
    throw new Error('Bu odayı silme yetkiniz yok.');
  }

  await prisma.message.deleteMany({ where: { roomId } });
  await prisma.roomParticipant.deleteMany({ where: { roomId } });
  await prisma.room.delete({ where: { id: roomId } });

  return {
    message: 'Oda başarıyla silindi.',
    deletedCounts: {
      messages: room._count.messages,
      participants: room._count.participants,
    },
  };
};

export const getRoomParticipants = async (roomId: string) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  const participants = await prisma.roomParticipant.findMany({
    where: { roomId },
    include: {
      user: { select: { id: true, username: true, email: true, avatarUrl: true } },
    },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  });

  return {
    roomId,
    roomName: room.name,
    totalParticipants: participants.length,
    participants,
  };
};

const ROOM_ROLE_LABELS: Record<string, string> = {
  ROOM_ADMIN: 'oda yöneticisi',
  ROOM_MODERATOR: 'oda moderatörü',
  MEMBER: 'üye',
};

export const assignRoomRole = async (
  roomId: string,
  userId: string,
  role: 'ROOM_ADMIN' | 'ROOM_MODERATOR' | 'MEMBER',
  requestingUserId: string,
  isAdmin: boolean
) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { ownerId: true },
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  const requesterRank = await getRequesterRank(roomId, room.ownerId, requestingUserId, isAdmin);
  if (requesterRank < ROLE_RANK.ROOM_ADMIN) {
    throw new Error('Rol atama yetkiniz yok.');
  }

  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
    include: { user: true },
  });

  if (!participant) {
    throw new Error('Katılımcı bulunamadı.');
  }

  if (participant.role === 'OWNER') {
    throw new Error('Oda sahibi zaten maksimum yetkilere sahiptir.');
  }

  const updatedParticipant = await prisma.roomParticipant.update({
    where: { roomId_userId: { roomId, userId } },
    data: { role: role as any },
    include: {
      user: { select: { id: true, username: true, email: true, avatarUrl: true } },
    },
  });

  return {
    message: `${updatedParticipant.user.username} - ${ROOM_ROLE_LABELS[role]} olarak güncellendi.`,
    participant: updatedParticipant,
  };
};

export const muteParticipant = (roomId: string, userId: string, requestingUserId: string, isAdmin: boolean) =>
  updateParticipantStatus(roomId, userId, 'MUTED', requestingUserId, isAdmin);

export const unmuteParticipant = (roomId: string, userId: string, requestingUserId: string, isAdmin: boolean) =>
  updateParticipantStatus(roomId, userId, 'ACTIVE', requestingUserId, isAdmin);

export const banParticipant = (roomId: string, userId: string, requestingUserId: string, isAdmin: boolean) =>
  updateParticipantStatus(roomId, userId, 'BANNED', requestingUserId, isAdmin);

export const unbanParticipant = (roomId: string, userId: string, requestingUserId: string, isAdmin: boolean) =>
  updateParticipantStatus(roomId, userId, 'ACTIVE', requestingUserId, isAdmin);

const updateParticipantStatus = async (
  roomId: string,
  userId: string,
  newStatus: 'ACTIVE' | 'MUTED' | 'BANNED',
  requestingUserId: string,
  isAdmin: boolean
) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { ownerId: true },
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
    include: { user: true },
  });

  if (!participant) {
    throw new Error('Katılımcı bulunamadı.');
  }

  if (participant.role === 'OWNER') {
    throw new Error('Oda sahibine işlem uygulanamaz.');
  }

  const requesterRank = await getRequesterRank(roomId, room.ownerId, requestingUserId, isAdmin);
  if (requesterRank < ROLE_RANK.ROOM_MODERATOR) {
    throw new Error('Bu işlemi gerçekleştirme yetkiniz yok.');
  }
  if (requesterRank <= rankOf(participant.role)) {
    throw new Error('Bu katılımcıya işlem uygulama yetkiniz yok.');
  }

  if (participant.status === newStatus) {
    throw new Error(`Katılımcı zaten ${newStatus.toLowerCase()} durumunda.`);
  }

  const updatedParticipant = await prisma.roomParticipant.update({
    where: { roomId_userId: { roomId, userId } },
    data: { status: newStatus as any },
    include: {
      user: { select: { id: true, username: true, email: true, avatarUrl: true } },
    },
  });

  const statusMessages = {
    MUTED: 'katılımcı sessize alındı',
    BANNED: 'katılımcı banlandı',
    ACTIVE: 'katılımcı aktif hale getirildi',
  };

  return {
    message: `${updatedParticipant.user.username} - ${statusMessages[newStatus]}`,
    participant: updatedParticipant,
  };
};
