import type { Request, Response } from 'express';
import type { CreateRoomPlanInput, UpdateRoomPlanInput } from '../schema/roomPlan.validation.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import {
  createRoomPlan,
  getAllRoomPlans,
  getRoomPlanById,
  updateRoomPlan,
  deleteRoomPlan,
} from '../services/roomPlan.service.js';

export const createRoomPlanController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const plan = await createRoomPlan(req.body as CreateRoomPlanInput);
    res.status(201).json({ message: 'Plan başarıyla oluşturuldu.', plan });
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('Create room plan error:', error);
    res.status(500).json({ message: 'Plan oluşturulurken bir hata oluştu.' });
  }
};

export const getAllRoomPlansController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await getAllRoomPlans();
    res.status(200).json({ plans });
  } catch (error: any) {
    console.error('Get all room plans error:', error);
    res.status(500).json({ message: 'Planlar listelenirken bir hata oluştu.' });
  }
};

export const getRoomPlanController = async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await getRoomPlanById(req.params.id);
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

export const updateRoomPlanController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const plan = await updateRoomPlan(req.params.id, req.body as UpdateRoomPlanInput);
    res.status(200).json({ message: 'Plan başarıyla güncellendi.', plan });
  } catch (error: any) {
    if (error.message === 'Plan bulunamadı.') {
      res.status(404).json({ message: error.message });
      return;
    }
    console.error('Update room plan error:', error);
    res.status(500).json({ message: 'Plan güncellenirken bir hata oluştu.' });
  }
};

export const deleteRoomPlanController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await deleteRoomPlan(req.params.id);
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
