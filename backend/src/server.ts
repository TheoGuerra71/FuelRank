/**
 * Ponto de entrada HTTP do FuelRank (Express).
 *
 * Ordem dos middlewares importa:
 * 1) CORS + JSON parser
 * 2) Rotas mais específicas (`/api/stations`, `/api/evaluations`, …) **antes** de montagens largas em `/api`
 * 3) Handler 404 só no final da cadeia `/api`
 */

import cors from 'cors';
import express from 'express';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import evaluationsRoutes from './routes/evaluationsRoutes.js';
import miscRoutes from './routes/miscRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import stationsRoutes from './routes/stationsRoutes.js';
import tenantsRoutes from './routes/tenantsRoutes.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN ? true : process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', miscRoutes);
app.use('/api', tenantsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'fuelrank-api' });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Erro interno no servidor.';
  res.status(500).json({ message });
});

app.listen(PORT, () => {
  console.log(`[fuelrank-api] ouvindo em http://localhost:${PORT}`);
  console.log(`[fuelrank-api] health: http://localhost:${PORT}/api/health`);
});
