//Profile management
import type { Request, Response } from 'express';
import * as userService from '../services/user.service.js';

// GET /api/users/me - Kendi profilini getir
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await userService.getUserById(userId);
    
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Profil getirilirken bir hata oluştu.' });
  }
};

// GET /api/users/:id - Belirli kullanıcıyı getir
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Kullanıcı bulunamadı.' });
  }
};

// GET /api/users - Tüm kullanıcıları listele (Admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Admin kontrolü
    if (req.user!.platformRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Bu işlem için admin yetkisi gereklidir.' });
    }

    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Kullanıcılar getirilirken bir hata oluştu.' });
  }
};

// PUT /api/users/me - Kendi profilini güncelle
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const updatedUser = await userService.updateUser(userId, req.body);
    
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Profil güncellenirken bir hata oluştu.' });
  }
};

// PUT /api/users/:id/role - Kullanıcı rolünü değiştir (Admin only)
export const changeUserRole = async (req: Request, res: Response) => {
  try {
    // Admin kontrolü
    if (req.user!.platformRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Bu işlem için admin yetkisi gereklidir.' });
    }

    const { id } = req.params;
    const updatedUser = await userService.changeUserRole(id, req.body);
    
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Rol değiştirilirken bir hata oluştu.' });
  }
};

// DELETE /api/users/:id - Kullanıcıyı sil (Admin or own account)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requesterId = req.user!.id;
    const isAdmin = req.user!.platformRole === 'ADMIN';

    const result = await userService.deleteUser(id, requesterId, isAdmin);
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Kullanıcı silinirken bir hata oluştu.' });
  }
};
