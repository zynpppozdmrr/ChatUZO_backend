import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload } from '../types/JWTPayload.type.js';

const jwtExpiresIn: SignOptions['expiresIn'] = env.JWT_EXPIRES_IN as SignOptions['expiresIn'];

/**
 * JWT token oluşturur
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(
    payload,
    env.JWT_SECRET,
    { expiresIn: jwtExpiresIn }
  );
};

/**
 * JWT token'ı doğrular ve payload'ı döner
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Geçersiz veya süresi dolmuş token.');
  }
};

/**
 * Token'dan userId çıkarır (hızlı erişim için)
 */
export const getUserIdFromToken = (token: string): string => {
  const payload = verifyToken(token);
  return payload.sub;
};
