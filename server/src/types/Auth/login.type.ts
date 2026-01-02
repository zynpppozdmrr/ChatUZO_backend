import { AuthenticatedUser } from './authenticatedUser.type.js';

export interface LoginRequestDto {
  identifier: string; // Email veya Username yerine geçebilir
  password: string;
}

export interface LoginResponse {
  accessToken: string;  // JWT Token
  user: AuthenticatedUser; // Giriş yapan kullanıcı bilgileri
}