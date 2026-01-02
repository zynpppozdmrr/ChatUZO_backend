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
      password: passwordHash,
      maxUsers,
      allowedDomains,
      ownerId,
      roomPlanId: roomPlanId,
      uiSettings: uiSettings as any,
      logicConfig: logicConfig as any,
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