import express from 'express';
import { configureMiddlewares } from './middlewares/AppMiddleware.js';
import authRoutes from './routes/auth.routes.js';
import roomRoutes from './routes/room.routes.js';
import roomPlanRoutes from './routes/roomPlan.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

configureMiddlewares(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/room-plans', roomPlanRoutes);
app.use('/api/users', userRoutes);

export default app;
