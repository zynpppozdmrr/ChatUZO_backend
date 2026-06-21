// Business logic for Users
import { prisma } from '../config/prisma.js';
import type { ChangeRoleInput, UpdateUserInput } from '../schema/user.validation.js';

// Get user by ID
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      birthdate: true,
      isGuest: true,
      status: true,
      platformRole: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new Error('Kullanıcı bulunamadı.');
  }

  return user;
};

export const getPublicUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
    }
  });

  if (!user) {
    throw new Error('Kullanıcı bulunamadı.');
  }

  return user;
};

// Get all users (Admin only)
export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      isGuest: true,
      status: true,
      platformRole: true,
      createdAt: true,
      _count: {
        select: {
          ownedRooms: true,
          roomParticipants: true,
          messages: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return users;
};

// Update user profile
export const updateUser = async (userId: string, data: UpdateUserInput) => {
  // Username benzersizliği kontrolü
  if (data.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: data.username,
        NOT: {
          id: userId
        }
      }
    });

    if (existingUser) {
      throw new Error('Bu kullanıcı adı zaten kullanılıyor.');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      username: data.username,
      avatarUrl: data.avatarUrl,
      birthdate: data.birthdate ? new Date(data.birthdate) : undefined
    },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      birthdate: true,
      status: true,
      platformRole: true,
      updatedAt: true
    }
  });

  return updatedUser;
};

// Change user role (Admin only)
export const changeUserRole = async (userId: string, data: ChangeRoleInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('Kullanıcı bulunamadı.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      platformRole: data.platformRole
    },
    select: {
      id: true,
      email: true,
      username: true,
      platformRole: true,
      updatedAt: true
    }
  });

  return updatedUser;
};

// Delete user (Admin only or own account)
export const deleteUser = async (userId: string, requesterId: string, isAdmin: boolean) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          ownedRooms: true,
          roomParticipants: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('Kullanıcı bulunamadı.');
  }

  // Sadece admin veya kendi hesabını silebilir
  if (!isAdmin && userId !== requesterId) {
    throw new Error('Bu kullanıcıyı silme yetkiniz yok.');
  }

  // Eğer kullanıcının sahip olduğu odalar varsa silinmez
  if (user._count.ownedRooms > 0) {
    throw new Error(`Bu kullanıcının sahip olduğu ${user._count.ownedRooms} oda bulunmaktadır. Önce odaları silmelisiniz veya başka birine devretmelisiniz.`);
  }

  // Kullanıcıyı sil (cascade ile katılımlar ve mesajlar silinir)
  await prisma.user.delete({
    where: { id: userId }
  });

  return { message: 'Kullanıcı başarıyla silindi.' };
};
