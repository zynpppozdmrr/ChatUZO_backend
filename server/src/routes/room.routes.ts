import express from 'express';
import {
  createRoomController,
  getRoomController,
  getMyRoomsController,
  getPublicRoomsController,
  getRoomByApiKeyController,
  getRoomMessagesController,
  updateRoomController,
  deleteRoomController,
  assignRoomRoleController,
  getRoomParticipantsController,
  muteParticipantController,
  unmuteParticipantController,
  banParticipantController,
  unbanParticipantController,
} from '../controllers/room.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { CreateRoomSchema, UpdateRoomSchema, AssignRoomRoleSchema } from '../schema/room.validation.js';

const router = express.Router();

router.post('/', authenticate, requireAdmin, validate(CreateRoomSchema), createRoomController);
router.get('/my-rooms', authenticate, getMyRoomsController);
router.get('/public', authenticate, getPublicRoomsController);

router.get('/api-key/:apiKey', getRoomByApiKeyController);

router.get('/:roomId/messages', authenticate, getRoomMessagesController);
router.get('/:roomId/participants', authenticate, getRoomParticipantsController);
router.patch('/:roomId/participants/:userId/role', authenticate, validate(AssignRoomRoleSchema), assignRoomRoleController);
router.patch('/:roomId/participants/:userId/mute', authenticate, muteParticipantController);
router.patch('/:roomId/participants/:userId/unmute', authenticate, unmuteParticipantController);
router.patch('/:roomId/participants/:userId/ban', authenticate, banParticipantController);
router.patch('/:roomId/participants/:userId/unban', authenticate, unbanParticipantController);

router.put('/:id', authenticate, validate(UpdateRoomSchema), updateRoomController);
router.delete('/:id', authenticate, deleteRoomController);

router.get('/:slug', getRoomController);

export default router;
