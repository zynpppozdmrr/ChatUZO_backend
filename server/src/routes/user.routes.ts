import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { UpdateUserSchema, ChangeRoleSchema } from '../schema/user.validation.js';

const router = express.Router();

router.get('/me', authenticate, userController.getMyProfile);
router.put('/me', authenticate, validate(UpdateUserSchema), userController.updateMyProfile);

router.get('/', authenticate, requireAdmin, userController.getAllUsers);
router.put('/:id/role', authenticate, requireAdmin, validate(ChangeRoleSchema), userController.changeUserRole);

router.get('/:id', userController.getUserById);
router.delete('/:id', authenticate, userController.deleteUser);

export default router;
