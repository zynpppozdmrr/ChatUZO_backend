//Room CRUD, Joining
import type { Request, Response } from 'express';
import type { CreateRoomInput, UpdateRoomInput, AssignModeratorInput, ParticipantStatusInput } from '../schema/room.validation.js';
import { createRoom, getRoomBySlug, getUserRooms, getPublicRooms, getRoomByApiKey, updateRoom, deleteRoom, assignModeratorRole, getRoomParticipants, muteParticipant, unmuteParticipant, banParticipant, unbanParticipant } from '../services/room.service.js';
import { getRoomMessages } from '../services/message.service.js';
import { ensureUserInRoom } from '../services/roomAccess.service.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
// Authenticated request type (JWT middleware sonrası)


export const createRoomController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const validatedData = req.body as CreateRoomInput;

    const room = await createRoom(userId, validatedData);

    res.status(201).json({
      message: 'Oda başarıyla oluşturuldu.',
      room
    });
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
    const { slug } = req.params;

    const room = await getRoomBySlug(slug);

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
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const rooms = await getUserRooms(userId);

    res.status(200).json({ rooms });
  } catch (error: any) {
    console.error('Get my rooms error:', error);
    res.status(500).json({ message: 'Odalar listelenirken bir hata oluştu.' });
  }
};

export const getPublicRoomsController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rooms = await getPublicRooms();
    res.status(200).json({ rooms });
  } catch (error: any) {
    console.error('Get public rooms error:', error);
    res.status(500).json({ message: 'Açık odalar listelenirken bir hata oluştu.' });
  }
};

// API Key ile oda bilgilerini getir (Public - Website entegrasyonu için)
export const getRoomByApiKeyController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey } = req.params;

    const room = await getRoomByApiKey(apiKey);

    // CORS kontrolü için allowed domains bilgisini de dönüyoruz
    res.status(200).json({
      room,
      message: 'Bu API key ile odayı sitenize entegre edebilirsiniz.'
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
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const { roomId } = req.params;
    const limit = Number(req.query.limit ?? 20);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

    const result = await getRoomMessages({ userId, roomId, limit, cursor });
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

// Oda güncelle (Owner veya Admin)
export const updateRoomController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.platformRole === 'ADMIN';

    if (!userId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const { id } = req.params;
    const validatedData = req.body as UpdateRoomInput;

    const updatedRoom = await updateRoom(id, userId, isAdmin, validatedData);

    res.status(200).json({
      message: 'Oda başarıyla güncellendi.',
      room: updatedRoom
    });
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

// Oda sil (Owner veya Admin)
export const deleteRoomController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.platformRole === 'ADMIN';

    if (!userId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const { id } = req.params;

    const result = await deleteRoom(id, userId, isAdmin);

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

export const assignModeratorController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requestingUserId = req.user?.id;
    const isAdmin = req.user?.platformRole === 'ADMIN';

    if (!requestingUserId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const { roomId } = req.params;
    const validatedData = req.body as AssignModeratorInput;

    const result = await assignModeratorRole(roomId, validatedData.participantId, validatedData.isModerator, requestingUserId, isAdmin);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Oda bulunamadı.') {
      res.status(404).json({ message: error.message });
      return;
    }

    if (error.message === 'Katılımcı bulunamadı.') {
      res.status(404).json({ message: error.message });
      return;
    }

    if (error.message.includes('yetkiniz yok') || error.message === 'Bu katılımcı bu odaya ait değil.' || error.message === 'Oda sahibi zaten maksimum yetkilere sahiptir.') {
      res.status(403).json({ message: error.message });
      return;
    }

    console.error('Assign moderator error:', error);
    res.status(500).json({ message: 'Moderatör atanırken bir hata oluştu.' });
  }
};

export const getRoomParticipantsController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const { roomId } = req.params;

    const access = await ensureUserInRoom(userId, roomId);
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

// Katılımcıyı muteleme (Owner/Moderator işlemi)
export const muteParticipantController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requestingUserId = req.user?.id;
    const isAdmin = req.user?.platformRole === 'ADMIN';

    if (!requestingUserId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const { roomId, userId } = req.params;

    const result = await muteParticipant(roomId, userId, requestingUserId, isAdmin);

    res.status(200).json(result);
  } catch (error: any) {
    handleParticipantStatusError(error, res, 'muteleme');
  }
};

// Katılımcıyı mutelemeyi kaldırma
export const unmuteParticipantController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requestingUserId = req.user?.id;
    const isAdmin = req.user?.platformRole === 'ADMIN';

    if (!requestingUserId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const { roomId, userId } = req.params;

    const result = await unmuteParticipant(roomId, userId, requestingUserId, isAdmin);

    res.status(200).json(result);
  } catch (error: any) {
    handleParticipantStatusError(error, res, 'muteleme kaldırma');
  }
};

// Katılımcıyı banlama
export const banParticipantController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requestingUserId = req.user?.id;
    const isAdmin = req.user?.platformRole === 'ADMIN';

    if (!requestingUserId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const { roomId, userId } = req.params;

    const result = await banParticipant(roomId, userId, requestingUserId, isAdmin);

    res.status(200).json(result);
  } catch (error: any) {
    handleParticipantStatusError(error, res, 'banlama');
  }
};

// Katılımcının banını kaldırma
export const unbanParticipantController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requestingUserId = req.user?.id;
    const isAdmin = req.user?.platformRole === 'ADMIN';

    if (!requestingUserId) {
      res.status(401).json({ message: 'Yetkilendirme gerekli.' });
      return;
    }

    const { roomId, userId } = req.params;

    const result = await unbanParticipant(roomId, userId, requestingUserId, isAdmin);

    res.status(200).json(result);
  } catch (error: any) {
    handleParticipantStatusError(error, res, 'banlama kaldırma');
  }
};

// Helper: Katılımcı status hataları
const handleParticipantStatusError = (error: any, res: Response, operation: string) => {
  if (error.message === 'Oda bulunamadı.' || error.message === 'Katılımcı bulunamadı.') {
    res.status(404).json({ message: error.message });
    return;
  }

  if (error.message.includes('yetkiniz yok') || error.message === 'Oda sahibine işlem uygulanamaz.' || error.message.includes('zaten')) {
    res.status(403).json({ message: error.message });
    return;
  }

  console.error(`Participant ${operation} error:`, error);
  res.status(500).json({ message: `Katılımcı ${operation}ında bir hata oluştu.` });
};