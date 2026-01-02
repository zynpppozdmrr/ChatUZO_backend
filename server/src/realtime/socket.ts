import { Server, Socket } from 'socket.io';
import { MessageData } from '../types/chat.js';
import { socketAuthMiddleware } from './middlewares/auth.middleware.js';
import type { ClientToServerEvents, ServerToClientEvents } from "../types/socket.js";

export const setupSocketIO = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
    io.use(socketAuthMiddleware);

    io.on("connection", (socket: Socket) => {
        console.log(`User Connected: ${socket.id}`);

        socket.on('room', (data: string) => {
            socket.join(data);
            console.log(`User ${socket.id} joined room: ${data}`);
        });

        socket.on('message', (data: MessageData) => {
            socket.to(data.room).emit('messageReturn', data);
        });

        socket.on('disconnect', () => {
            console.log("User Disconnected", socket.id);
        });
    });
};
