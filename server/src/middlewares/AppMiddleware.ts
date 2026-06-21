import express, { Express } from 'express';
import cors from 'cors';
import { env } from '../config/env.js';

export const configureMiddlewares = (app: Express) => {
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || env.CLIENT_ORIGINS.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Origin is not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json());
};
