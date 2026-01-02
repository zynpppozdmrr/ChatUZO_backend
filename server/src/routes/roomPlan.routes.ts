//   api/room-plans/*
import express from 'express';
import { 
  createRoomPlanController, 
  getAllRoomPlansController, 
  getRoomPlanController, 
  updateRoomPlanController, 
  deleteRoomPlanController 
} from '../controllers/roomPlan.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { CreateRoomPlanSchema, UpdateRoomPlanSchema } from '../schema/roomPlan.validation.js';

const router = express.Router();

// Tüm planları listele (public)
router.get('/', getAllRoomPlansController);

// Tek plan detayı (public)
router.get('/:id', getRoomPlanController);

// Plan oluştur (admin only)
router.post('/', authenticate, validate(CreateRoomPlanSchema), createRoomPlanController);

// Plan güncelle (admin only)
router.put('/:id', authenticate, validate(UpdateRoomPlanSchema), updateRoomPlanController);

// Plan sil (admin only)
router.delete('/:id', authenticate, deleteRoomPlanController);

export default router;
