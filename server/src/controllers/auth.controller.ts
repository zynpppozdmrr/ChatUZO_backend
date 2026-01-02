// Login, Register
import type { Request, Response } from 'express';
import type { RegisterInput, LoginInput } from '../schema/auth.validation.js';
import { registerUser, loginUser } from '../services/auth.service.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Body zaten middleware'de validate edildi
    const validatedData = req.body as RegisterInput;

    // Service katmanında kullanıcıyı kaydet
    const result = await registerUser(validatedData);

    // Başarılı response
    res.status(201).json(result);
  } catch (error: any) {
    // Business logic hatası (kullanıcı zaten var vs.)
    if (error.message) {
      res.status(400).json({
        message: error.message
      });
      return;
    }

    // Beklenmedik hata
    console.error('Register error:', error);
    res.status(500).json({
      message: 'Kayıt sırasında bir hata oluştu.'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Body zaten middleware'de validate edildi
    const validatedData = req.body as LoginInput;

    // Service katmanında giriş yap
    const result = await loginUser(validatedData);

    // Başarılı response
    res.status(200).json(result);
  } catch (error: any) {
    // Business logic hatası
    if (error.message) {
      res.status(401).json({
        message: error.message
      });
      return;
    }

    // Beklenmedik hata
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Giriş sırasında bir hata oluştu.'
    });
  }
};