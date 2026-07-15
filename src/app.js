import express from 'express';
import prisma , { connectPrisma } from './config/prisma.js';
import authRoutes from './module/auth/auth.routes.js';

const app = express();
app.use(express.json());

app.get('/health/db', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

connectPrisma();


app.use('/api/auth', authRoutes);


export default app;