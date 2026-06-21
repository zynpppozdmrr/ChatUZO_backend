import { z } from 'zod';
import { RoomPlanType } from '../../generated/prisma/enums.js';

const PlanFeaturesSchema = z.object({
  canUseGifs: z.boolean().optional(),
  customFonts: z.boolean().optional(),
  whiteLabel: z.boolean().optional(),
  customDomains: z.number().optional(),
  apiAccess: z.boolean().optional(),
}).optional();

export const CreateRoomPlanSchema = z.object({
  name: z.nativeEnum(RoomPlanType),
  maxUsers: z.number().min(1).max(1000, "Maksimum kullanıcı sayısı 1-1000 arası olmalı"),
  retentionDays: z.number().min(1).max(365, "Mesaj saklama süresi 1-365 gün arası olmalı"),
  features: PlanFeaturesSchema
});

export const UpdateRoomPlanSchema = z.object({
  maxUsers: z.number().min(1).max(1000).optional(),
  retentionDays: z.number().min(1).max(365).optional(),
  features: PlanFeaturesSchema
});

export type CreateRoomPlanInput = z.infer<typeof CreateRoomPlanSchema>;
export type UpdateRoomPlanInput = z.infer<typeof UpdateRoomPlanSchema>;
