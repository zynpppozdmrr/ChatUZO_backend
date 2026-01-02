export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  platformRole: 'USER' | 'ADMIN'; // PlatformRole Enum ile uyumlu
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}