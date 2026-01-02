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