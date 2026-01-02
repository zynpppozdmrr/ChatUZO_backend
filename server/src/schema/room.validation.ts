import { z } from 'zod';
import { UISettingsSchema, LogicConfigSchema } from './settings.validation.js';

export const CreateRoomSchema = z.object({
  name: z.string().min(2, "Oda adı çok kısa").max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Geçersiz slug formatı"),
  isPrivate: z.boolean(),
  password: z.string().optional(),
  maxUsers: z.number().int().positive(),
  allowedDomains: z.array(z.string().url("Geçersiz domain formatı")).min(1),
  uiSettings: UISettingsSchema,
  logicConfig: LogicConfigSchema,
  roomPlanId: z.string().uuid("Geçersiz Plan ID"),
}).refine((data) => {
  if (data.isPrivate && !data.password) {
    return false;
  }
  return true;
}, {
  message: "Özel odalar için şifre zorunludur.",
  path: ["password"],
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

// Update Room Schema (tüm alanlar opsiyonel)
export const UpdateRoomSchema = z.object({
  name: z.string().min(2, "Oda adı çok kısa").max(100).optional(),
  isPrivate: z.boolean().optional(),
  password: z.string().optional(),
  maxUsers: z.number().int().positive().optional(),
  allowedDomains: z.array(z.string().url("Geçersiz domain formatı")).min(1).optional(),
  uiSettings: UISettingsSchema.optional(),
  logicConfig: LogicConfigSchema.optional(),
});

export type UpdateRoomInput = z.infer<typeof UpdateRoomSchema>;