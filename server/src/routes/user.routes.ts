//  /api/users/*
import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { UpdateUserSchema, ChangeRoleSchema } from '../schema/user.validation.js';

const router = express.Router();

// GET /api/users/me - Kendi profilini getir
router.get('/me', authenticate, userController.getMyProfile);

// PUT /api/users/me - Kendi profilini güncelle
router.put('/me', authenticate, validate(UpdateUserSchema), userController.updateMyProfile);

// GET /api/users - Tüm kullanıcıları listele (Admin only)
router.get('/', authenticate, userController.getAllUsers);

// GET /api/users/:id - Belirli kullanıcıyı getir (Public)
router.get('/:id', userController.getUserById);

// PUT /api/users/:id/role - Kullanıcı rolünü değiştir (Admin only)
router.put('/:id/role', authenticate, validate(ChangeRoleSchema), userController.changeUserRole);

// DELETE /api/users/:id - Kullanıcıyı sil (Admin or own account)
router.delete('/:id', authenticate, userController.deleteUser);

export default router;
