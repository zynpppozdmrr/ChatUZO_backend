//Room CRUD, Joining
import type { Request, Response } from 'express';
import type { CreateRoomInput } from '../schema/room.validation.js';
import { createRoom, getRoomBySlug, getUserRooms, getRoomByApiKey } from '../services/room.service.js';
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