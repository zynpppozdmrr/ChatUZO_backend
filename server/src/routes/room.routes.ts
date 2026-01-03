//   api/rooms/*
import express from 'express';
import { createRoomController, getRoomController, getMyRoomsController, getPublicRoomsController, getRoomByApiKeyController, getRoomMessagesController, updateRoomController, deleteRoomController, assignModeratorController, getRoomParticipantsController, muteParticipantController, unmuteParticipantController, banParticipantController, unbanParticipantController } from '../controllers/room.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { CreateRoomSchema, UpdateRoomSchema, AssignModeratorSchema } from '../schema/room.validation.js';

const router = express.Router();

//AUTHENTICATED ROUTES
// Oda oluşturma (authentication gerekli)
router.post('/', authenticate, validate(CreateRoomSchema), createRoomController);

// Kullanıcının odalarını listele (authentication gerekli)
router.get('/my-rooms', authenticate, getMyRoomsController);

// Açık odaları listele (authentication gerekli - sisteme üye olanlar görebilir)
router.get('/public', authenticate, getPublicRoomsController);

// PUBLIC ROUTES (static routes before dynamic ones)
// API Key ile oda bilgisi al (public - website entegrasyonu için)
router.get('/api-key/:apiKey', getRoomByApiKeyController);

//AUTHENTICATED DYNAMIC ROUTES (after static routes)
// Oda mesajlarını getir (authentication gerekli)
router.get('/:roomId/messages', authenticate, getRoomMessagesController);

// Oda katılımcılarını getir (authentication gerekli)
router.get('/:roomId/participants', authenticate, getRoomParticipantsController);

// Katılımcıya moderatör yetkisi ver/kaldır
router.patch('/:roomId/moderator', authenticate, validate(AssignModeratorSchema), assignModeratorController);

// Katılımcıyı muteleme/muteleme kaldırma
router.patch('/:roomId/participants/:userId/mute', authenticate, muteParticipantController);
router.patch('/:roomId/participants/:userId/unmute', authenticate, unmuteParticipantController);

// Katılımcıyı banlama/banlama kaldırma
router.patch('/:roomId/participants/:userId/ban', authenticate, banParticipantController);
router.patch('/:roomId/participants/:userId/unban', authenticate, unbanParticipantController);

// Oda güncelle (owner veya admin)
router.put('/:id', authenticate, validate(UpdateRoomSchema), updateRoomController);

// Oda sil (owner veya admin)
router.delete('/:id', authenticate, deleteRoomController);

// Slug ile oda bilgisi al (public - most general, last)
router.get('/:slug', getRoomController);

export default router;