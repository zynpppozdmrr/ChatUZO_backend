import { z } from 'zod';

export const UISettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Geçersiz HEX kodu"),
  bgType: z.enum(['color', 'gradient', 'image']),
  bgValue: z.string().min(1),
  bubbleStyle: z.enum(['rounded', 'sharp', 'modern']),
  fontSettings: z.object({
    family: z.string(),
    baseSize: z.number().min(8).max(32),
    weight: z.enum(['light', 'regular', 'medium', 'bold']),
  }),
  headerTitle: z.string().max(50),
  showBranding: z.boolean(),
});

export const LogicConfigSchema = z.object({
  slowMode: z.number().min(0).max(3600),
  allowGifs: z.boolean(),
  profanityFilter: z.boolean(),
  guestAccess: z.boolean(),
  showTyping: z.boolean(),
  readReceipts: z.boolean(),
  stickyMessage: z.string().max(255).optional(),
  historyRetentionDays: z.number().positive(),
});

export type UISettings = z.infer<typeof UISettingsSchema>;
export type LogicConfig = z.infer<typeof LogicConfigSchema>;