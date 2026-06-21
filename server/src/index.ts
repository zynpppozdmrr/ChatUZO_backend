import http from 'http';
import { Server } from 'socket.io';
import type { DefaultEventsMap } from 'socket.io';
import app from './app.js';
import { setupSocketIO } from './realtime/socket.js';
import { env } from './config/env.js';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types/Realtime/socket.js';

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>(server, {
    cors: {
        origin: env.CLIENT_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true
    }
});

setupSocketIO(io);

server.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
});
