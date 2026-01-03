// Business logic for Rooms
import { prisma } from '../config/prisma.js';
import type { CreateRoomDto } from '../types/Room/room.type.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const createRoom = async (ownerId: string, data: CreateRoomDto) => {
  const { name, slug, isPrivate, password, allowedDomains, uiSettings, logicConfig, roomPlanId } = data;

  // 1. Slug benzersizliğini kontrol et
  const existingRoom = await prisma.room.findUnique({
    where: { slug }
  });

  if (existingRoom) {
    throw new Error('Bu slug zaten kullanılıyor.');
  }

  // 2. Plan kontrolü ve maxUsers'ı plandan al
  const plan = await prisma.roomPlan.findUnique({
    where: { id: roomPlanId }
  });

  if (!plan) {
    throw new Error('Geçersiz plan seçimi.');
  }

  // 3. maxUsers değerini direkt plandan al
  const maxUsers = plan.maxUsers;

  // 4. Şifreyi hash'le (eğer private ise)
  let passwordHash: string | undefined;
  if (isPrivate && password) {
    passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  // 5. Oda oluştur (maxUsers plandan otomatik alındı)
  const room = await prisma.room.create({
    data: {
      name,
      slug,
      isPrivate,
      maxUsers,
      allowedDomains,
      ownerId,
      roomPlanId: roomPlanId,
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
    }
  });

  // 6. Owner'ı otomatik OWNER rol ile participant olarak ekle
  await prisma.roomParticipant.create({
    data: {
      roomId: room.id,
      userId: ownerId,
      role: 'OWNER',
      status: 'ACTIVE',
    }
  });

  return room;
};

export const getRoomBySlug = async (slug: string) => {
  const room = await prisma.room.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          email: true,
        }
      },
      roomPlan: true,
      _count: {
        select: {
          participants: true,
          messages: true,
        }
      }
    }
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  return room;
};

export const getUserRooms = async (userId: string) => {
  const rooms = await prisma.room.findMany({
    where: {
      ownerId: userId
    },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      isPrivate: true,
      maxUsers: true,
      createdAt: true,
      _count: {
        select: {
          participants: true,
          messages: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return rooms;
};

export const getPublicRooms = async () => {
  const rooms = await prisma.room.findMany({
    where: {
      isPrivate: false
    },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      isPrivate: true,
      maxUsers: true,
      createdAt: true,
      owner: {
        select: {
          username: true
        }
      },
      _count: {
        select: {
          participants: true,
          messages: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50 // Limit to 50 for now
  });

  return rooms;
};

// API Key ile oda bilgilerini getir (public endpoint)
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
      owner: {
        select: {
          id: true,
          username: true,
        }
      },
      roomPlan: {
        select: {
          name: true,
          maxUsers: true,
          retentionDays: true,
          features: true,
        }
      },
      _count: {
        select: {
          participants: true,
          messages: true,
        }
      },
      createdAt: true,
    }
  });

  if (!room) {
    throw new Error('Geçersiz API key.');
  }

  return room;
};

// Oda güncelle (sadece owner veya admin)
export const updateRoom = async (roomId: string, userId: string, isAdmin: boolean, data: any) => {
  // 1. Oda kontrolü
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      ownerId: true,
      roomPlanId: true,
    }
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  // 2. Yetki kontrolü (sadece owner veya admin)
  if (room.ownerId !== userId && !isAdmin) {
    throw new Error('Bu odayı güncelleme yetkiniz yok.');
  }

  // 3. maxUsers güncelleniyorsa plan kontrolü
  if (data.maxUsers) {
    const plan = await prisma.roomPlan.findUnique({
      where: { id: room.roomPlanId! }
    });

    if (plan && data.maxUsers > plan.maxUsers) {
      throw new Error(`Plan maksimum ${plan.maxUsers} kullanıcıyı desteklemektedir.`);
    }
  }

  // 4. Şifre güncelleniyorsa hash'le
  let passwordHash: string | undefined;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  // 5. Güncelleme
  const updatedRoom = await prisma.room.update({
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
    }
  });

  return updatedRoom;
};

// Oda sil (sadece owner veya admin)
export const deleteRoom = async (roomId: string, userId: string, isAdmin: boolean) => {
  // 1. Oda kontrolü
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      _count: {
        select: {
          messages: true,
          participants: true,
        }
      }
    }
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  // 2. Yetki kontrolü (sadece owner veya admin)
  if (room.ownerId !== userId && !isAdmin) {
    throw new Error('Bu odayı silme yetkiniz yok.');
  }

  // 3. Önce bağımlı kayıtları sil (manuel cascade)
  // 3a. Mesajları sil
  await prisma.message.deleteMany({
    where: { roomId }
  });

  // 3b. Katılımcıları sil
  await prisma.roomParticipant.deleteMany({
    where: { roomId }
  });

  // 4. Son olarak oda sil
  await prisma.room.delete({
    where: { id: roomId }
  });

  return {
    message: 'Oda başarıyla silindi.',
    deletedCounts: {
      messages: room._count.messages,
      participants: room._count.participants,
    }
  };
};

// Odanın katılımcılarını getir
export const getRoomParticipants = async (roomId: string) => {
  // 1. Oda kontrolü
  const room = await prisma.room.findUnique({
    where: { id: roomId }
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  // 2. Katılımcıları getir
  const participants = await prisma.roomParticipant.findMany({
    where: { roomId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
        }
      }
    },
    orderBy: [
      { role: 'asc' }, // OWNER, MODERATOR, MEMBER sırasında
      { createdAt: 'asc' } // Aynı role'de en erken katılmış ilk
    ]
  });

  return {
    roomId,
    roomName: room.name,
    totalParticipants: participants.length,
    participants
  };
};

// Katılımcıya moderatör yetkisi ver/kaldır
export const assignModeratorRole = async (
  roomId: string,
  userId: string,  // Changed from participantId to userId
  isModerator: boolean,
  requestingUserId: string,
  isAdmin: boolean
) => {
  // 1. Oda kontrolü ve owner olup olmadığını kontrol et
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { ownerId: true }
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  // 2. Yetki kontrolü (sadece owner veya admin)
  if (room.ownerId !== requestingUserId && !isAdmin) {
    throw new Error('Bu işlemi gerçekleştirme yetkiniz yok.');
  }

  // 3. Katılımcı kontrolü - userId ve roomId ile bul
  const participant = await prisma.roomParticipant.findUnique({
    where: { 
      roomId_userId: {
        roomId,
        userId
      }
    },
    include: { user: true }
  });

  console.log('[assignModeratorRole] Looking for participant:', { userId, roomId });
  console.log('[assignModeratorRole] Found participant:', participant);

  if (!participant) {
    throw new Error('Katılımcı bulunamadı.');
  }

  if (participant.roomId !== roomId) {
    throw new Error('Bu katılımcı bu odaya ait değil.');
  }

  // 4. Owner'ı moderator yapamaz (zaten owner)
  if (participant.role === 'OWNER') {
    throw new Error('Oda sahibi zaten maksimum yetkilere sahiptir.');
  }

  // 5. Katılımcının rolünü güncelle
  const newRole = isModerator ? 'MODERATOR' : 'MEMBER';
  const updatedParticipant = await prisma.roomParticipant.update({
    where: { 
      roomId_userId: {
        roomId,
        userId
      }
    },
    data: { role: newRole as any },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true
        }
      }
    }
  });

  return {
    message: `Katılımcı ${isModerator ? 'moderatör' : 'üye'} olarak güncellenmiştir.`,
    participant: updatedParticipant
  };
};

// Katılımcıyı muteleme (moderatör/owner işlemi)
export const muteParticipant = async (
  roomId: string,
  userId: string,
  requestingUserId: string,
  isAdmin: boolean
) => {
  return updateParticipantStatus(roomId, userId, 'MUTED', requestingUserId, isAdmin);
};

// Katılımcıyı mutelemeyi kaldırma (moderatör/owner işlemi)
export const unmuteParticipant = async (
  roomId: string,
  userId: string,
  requestingUserId: string,
  isAdmin: boolean
) => {
  return updateParticipantStatus(roomId, userId, 'ACTIVE', requestingUserId, isAdmin);
};

// Katılımcıyı banlama (moderatör/owner işlemi)
export const banParticipant = async (
  roomId: string,
  userId: string,
  requestingUserId: string,
  isAdmin: boolean
) => {
  return updateParticipantStatus(roomId, userId, 'BANNED', requestingUserId, isAdmin);
};

// Katılımcının banını kaldırma (moderatör/owner işlemi)
export const unbanParticipant = async (
  roomId: string,
  userId: string,
  requestingUserId: string,
  isAdmin: boolean
) => {
  return updateParticipantStatus(roomId, userId, 'ACTIVE', requestingUserId, isAdmin);
};

// Helper function: Katılımcı status'unu güncelle
const updateParticipantStatus = async (
  roomId: string,
  userId: string,
  newStatus: 'ACTIVE' | 'MUTED' | 'BANNED',
  requestingUserId: string,
  isAdmin: boolean
) => {
  // 1. Oda kontrolü
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { ownerId: true }
  });

  if (!room) {
    throw new Error('Oda bulunamadı.');
  }

  // 2. Yetki kontrolü (owner veya admin olması gerekli, moderatörler şimdilik dışında)
  if (room.ownerId !== requestingUserId && !isAdmin) {
    throw new Error('Bu işlemi gerçekleştirme yetkiniz yok.');
  }

  // 3. Hedef katılımcı kontrolü
  const participant = await prisma.roomParticipant.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId
      }
    },
    include: { user: true }
  });

  if (!participant) {
    throw new Error('Katılımcı bulunamadı.');
  }

  // 4. Owner'a işlem yapamaz
  if (participant.role === 'OWNER') {
    throw new Error('Oda sahibine işlem uygulanamaz.');
  }

  // 5. Aynı durumda ise hata döndür
  if (participant.status === newStatus) {
    throw new Error(`Katılımcı zaten ${newStatus.toLowerCase()} durumunda.`);
  }

  // 6. Status'u güncelle
  const updatedParticipant = await prisma.roomParticipant.update({
    where: {
      roomId_userId: {
        roomId,
        userId
      }
    },
    data: { status: newStatus as any },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true
        }
      }
    }
  });

  const statusMessages = {
    'MUTED': 'katılımcı sessize alındı',
    'BANNED': 'katılımcı banlandı',
    'ACTIVE': 'katılımcı aktif hale getirildi'
  };

  return {
    message: `${updatedParticipant.user.username} - ${statusMessages[newStatus]}`,
    participant: updatedParticipant
  };
};