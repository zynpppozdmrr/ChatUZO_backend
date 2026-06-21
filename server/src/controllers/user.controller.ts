import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import * as userService from '../services/user.service.js';

export const getMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userService.getUserById(req.user!.id);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Profil getirilirken bir hata oluştu.' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getPublicUserById(req.params.id);
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Kullanıcı bulunamadı.' });
  }
};

export const getAllUsers = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Kullanıcılar getirilirken bir hata oluştu.' });
  }
};

export const updateMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedUser = await userService.updateUser(req.user!.id, req.body);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Profil güncellenirken bir hata oluştu.' });
  }
};

export const changeUserRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedUser = await userService.changeUserRole(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Rol değiştirilirken bir hata oluştu.' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isAdmin = req.user!.platformRole === 'ADMIN';
    const result = await userService.deleteUser(req.params.id, req.user!.id, isAdmin);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Kullanıcı silinirken bir hata oluştu.' });
  }
};
