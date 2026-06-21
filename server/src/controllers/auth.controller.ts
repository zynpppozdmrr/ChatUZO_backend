import type { Request, Response } from 'express';
import type { RegisterInput, LoginInput } from '../schema/auth.validation.js';
import { registerUser, loginUser } from '../services/auth.service.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await registerUser(req.body as RegisterInput);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Kayıt sırasında bir hata oluştu.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginUser(req.body as LoginInput);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message) {
      res.status(401).json({ message: error.message });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Giriş sırasında bir hata oluştu.' });
  }
};
