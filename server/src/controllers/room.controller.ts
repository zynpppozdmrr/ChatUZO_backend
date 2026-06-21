import type { Request, Response } from 'express';
import type { CreateRoomInput, UpdateRoomInput, AssignRoomRoleInput } from '../schema/room.validation.js';
import {
  createRoom,
  getRoomBySlug,
  getUserRooms,
  getPublicRooms,
  getRoomByApiKey,
  updateRoom,
  deleteRoom,
  assignRoomRole,
  getRoomParticipants,
  muteParticipant,
  unmuteParticipant,
  banParticipant,
  unbanParticipant,
} from '../services/room.service.js';
import { getRoomMessages } from '../services/message.service.js';
import { ensureUserInRoom } from '../services/roomAccess.service.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const createRoomController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const room = await createRoom(req.user!.id, req.body as CreateRoomInput);
    res.status(201).json({ message: 'Oda başarıyla oluşturuldu.', room });
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Oda oluşturulurken bir hata oluştu.' });
  }
};

export const getRoomController = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await getRoomBySlug(req.params.slug);
    res.status(200).json({ room });
  } catch (error: any) {
    if (error.message === 'Oda bulunamadı.') {
      res.status(404).json({ message: error.message });
      return;
    }
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Oda bilgisi alınırken bir hata oluştu.' });
  }
};

export const getMyRoomsController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rooms = await getUserRooms(req.user!.id);
    res.status(200).json({ rooms });
  } catch (error: any) {
    console.error('Get my rooms error:', error);
    res.status(500).json({ message: 'Odalar listelenirken bir hata oluştu.' });
  }
};

export const getPublicRoomsController = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rooms = await getPublicRooms();
    res.status(200).json({ rooms });
  } catch (error: any) {
    console.error('Get public rooms error:', error);
    res.status(500).json({ message: 'Açık odalar listelenirken bir hata oluştu.' });
  }
};

export const getRoomByApiKeyController = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await getRoomByApiKey(req.params.apiKey);
    res.status(200).json({
      room,
      message: 'Bu API key ile odayı sitenize entegre edebilirsiniz.',
    });
  } catch (error: any) {
    if (error.message === 'Geçersiz API key.') {
      res.status(404).json({ message: error.message });
      return;
    }
    console.error('Get room by API key error:', error);
    res.status(500).json({ message: 'Oda bilgisi alınırken bir hata oluştu.' });
  }
};

export const getRoomMessagesController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const limit = Number(req.query.limit ?? 20);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

    const result = await getRoomMessages({ userId: req.user!.id, roomId, limit, cursor });
    if (!result.ok) {
      const status = result.error === 'ROOM_ACCESS_DENIED' || result.error === 'ROOM_BANNED' ? 403 : 404;
      res.status(status).json({ message: result.error });
      return;
    }

    res.status(200).json({ messages: result.messages, nextCursor: result.nextCursor });
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({ message: 'Mesajlar alınırken bir hata oluştu.' });
  }
};

export const updateRoomController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user!.platformRole === 'ADMIN';
    const updatedRoom = await updateRoom(req.params.id, req.user!.id, isAdmin, req.body as UpdateRoomInput);
    res.status(200).json({ message: 'Oda başarıyla güncellendi.', room: updatedRoom });
  } catch (error: any) {
    if (error.message === 'Oda bulunamadı.') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message === 'Bu odayı güncelleme yetkiniz yok.') {
      res.status(403).json({ message: error.message });
      return;
    }
    if (error.message) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Oda güncellenirken bir hata oluştu.' });
  }
};

export const deleteRoomController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user!.platformRole === 'ADMIN';
    const result = await deleteRoom(req.params.id, req.user!.id, isAdmin);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Oda bulunamadı.') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message === 'Bu odayı silme yetkiniz yok.') {
      res.status(403).json({ message: error.message });
      return;
    }
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Oda silinirken bir hata oluştu.' });
  }
};

export const assignRoomRoleController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user!.platformRole === 'ADMIN';
    const { roomId, userId } = req.params;
    const { role } = req.body as AssignRoomRoleInput;

    const result = await assignRoomRole(roomId, userId, role, req.user!.id, isAdmin);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Oda bulunamadı.' || error.message === 'Katılımcı bulunamadı.') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message.includes('yetkiniz yok') || error.message === 'Oda sahibi zaten maksimum yetkilere sahiptir.') {
      res.status(403).json({ message: error.message });
      return;
    }
    console.error('Assign room role error:', error);
    res.status(500).json({ message: 'Rol atanırken bir hata oluştu.' });
  }
};

export const getRoomParticipantsController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    const access = await ensureUserInRoom(req.user!.id, roomId);
    if (!access.ok) {
      const status = access.error === 'ROOM_ACCESS_DENIED' || access.error === 'ROOM_BANNED' ? 403 : 404;
      res.status(status).json({ message: access.error });
      return;
    }

    const result = await getRoomParticipants(access.roomId);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Oda bulunamadı.') {
      res.status(404).json({ message: error.message });
      return;
    }
    console.error('Get room participants error:', error);
    res.status(500).json({ message: 'Katılımcılar alınırken bir hata oluştu.' });
  }
};

type ParticipantStatusService = (
  roomId: string,
  userId: string,
  requestingUserId: string,
  isAdmin: boolean
) => Promise<unknown>;

const participantStatusController = (service: ParticipantStatusService, operation: string) =>
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const isAdmin = req.user!.platformRole === 'ADMIN';
      const { roomId, userId } = req.params;
      const result = await service(roomId, userId, req.user!.id, isAdmin);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Oda bulunamadı.' || error.message === 'Katılımcı bulunamadı.') {
        res.status(404).json({ message: error.message });
        return;
      }
      if (
        error.message.includes('yetkiniz yok') ||
        error.message === 'Oda sahibine işlem uygulanamaz.' ||
        error.message.includes('zaten')
      ) {
        res.status(403).json({ message: error.message });
        return;
      }
      console.error(`Participant ${operation} error:`, error);
      res.status(500).json({ message: `Katılımcı ${operation}ında bir hata oluştu.` });
    }
  };

export const muteParticipantController = participantStatusController(muteParticipant, 'muteleme');
export const unmuteParticipantController = participantStatusController(unmuteParticipant, 'muteleme kaldırma');
export const banParticipantController = participantStatusController(banParticipant, 'banlama');
export const unbanParticipantController = participantStatusController(unbanParticipant, 'banlama kaldırma');
