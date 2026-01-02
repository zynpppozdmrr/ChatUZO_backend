//   api/rooms/*
import express from 'express';
import { createRoomController, getRoomController, getMyRoomsController, getRoomByApiKeyController, getRoomMessagesController } from '../controllers/room.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { CreateRoomSchema } from '../schema/room.validation.js';

const router = express.Router();


//AUTHENTICATED ROUTES
// Oda oluşturma (authentication gerekli)
router.post('/', authenticate, validate(CreateRoomSchema), createRoomController);

// Kullanıcının odalarını listele (authentication gerekli)
router.get('/my-rooms', authenticate, getMyRoomsController);

// Oda mesajlarını getir (authentication gerekli)
router.get('/:roomId/messages', authenticate, getRoomMessagesController);


//PUBLIC ROUTES
// API Key ile oda bilgisi al (public - website entegrasyonu için)
router.get('/api-key/:apiKey', getRoomByApiKeyController);

// Slug ile oda bilgisi al (public)
router.get('/:slug', getRoomController);

export default router;