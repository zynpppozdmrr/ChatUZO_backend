export interface JwtPayload {
  sub: string;       // User ID (Subject)
  email: string;
  username: string;
  role: string;      // PlatformRole
  iat?: number;      // Issued at
  exp?: number;      // Expiration time
}