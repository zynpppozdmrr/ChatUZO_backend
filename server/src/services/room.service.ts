// Business logic for Rooms
import { prisma } from '../config/prisma.js';
import type { CreateRoomDto } from '../types/Room/room.type.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const createRoom = async (ownerId: string, data: CreateRoomDto) => {
  const { name, slug, isPrivate, password, maxUsers, allowedDomains, uiSettings, logicConfig, roomPlanId } = data;

  // 1. Slug benzersizliğini kontrol et
  const existingRoom = await prisma.room.findUnique({
    where: { slug }
  });

  if (existingRoom) {
    throw new Error('Bu slug zaten kullanılıyor.');
  }

  // 2. Plan kontrolü
  const plan = await prisma.roomPlan.findUnique({
    where: { id: roomPlanId }
  });

  if (!plan) {
    throw new Error('Geçersiz plan seçimi.');
  }

  // 3. Plan limitlerine göre kontrol
  if (maxUsers > plan.maxUsers) {
    throw new Error(`Seçilen plan maksimum ${plan.maxUsers} kullanıcıyı desteklemektedir.`);
  }

  // 4. Şifreyi hash'le (eğer private ise)
  let passwordHash: string | undefined;
  if (isPrivate && password) {
    passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  // 5. Oda oluştur
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

  // 3. Oda sil (cascade ile participants ve messages de silinir)
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