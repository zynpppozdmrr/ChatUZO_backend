import "dotenv/config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 5000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",

  // DATABASEURL YOKSA BU SERVİS ÇALIŞMASIN. EĞER BİRİ .ENV İ UNUTURSA UYGULAMA BAŞLARKEN PATLAR.
  DATABASE_URL: requireEnv("DATABASE_URL"),



};
