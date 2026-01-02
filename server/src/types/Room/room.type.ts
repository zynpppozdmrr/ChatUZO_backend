import { UISettings } from './UIconfig.type.js';
import { LogicConfig } from './logicConfig.type.js';

export interface CreateRoomDto {
  name: string;
  slug: string;
  isPrivate: boolean;
  password?: string;         // Eğer isPrivate true ise
  maxUsers: number;          // Plana göre frontend'de kısıtlanmalı
  allowedDomains: string[];  // En az 1 tane zorunlu
  uiSettings: UISettings;
  logicConfig: LogicConfig;
  planId: string;            // Seçilen RoomPlan ID'si
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