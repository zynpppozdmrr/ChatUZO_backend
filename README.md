# Project Architecture & Socket.IO Flow Walkthrough

This document explains the current structure of your Realtime Multi-Tenant Chat Platform and how the detailed message flow works.

## 1. Technology Stack

*   **Server**: Node.js with Express.
    *   **Communication**: `socket.io` for real-time events.
    *   **Database**: Prisma (PostgreSQL) is configured but currently not used for message storage in the active socket flow.
*   **Client**: React (Vite).
    *   **Communication**: `socket.io-client`.
    *   **Styling**: Tailwind CSS (classes like `flex`, `bg-indigo-600` seen in components).

## 2. High-Level Architecture

The app is divided into two distinct parts that speak to each other via **Events**:

```mermaid
sequenceDiagram
    participant User
    participant Client (React)
    participant Server (Node/Socket.IO)
    
    User->>Client: Enters Name & Room
    Client->>Server: Connects & Joins Room
    User->>Client: Sends Message
    Client->>Server: Emits 'message' event
    Server->>Client: Broadcasts 'messageReturn' to others in Room
    Client->>User: Updates UI
```

## 3. Detailed Data Flow

### A. Connection & Setup
1.  **Server Start**: `server/index.ts` creates an HTTP server and a Socket.IO server on port **5000**.
2.  **Client Start**: `App.tsx` creates a socket connection to `http://localhost:5000` immediately when the app loads.
    *   Reference: `const socket = io('http://localhost:5000');`

### B. Joining a Room
The user starts on the `Room` component (`client/src/components/Room.tsx`).
1.  **User Action**: Enters a "Username" and "Room" name (e.g., "General") and clicks "CHAT!!!".
2.  **Client Event**: 
    *   Calls `socket.emit('room', room)`.
    *   Sends only the room name (string).
3.  **Server Handling** (`server/index.ts`):
    *   Listens for `socket.on('room', ...)`.
    *   Executes `socket.join(data)`.
    *   **Result**: This implementation isolates users. A user in room "General" will not receive messages sent to room "Sports".

### C. Sending & Receiving Messages
The user moves to the `Chat` component (`client/src/components/Chat.tsx`).

**Sending a Message:**
1.  **User Action**: Types a message and clicks "SEND".
2.  **Client Logic**:
    *   Creates a `messageContent` object:
        ```typescript
        {
          username: "Ali",
          message: "Hello World",
          room: "General",
          date: "14:30"
        }
        ```
    *   **Optimistic Update**: Adds the message directly to its own `messageList` state (so the sender sees it instantly).
    *   **Emit**: Sends `socket.emit("message", messageContent)`.

**Receiving a Message:**
1.  **Server Handling**:
    *   Listens for `socket.on('message', ...)`.
    *   **Broadcast**: Executes `socket.to(data.room).emit('messageReturn', data)`.
    *   **Note**: `socket.to(...)` sends to *everyone in the room EXCEPT the sender*. This is why the client needed the optimistic update step above.
2.  **Client Listening**:
    *   `useEffect` hook listens for `socket.on('messageReturn', ...)`.
    *   When data arrives, it updates `messageList`, causing React to re-render and show the new message.

## 4. Key Files

| File | Purpose |
|Data|Description|
|---|---|
| `server/index.ts` | The "Brain". Handles connections, joining groups, and routing messages. |
| `client/src/App.tsx` | The "Manager". Holds the global connection state and decides whether to show Login or Chat screens. |
| `client/src/components/Room.tsx` | The "Entrance". Captures user info and tells the server which room to put the socket in. |
| `client/src/components/Chat.tsx` | The "Interface". Handles the UI for listing messages and the logic for sending/receiving them. |

## 5. Deployment

### Railway + Neon Database

Bu proje Railway'e deploy edilebilir durumda. Detaylı deployment rehberi için:

📖 **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** dosyasına bakın.

**Kısa Özet**:
- ✅ Dockerfile hazır (multi-stage production build)
- ✅ Environment variables ayarlanmış (.env.example)
- ✅ Neon PostgreSQL database kullanılıyor
- ✅ Prisma migrations otomatik çalışıyor
- ✅ CORS production için yapılandırılmış

**Gerekli Environment Variables**:
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
JWT_SECRET=your-secret-min-32-chars
CLIENT_ORIGIN=https://your-frontend-url.com
```

## 6. Potential Next Steps
To take this project further as you requested, consider these improvements:
1.  **Database Storage**: Currently, messages are lost if you refresh. You can use Prisma to save messages to the database in the `socket.on('message')` block.
2.  **User List**: Add a sidebar showing who is currently in the room.
3.  **Typing Indicator**: Emit a `typing` event when a user is typing so others see "Ali is typing...".
