// Business logic for RoomPlan operations
import { prisma } from '../config/prisma.js';
import type { CreateRoomPlanInput, UpdateRoomPlanInput } from '../schema/roomPlan.validation.js';

export const createRoomPlan = async (data: CreateRoomPlanInput) => {
  const { name, maxUsers, retentionDays, features } = data;

  // Plan adı benzersiz olmalı
  const existingPlan = await prisma.roomPlan.findUnique({
    where: { name }
  });

  if (existingPlan) {
    throw new Error('Bu plan adı zaten kullanılıyor.');
  }

  const plan = await prisma.roomPlan.create({
    data: {
      name,
      maxUsers,
      retentionDays,
      features: features || undefined,
    }
  });

  return plan;
};

export const getAllRoomPlans = async () => {
  const plans = await prisma.roomPlan.findMany({
    include: {
      _count: {
        select: {
          rooms: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return plans;
};

export const getRoomPlanById = async (id: string) => {
  const plan = await prisma.roomPlan.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          rooms: true
        }
      }
    }
  });

  if (!plan) {
    throw new Error('Plan bulunamadı.');
  }

  return plan;
};

export const updateRoomPlan = async (id: string, data: UpdateRoomPlanInput) => {
  const existingPlan = await prisma.roomPlan.findUnique({
    where: { id }
  });

  if (!existingPlan) {
    throw new Error('Plan bulunamadı.');
  }

  const updatedPlan = await prisma.roomPlan.update({
    where: { id },
    data: {
      maxUsers: data.maxUsers,
      retentionDays: data.retentionDays,
      features: data.features,
    }
  });

  return updatedPlan;
};

export const deleteRoomPlan = async (id: string) => {
  const plan = await prisma.roomPlan.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          rooms: true
        }
      }
    }
  });

  if (!plan) {
    throw new Error('Plan bulunamadı.');
  }

  // Eğer bu plana bağlı odalar varsa silinemez
  if (plan._count.rooms > 0) {
    throw new Error(`Bu plana bağlı ${plan._count.rooms} oda bulunmaktadır. Önce bu odaları silmelisiniz.`);
  }

  await prisma.roomPlan.delete({
    where: { id }
  });

  return { message: 'Plan başarıyla silindi.' };
};
