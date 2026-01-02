export interface RegisterRequestDto {
  email: string;
  username: string;
  password: string;
  birthdate: Date | string; // ISO string formatında gelebilir
  avatarUrl?: string | null; // Opsiyonel profil resmi
}

export interface RegisterResponse {
  message: string;
  userId: string;
}