import express from 'express';
import { configureMiddlewares } from './middlewares/AppMiddleware.js';
import authRoutes from './routes/auth.routes.js';
import roomRoutes from './routes/room.routes.js';
import roomPlanRoutes from './routes/roomPlan.routes.js';
import userRoutes from './routes/user.routes.js';
import { prisma } from './config/prisma.js';

const app = express();

configureMiddlewares(app);

app.get('/healthz', (_req, res) => {
	res.status(200).json({ status: 'ok' });
});

app.get('/readyz', async (_req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.status(200).json({ status: 'ready' });
	} catch {
		res.status(503).json({ status: 'not-ready' });
	}
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/room-plans', roomPlanRoutes);
app.use('/api/users', userRoutes);

export default app;
