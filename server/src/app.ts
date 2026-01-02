import express from 'express';
import { configureMiddlewares } from './middlewares/AppMiddleware.js';

const app = express();

configureMiddlewares(app);

export default app;
