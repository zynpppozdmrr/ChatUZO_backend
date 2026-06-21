import "dotenv/config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

function parseOrigins(value: string | undefined): string[] {
  const raw = value?.trim();
  if (!raw) {
    return ["http://localhost:5173"];
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  CLIENT_ORIGINS: parseOrigins(process.env.CLIENT_ORIGIN),

  // DATABASEURL YOKSA BU SERVİS ÇALIŞMASIN. EĞER BİRİ .ENV İ UNUTURSA UYGULAMA BAŞLARKEN PATLAR.
  DATABASE_URL: requireEnv("DATABASE_URL"),
  
  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
};
