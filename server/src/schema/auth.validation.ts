import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
    .max(20, "Kullanıcı adı çok uzun.")
    .regex(/^[a-zA-Z0-9_]+$/, "Sadece harf, rakam ve alt çizgi kullanılabilir."),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır.")
    .regex(/[A-Z]/, "En az bir büyük harf içermelidir.")
    .regex(/[0-9]/, "En az bir rakam içermelidir."),
  birthdate: z.coerce.date().refine((date) => date < new Date(), "Doğum tarihi gelecekte olamaz."),
  avatarUrl: z.string().url("Geçersiz URL formatı").optional().nullable(),
});

export const LoginSchema = z.object({
  identifier: z.string().min(1, "E-posta veya kullanıcı adı gerekli."),
  password: z.string().min(1, "Şifre gerekli."),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;