import { z } from 'zod';
import { UISettingsSchema, LogicConfigSchema } from './settings.validation.js';

export const CreateRoomSchema = z.object({
  name: z.string().min(2, "Oda adı çok kısa").max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Geçersiz slug formatı"),
  isPrivate: z.boolean(),
  password: z.string().optional(),
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

export const AssignRoomRoleSchema = z.object({
  role: z.enum(['ROOM_ADMIN', 'ROOM_MODERATOR', 'MEMBER']),
});

export type AssignRoomRoleInput = z.infer<typeof AssignRoomRoleSchema>;

export const ParticipantStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'MUTED', 'BANNED']),
});

export type ParticipantStatusInput = z.infer<typeof ParticipantStatusSchema>;