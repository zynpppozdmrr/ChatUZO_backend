# ChatUZO API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
API, JWT (JSON Web Token) tabanlı authentication kullanır. Login işleminden sonra dönen `accessToken`'ı Bearer token olarak kullanın.

```
Authorization: Bearer <your_jwt_token>
```

---

## 📁 Authentication Endpoints

### 1. Register (Kayıt Ol)
**Endpoint:** `POST /api/auth/register`

**Authentication:** ❌ Gerekli değil

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "Test1234",
  "birthdate": "2000-01-01T00:00:00.000Z",
  "avatarUrl": "https://i.pravatar.cc/150?img=1" // Optional
}
```

**Validation Rules:**
- `email`: Valid email format, unique
- `username`: 3-50 karakter, unique
- `password`: Minimum 6 karakter
- `birthdate`: ISO 8601 datetime format
- `avatarUrl`: Valid URL (optional)

**Success Response (201):**
```json
{
  "message": "Kayıt başarılı! Giriş yapabilirsiniz.",
  "userId": "uuid-string"
}
```

**Error Response (400):**
```json
{
  "message": "Bu e-posta adresi zaten kullanılıyor."
}
```

---

### 2. Login (Giriş Yap)
**Endpoint:** `POST /api/auth/login`

**Authentication:** ❌ Gerekli değil

**Request Body:**
```json
{
  "identifier": "testuser",  // email veya username
  "password": "Test1234"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "username": "testuser",
    "avatarUrl": "https://i.pravatar.cc/150?img=1",
    "platformRole": "USER",
    "status": "ACTIVE"
  }
}
```

**Error Responses:**
- `401`: E-posta/kullanıcı adı veya şifre hatalı
- `403`: Hesabınız yasaklanmış/askıya alınmış

---

## 📁 User Endpoints

### 1. Get My Profile
**Endpoint:** `GET /api/users/me`

**Authentication:** ✅ Required (Bearer Token)

**Success Response (200):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "username": "testuser",
  "avatarUrl": "https://i.pravatar.cc/150?img=1",
  "birthdate": "2000-01-01T00:00:00.000Z",
  "isGuest": false,
  "status": "ACTIVE",
  "platformRole": "USER",
  "createdAt": "2026-01-02T10:00:00.000Z",
  "updatedAt": "2026-01-02T10:00:00.000Z"
}
```

---

### 2. Update My Profile
**Endpoint:** `PUT /api/users/me`

**Authentication:** ✅ Required (Bearer Token)

**Request Body:**
```json
{
  "username": "newusername",  // Optional
  "avatarUrl": "https://i.pravatar.cc/150?img=5",  // Optional
  "birthdate": "2000-06-15T00:00:00.000Z"  // Optional
}
```

**Success Response (200):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "username": "newusername",
  "avatarUrl": "https://i.pravatar.cc/150?img=5",
  "birthdate": "2000-06-15T00:00:00.000Z",
  "status": "ACTIVE",
  "platformRole": "USER",
  "updatedAt": "2026-01-02T12:00:00.000Z"
}
```

---

### 3. Get All Users (Admin Only)
**Endpoint:** `GET /api/users`

**Authentication:** ✅ Required (Bearer Token + ADMIN role)

**Success Response (200):**
```json
[
  {
    "id": "uuid-string",
    "email": "user@example.com",
    "username": "testuser",
    "avatarUrl": "https://i.pravatar.cc/150?img=1",
    "isGuest": false,
    "status": "ACTIVE",
    "platformRole": "USER",
    "createdAt": "2026-01-02T10:00:00.000Z",
    "_count": {
      "ownedRooms": 5,
      "roomParticipants": 10,
      "messages": 250
    }
  }
]
```

**Error Response (403):**
```json
{
  "error": "Bu işlem için admin yetkisi gereklidir."
}
```

---

### 4. Get User by ID
**Endpoint:** `GET /api/users/:id`

**Authentication:** ❌ Gerekli değil (Public)

**URL Parameters:**
- `id` (UUID): User ID

**Success Response (200):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "username": "testuser",
  "avatarUrl": "https://i.pravatar.cc/150?img=1",
  "birthdate": "2000-01-01T00:00:00.000Z",
  "isGuest": false,
  "status": "ACTIVE",
  "platformRole": "USER",
  "createdAt": "2026-01-02T10:00:00.000Z",
  "updatedAt": "2026-01-02T10:00:00.000Z"
}
```

---

### 5. Change User Role (Admin Only)
**Endpoint:** `PUT /api/users/:id/role`

**Authentication:** ✅ Required (Bearer Token + ADMIN role)

**URL Parameters:**
- `id` (UUID): User ID

**Request Body:**
```json
{
  "platformRole": "ADMIN"  // "USER" or "ADMIN"
}
```

**Success Response (200):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "username": "testuser",
  "platformRole": "ADMIN",
  "updatedAt": "2026-01-02T12:00:00.000Z"
}
```

---

### 6. Delete User
**Endpoint:** `DELETE /api/users/:id`

**Authentication:** ✅ Required (Bearer Token - Admin or own account)

**URL Parameters:**
- `id` (UUID): User ID

**Success Response (200):**
```json
{
  "message": "Kullanıcı başarıyla silindi."
}
```

**Error Response (400):**
```json
{
  "error": "Bu kullanıcının sahip olduğu 3 oda bulunmaktadır. Önce odaları silmelisiniz veya başka birine devretmelisiniz."
}
```

---

## 📁 Room Endpoints

### 1. Create Room
**Endpoint:** `POST /api/rooms`

**Authentication:** ✅ Required (Bearer Token)

**Request Body:**
```json
{
  "name": "Test Chat Room",
  "slug": "test-chat-room",
  "isPrivate": false,
  "password": "SecretPass123",  // Required if isPrivate=true
  "maxUsers": 50,
  "allowedDomains": ["https://example.com"],
  "uiSettings": {
    "theme": "dark",  // "light" | "dark" | "system"
    "primaryColor": "#6366f1",
    "bgType": "color",  // "color" | "gradient" | "image"
    "bgValue": "#1f2937",
    "bubbleStyle": "rounded",  // "rounded" | "modern" | "minimal"
    "fontSettings": {
      "family": "Inter",
      "baseSize": 14,
      "weight": "medium"
    },
    "headerTitle": "Welcome to Test Room",
    "showBranding": true
  },
  "logicConfig": {
    "slowMode": 0,  // Seconds between messages
    "allowGifs": true,
    "profanityFilter": false,
    "guestAccess": true,
    "showTyping": true,
    "readReceipts": true,
    "stickyMessage": "Welcome! Please be respectful.",
    "historyRetentionDays": 30
  },
  "roomPlanId": "uuid-string"
}
```

**Success Response (201):**
```json
{
  "message": "Oda başarıyla oluşturuldu.",
  "room": {
    "id": "uuid-string",
    "name": "Test Chat Room",
    "slug": "test-chat-room",
    "apiKey": "clxxxxxxxxxxxxxx",  // Auto-generated for website integration
    "isPrivate": false,
    "maxUsers": 50,
    "allowedDomains": ["https://example.com"],
    "uiSettings": { ... },
    "logicConfig": { ... },
    "createdAt": "2026-01-02T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Bu slug zaten kullanılıyor
- `400`: Geçersiz plan seçimi
- `400`: Seçilen plan maksimum 50 kullanıcıyı desteklemektedir

---

### 2. Get My Rooms
**Endpoint:** `GET /api/rooms/my-rooms`

**Authentication:** ✅ Required (Bearer Token)

**Success Response (200):**
```json
{
  "rooms": [
    {
      "id": "uuid-string",
      "name": "Test Chat Room",
      "slug": "test-chat-room",
      "isPrivate": false,
      "maxUsers": 50,
      "createdAt": "2026-01-02T10:00:00.000Z",
      "_count": {
        "participants": 15,
        "messages": 320
      }
    }
  ]
}
```

---

### 3. Get Room by Slug
**Endpoint:** `GET /api/rooms/:slug`

**Authentication:** ❌ Gerekli değil (Public)

**URL Parameters:**
- `slug` (string): Room slug

**Success Response (200):**
```json
{
  "room": {
    "id": "uuid-string",
    "name": "Test Chat Room",
    "slug": "test-chat-room",
    "isPrivate": false,
    "maxUsers": 50,
    "allowedDomains": ["https://example.com"],
    "uiSettings": { ... },
    "logicConfig": { ... },
    "owner": {
      "id": "uuid-string",
      "username": "testuser",
      "email": "user@example.com"
    },
    "roomPlan": {
      "id": "uuid-string",
      "name": "DEFAULT",
      "maxUsers": 50,
      "retentionDays": 30
    },
    "_count": {
      "participants": 15,
      "messages": 320
    },
    "createdAt": "2026-01-02T10:00:00.000Z"
  }
}
```

---

### 4. Get Room by API Key (Public)
**Endpoint:** `GET /api/rooms/api-key/:apiKey`

**Authentication:** ❌ Gerekli değil (Public - Website Integration)

**URL Parameters:**
- `apiKey` (string): Room API Key

**Description:** Bu endpoint, oda oluşturulurken otomatik generate edilen API key ile oda bilgilerini getirir. Kullanıcılar bu API key'i kullanarak odayı kendi websitelerine entegre edebilir.

**Success Response (200):**
```json
{
  "room": {
    "id": "uuid-string",
    "name": "Test Chat Room",
    "slug": "test-chat-room",
    "apiKey": "clxxxxxxxxxxxxxx",
    "isPrivate": false,
    "maxUsers": 50,
    "allowedDomains": ["https://example.com"],
    "uiSettings": { ... },
    "logicConfig": { ... },
    "owner": {
      "id": "uuid-string",
      "username": "testuser"
    },
    "roomPlan": {
      "name": "DEFAULT",
      "maxUsers": 50,
      "retentionDays": 30,
      "features": { ... }
    },
    "_count": {
      "participants": 15,
      "messages": 320
    },
    "createdAt": "2026-01-02T10:00:00.000Z"
  },
  "message": "Bu API key ile odayı sitenize entegre edebilirsiniz."
}
```

**Error Response (404):**
```json
{
  "message": "Geçersiz API key."
}
```

---

### 5. Update Room (Owner or Admin)
**Endpoint:** `PUT /api/rooms/:id`

**Authentication:** ✅ Required (Bearer Token - Owner or Admin)

**URL Parameters:**
- `id` (UUID): Room ID

**Request Body:**
```json
{
  "name": "Updated Room Name",  // Optional
  "isPrivate": true,  // Optional
  "password": "NewPassword123",  // Optional
  "maxUsers": 100,  // Optional
  "allowedDomains": ["https://newdomain.com"],  // Optional
  "uiSettings": {  // Optional
    "theme": "light",
    "primaryColor": "#10b981",
    "bgType": "gradient",
    "bgValue": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "bubbleStyle": "modern",
    "fontSettings": {
      "family": "Roboto",
      "baseSize": 16,
      "weight": "bold"
    },
    "headerTitle": "Updated Room Title",
    "showBranding": false
  },
  "logicConfig": {  // Optional
    "slowMode": 5,
    "allowGifs": false,
    "profanityFilter": true,
    "guestAccess": false,
    "showTyping": true,
    "readReceipts": true,
    "stickyMessage": "Updated sticky message",
    "historyRetentionDays": 90
  }
}
```

**Note:** Tüm alanlar opsiyoneldir. Sadece güncellemek istediğiniz alanları gönderin.

**Success Response (200):**
```json
{
  "message": "Oda başarıyla güncellendi.",
  "room": {
    "id": "uuid-string",
    "name": "Updated Room Name",
    "slug": "test-chat-room",
    "apiKey": "clxxxxxxxxxxxxxx",
    "isPrivate": true,
    "maxUsers": 100,
    "allowedDomains": ["https://newdomain.com"],
    "uiSettings": { ... },
    "logicConfig": { ... },
    "updatedAt": "2026-01-02T15:00:00.000Z"
  }
}
```

**Error Responses:**
- `404`: Oda bulunamadı
- `403`: Bu odayı güncelleme yetkiniz yok
- `400`: Plan maksimum X kullanıcıyı desteklemektedir

---

### 6. Delete Room (Owner or Admin)
**Endpoint:** `DELETE /api/rooms/:id`

**Authentication:** ✅ Required (Bearer Token - Owner or Admin)

**URL Parameters:**
- `id` (UUID): Room ID

**Description:** Odayı siler. Bu işlem cascade delete yapar, yani oda ile ilişkili tüm participants ve messages de silinir.

**Success Response (200):**
```json
{
  "message": "Oda başarıyla silindi.",
  "deletedCounts": {
    "messages": 320,
    "participants": 15
  }
}
```

**Error Responses:**
- `404`: Oda bulunamadı
- `403`: Bu odayı silme yetkiniz yok

---

## 📁 Room Plan Endpoints

### 1. Get All Plans
**Endpoint:** `GET /api/room-plans`

**Authentication:** ❌ Gerekli değil (Public)

**Success Response (200):**
```json
[
  {
    "id": "uuid-string",
    "name": "DEFAULT",
    "maxUsers": 50,
    "retentionDays": 30,
    "features": {
      "canUseGifs": true,
      "customFonts": false,
      "whiteLabel": false,
      "customDomains": 1,
      "apiAccess": true
    },
    "_count": {
      "rooms": 12
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid-string",
    "name": "GOLD",
    "maxUsers": 100,
    "retentionDays": 90,
    "features": {
      "canUseGifs": true,
      "customFonts": true,
      "whiteLabel": false,
      "customDomains": 3,
      "apiAccess": true
    },
    "_count": {
      "rooms": 5
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid-string",
    "name": "PLATINIUM",
    "maxUsers": 500,
    "retentionDays": 365,
    "features": {
      "canUseGifs": true,
      "customFonts": true,
      "whiteLabel": true,
      "customDomains": 999,
      "apiAccess": true
    },
    "_count": {
      "rooms": 2
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Get Plan by ID
**Endpoint:** `GET /api/room-plans/:id`

**Authentication:** ❌ Gerekli değil (Public)

**URL Parameters:**
- `id` (UUID): Plan ID

**Success Response (200):**
```json
{
  "id": "uuid-string",
  "name": "GOLD",
  "maxUsers": 100,
  "retentionDays": 90,
  "features": {
    "canUseGifs": true,
    "customFonts": true,
    "whiteLabel": false,
    "customDomains": 3,
    "apiAccess": true
  },
  "_count": {
    "rooms": 5
  },
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

---

### 3. Create Plan (Admin Only)
**Endpoint:** `POST /api/room-plans`

**Authentication:** ✅ Required (Bearer Token + ADMIN role)

**Request Body:**
```json
{
  "name": "GOLD",  // "DEFAULT" | "GOLD" | "PLATINIUM"
  "maxUsers": 100,
  "retentionDays": 90,
  "features": {
    "canUseGifs": true,
    "customFonts": true,
    "whiteLabel": false,
    "customDomains": 3,
    "apiAccess": true
  }
}
```

**Validation Rules:**
- `name`: RoomPlanType enum (DEFAULT, GOLD, PLATINIUM)
- `maxUsers`: 1-1000
- `retentionDays`: 1-365
- `features`: Optional JSON object

**Success Response (201):**
```json
{
  "id": "uuid-string",
  "name": "GOLD",
  "maxUsers": 100,
  "retentionDays": 90,
  "features": { ... },
  "createdAt": "2026-01-02T10:00:00.000Z",
  "updatedAt": "2026-01-02T10:00:00.000Z"
}
```

**Error Responses:**
- `400`: Bu plan adı zaten kullanılıyor
- `403`: Bu işlem için admin yetkisi gereklidir

---

### 4. Update Plan (Admin Only)
**Endpoint:** `PUT /api/room-plans/:id`

**Authentication:** ✅ Required (Bearer Token + ADMIN role)

**URL Parameters:**
- `id` (UUID): Plan ID

**Request Body:**
```json
{
  "maxUsers": 150,  // Optional
  "retentionDays": 120,  // Optional
  "features": {  // Optional
    "canUseGifs": true,
    "customFonts": true,
    "whiteLabel": true,
    "customDomains": 5,
    "apiAccess": true
  }
}
```

**Success Response (200):**
```json
{
  "id": "uuid-string",
  "name": "GOLD",
  "maxUsers": 150,
  "retentionDays": 120,
  "features": { ... },
  "updatedAt": "2026-01-02T12:00:00.000Z"
}
```

---

### 5. Delete Plan (Admin Only)
**Endpoint:** `DELETE /api/room-plans/:id`

**Authentication:** ✅ Required (Bearer Token + ADMIN role)

**URL Parameters:**
- `id` (UUID): Plan ID

**Success Response (200):**
```json
{
  "message": "Plan başarıyla silindi."
}
```

**Error Response (400):**
```json
{
  "message": "Bu plana bağlı 5 oda bulunmaktadır. Önce bu odaları silmelisiniz."
}
```

---

## 📊 Database Schema Overview

### User Model
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `username`: String (Unique)
- `passwordHash`: String
- `birthdate`: DateTime
- `avatarUrl`: String? (Nullable)
- `isGuest`: Boolean (Default: false)
- `status`: UserStatus (ACTIVE, SUSPENDED, BANNED)
- `platformRole`: PlatformRole (USER, ADMIN)

### Room Model
- `id`: UUID (Primary Key)
- `name`: String
- `slug`: String (Unique)
- `apiKey`: String (Unique, Auto-generated)
- `isPrivate`: Boolean
- `password`: String? (Hashed)
- `maxUsers`: Int
- `allowedDomains`: String[]
- `ownerId`: UUID (Foreign Key → User)
- `roomPlanId`: UUID (Foreign Key → RoomPlan)
- `uiSettings`: JSON
- `logicConfig`: JSON

### RoomPlan Model
- `id`: UUID (Primary Key)
- `name`: RoomPlanType (DEFAULT, GOLD, PLATINIUM) (Unique)
- `maxUsers`: Int
- `retentionDays`: Int
- `features`: JSON?

### Message Model
- `id`: UUID (Primary Key)
- `content`: String
- `messageType`: MessageType (TEXT, GIF, SYSTEM)
- `roomId`: UUID (Foreign Key → Room)
- `userId`: UUID? (Foreign Key → User, Nullable for system messages)
- `deletedAt`: DateTime? (Soft delete)

### RoomParticipant Model
- `id`: UUID (Primary Key)
- `roomId`: UUID (Foreign Key → Room)
- `userId`: UUID (Foreign Key → User)
- `role`: RoomParticipantRole (OWNER, MODERATOR, MEMBER)
- `status`: ParticipantStatus (ACTIVE, MUTED, BANNED)
- `joinedAt`: DateTime

---

## 🔐 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - İstek başarılı |
| 201 | Created - Kaynak başarıyla oluşturuldu |
| 400 | Bad Request - Geçersiz istek veya validation hatası |
| 401 | Unauthorized - Authentication gerekli veya geçersiz token |
| 403 | Forbidden - Yetkisiz erişim (Admin gerekli) |
| 404 | Not Found - Kaynak bulunamadı |
| 500 | Internal Server Error - Sunucu hatası |

---

## 📝 Notes

### Authentication Flow
1. User registers via `/api/auth/register`
2. User logs in via `/api/auth/login` and receives JWT token
3. Token is sent in `Authorization: Bearer <token>` header for protected endpoints
4. Token expires in 7 days (configurable in JWT_EXPIRES_IN env variable)

### Room Creation Flow
1. User must be authenticated
2. User selects a RoomPlan (DEFAULT, GOLD, or PLATINIUM)
3. Room is created with auto-generated `apiKey`
4. User can integrate room into their website using the `apiKey`
5. CORS protection via `allowedDomains` array

### Website Integration
Kullanıcılar oda oluşturduktan sonra dönen `apiKey`'i kullanarak:
```
GET /api/rooms/api-key/{apiKey}
```
endpoint'inden oda bilgilerini alıp kendi sitelerine entegre edebilirler.

### Admin Operations
Admin yetkisi gerektiren endpoint'ler:
- Create/Update/Delete RoomPlan
- Get All Users
- Change User Role
- Delete Any User

---

## 🚀 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chatuzo"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
```
