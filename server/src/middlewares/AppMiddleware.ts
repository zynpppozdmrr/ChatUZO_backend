import express, { Express } from 'express';
import cors from 'cors';
import { env } from '../config/env.js';

export const configureMiddlewares = (app: Express) => {
    app.use(cors({
        origin: "*",
        credentials: true
    }));
    app.use(express.json());
};
