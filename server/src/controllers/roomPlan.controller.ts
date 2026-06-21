// RoomPlan CRUD operations
import type { Request, Response } from 'express';
import type { CreateRoomPlanInput, UpdateRoomPlanInput } from '../schema/roomPlan.validation.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { 
  createRoomPlan, 
  getAllRoomPlans, 
  getRoomPlanById, 
  updateRoomPlan, 
  deleteRoomPlan 
} from '../services/roomPlan.service.js';

// Sadece admin kullanıcılar plan oluşturabilir
export const createRoomPlanController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.platformRole;
    
    if (userRole !== 'ADMIN') {
      res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir.' });
      return;
    }

    const validatedData = req.body as CreateRoomPlanInput;
    const plan = await createRoomPlan(validatedData);

    res.status(201).json({
      message: 'Plan başarıyla oluşturuldu.',
      plan
    });
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error('Create room plan error:', error);
    res.status(500).json({ message: 'Plan oluşturulurken bir hata oluştu.' });
  }
};

// Herkese açık - plan seçimi için
export const getAllRoomPlansController = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await getAllRoomPlans();

    res.status(200).json({ plans });
  } catch (error: any) {
    console.error('Get all room plans error:', error);
    res.status(500).json({ message: 'Planlar listelenirken bir hata oluştu.' });
  }
};

// Herkese açık - plan detayları
export const getRoomPlanController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const plan = await getRoomPlanById(id);

    res.status(200).json({ plan });
  } catch (error: any) {
    if (error.message === 'Plan bulunamadı.') {
      res.status(404).json({ message: error.message });
      return;
    }

    console.error('Get room plan error:', error);
    res.status(500).json({ message: 'Plan bilgisi alınırken bir hata oluştu.' });
  }
};

// Sadece admin
export const updateRoomPlanController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.platformRole;
    
    if (userRole !== 'ADMIN') {
      res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir.' });
      return;
    }

    const { id } = req.params;
    const validatedData = req.body as UpdateRoomPlanInput;
    
    const plan = await updateRoomPlan(id, validatedData);

    res.status(200).json({
      message: 'Plan başarıyla güncellendi.',
      plan
    });
  } catch (error: any) {
    if (error.message === 'Plan bulunamadı.') {
      res.status(404).json({ message: error.message });
      return;
    }

    console.error('Update room plan error:', error);
    res.status(500).json({ message: 'Plan güncellenirken bir hata oluştu.' });
  }
};

// Sadece admin
export const deleteRoomPlanController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.platformRole;
    
    if (userRole !== 'ADMIN') {
      res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir.' });
      return;
    }

    const { id } = req.params;
    const result = await deleteRoomPlan(id);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error('Delete room plan error:', error);
    res.status(500).json({ message: 'Plan silinirken bir hata oluştu.' });
  }
};
