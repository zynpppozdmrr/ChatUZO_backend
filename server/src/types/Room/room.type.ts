import { UISettings } from './UIconfig.type.js';
import { LogicConfig } from './logicConfig.type.js';

export interface CreateRoomDto {
  name: string;
  slug: string;
  isPrivate: boolean;
  password?: string;         // Eğer isPrivate true ise
  allowedDomains: string[];  // En az 1 tane zorunlu
  uiSettings: UISettings;
  logicConfig: LogicConfig;
  roomPlanId: string;        // Seçilen RoomPlan ID'si (schema ile uyumlu)
}

export interface RoomHandshakeResponse {
  roomId: string;
  name: string;
  ui: UISettings;
  logic: LogicConfig;
  isBanned: boolean;      // Kullanıcı bu odadan banlı mı?
  isMuted: boolean;       // Kullanıcı susturulmuş mu?
  currentParticipants: number;
  maxParticipants: number;
}