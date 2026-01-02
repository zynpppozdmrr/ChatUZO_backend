import { z } from 'zod';
import { PlatformRole } from '../../generated/prisma/enums.js';

// Change User Role Schema (Admin only)
export const ChangeRoleSchema = z.object({
  platformRole: z.nativeEnum(PlatformRole)
});

// Update User Profile Schema
export const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  birthdate: z.string().datetime().optional()
});

export type ChangeRoleInput = z.infer<typeof ChangeRoleSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
