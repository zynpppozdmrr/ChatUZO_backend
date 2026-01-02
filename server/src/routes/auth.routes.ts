//  /api/auth/*

import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { RegisterSchema, LoginSchema } from '../schema/auth.validation.js';

const router = express.Router();

router.post('/register', validate(RegisterSchema), register);
router.post('/login', validate(LoginSchema), login);

export default router;