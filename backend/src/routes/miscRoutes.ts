/**
 * Rotas complementares consumidas pelo app (ranking público, histórico de abastecimentos).
 * O histórico (`refuels`) ainda não tem tabela dedicada no Prisma — devolvemos array vazio até a Fase 3.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

const router = Router();

router.get('/ranking', async (req, res) => {
  const mode = req.query.mode === 'fraudes' ? 'fraudes' : 'pontos';

  /**
   * Aba "fraudes": ordenamos por `totalRefuels` como proxy de engajamento em denúncias/registros.
   * Quando houver contagem real de denúncias aprovadas por usuário, troque o `orderBy`.
   */
  const profiles = await prisma.profile.findMany({
    take: 50,
    orderBy: mode === 'fraudes' ? { totalRefuels: 'desc' } : { points: 'desc' },
    select: {
      id: true,
      display_name: true,
      points: true,
      influence_level: true,
      totalRefuels: true,
    },
  });

  res.json(
    profiles.map((p) => ({
      id: p.id,
      display_name: p.display_name,
      points: p.points,
      influence_level: p.influence_level,
      total_refuels: p.totalRefuels,
    })),
  );
});

router.get('/refuels', requireAuth, (_req, res) => {
  res.json([]);
});

export default router;
