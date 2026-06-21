import express from 'express';
import {
  createRoomPlanController,
  getAllRoomPlansController,
  getRoomPlanController,
  updateRoomPlanController,
  deleteRoomPlanController,
} from '../controllers/roomPlan.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { CreateRoomPlanSchema, UpdateRoomPlanSchema } from '../schema/roomPlan.validation.js';

const router = express.Router();

router.get('/', getAllRoomPlansController);
router.get('/:id', getRoomPlanController);

router.post('/', authenticate, requireAdmin, validate(CreateRoomPlanSchema), createRoomPlanController);
router.put('/:id', authenticate, requireAdmin, validate(UpdateRoomPlanSchema), updateRoomPlanController);
router.delete('/:id', authenticate, requireAdmin, deleteRoomPlanController);

export default router;
