// Business logic for Auth
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import type { RegisterRequestDto, RegisterResponse } from '../types/Auth/register.type.js';
import type { LoginRequestDto, LoginResponse } from '../types/Auth/login.type.js';
import type { AuthenticatedUser } from '../types/Auth/authenticatedUser.type.js';
import { generateToken } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

export const registerUser = async (data: RegisterRequestDto): Promise<RegisterResponse> => {
  const { email, username, password, birthdate, avatarUrl } = data;

  // 1. Kullanıcı zaten var mı kontrol et
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw new Error('Bu e-posta adresi zaten kullanılıyor.');
    }
    if (existingUser.username === username) {
      throw new Error('Bu kullanıcı adı zaten kullanılıyor.');
    }
  }

  // 2. Şifreyi hash'le
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Kullanıcıyı oluştur
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username,
      passwordHash,
      birthdate: new Date(birthdate),
      avatarUrl: avatarUrl || null,
      isGuest: false,
    },
    select: {
      id: true,
    }
  });

  return {
    message: 'Kayıt başarılı! Giriş yapabilirsiniz.',
    userId: user.id,
  };
};

export const loginUser = async (data: LoginRequestDto): Promise<LoginResponse> => {
  const { identifier, password } = data;

  // 1. Kullanıcıyı email veya username ile bul
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    },
    select: {
      id: true,
      email: true,
      username: true,
      passwordHash: true,
      avatarUrl: true,
      platformRole: true,
      status: true,
    }
  });

  if (!user) {
    throw new Error('E-posta/kullanıcı adı veya şifre hatalı.');
  }

  // 2. Kullanıcı durumunu kontrol et
  if (user.status === 'BANNED') {
    throw new Error('Hesabınız yasaklanmış.');
  }
  if (user.status === 'SUSPENDED') {
    throw new Error('Hesabınız askıya alınmış.');
  }

  // 3. Şifreyi doğrula
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('E-posta/kullanıcı adı veya şifre hatalı.');
  }

  // 4. JWT token oluştur
  const accessToken = generateToken({
    sub: user.id,
    username: user.username,
    role: user.platformRole
  });

  // 5. Kullanıcı bilgilerini hazırla
  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    platformRole: user.platformRole,
    status: user.status,
  };

  return {
    accessToken,
    user: authenticatedUser,
  };
};
