import express, { Express } from 'express';
import cors from 'cors';
import { env } from '../config/env.js';

export const configureMiddlewares = (app: Express) => {
    app.use(cors({
        origin: env.CLIENT_ORIGIN,
        credentials: true
    }));
    app.use(express.json());
};
