//   api/rooms/*
import express from 'express';
import { createRoomController, getRoomController, getMyRoomsController } from '../controllers/room.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { CreateRoomSchema } from '../schema/room.validation.js';

const router = express.Router();


//AUTHENTICATED ROUTES
// Oda oluşturma (authentication gerekli)
router.post('/', authenticate, validate(CreateRoomSchema), createRoomController);

// Kullanıcının odalarını listele (authentication gerekli)
router.get('/my-rooms', authenticate, getMyRoomsController);


//PUBLIC ROUTES
// Slug ile oda bilgisi al (public)
router.get('/:slug', getRoomController);

export default router;