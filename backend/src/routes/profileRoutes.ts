/**
 * Perfil do motorista — leitura e atualização parcial dos dados exibidos na tela "Meu Perfil".
 * Montagem no servidor: app.use('/api/profile', profileRoutes) → GET / = /api/profile
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

const router = Router();

function serializeProfile(p: NonNullable<Awaited<ReturnType<typeof prisma.profile.findUnique>>>) {
  return {
    id: p.id,
    user_id: p.userId,
    display_name: p.display_name,
    phone: p.phone,
    cpf: p.cpf,
    influence_level: p.influence_level,
    points: p.points,
    total_refuels: p.totalRefuels,
    avatar_url: p.avatar_url,
    reviews_count: 0,
    price_updates: 0,
    total_spent: 0,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
    company_name: null as string | null,
    document_id: null as string | null,
  };
}

router.get('/', requireAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { userId: req.auth!.sub } });
  if (!profile) {
    res.status(404).json({ message: 'Perfil não encontrado.' });
    return;
  }
  res.json(serializeProfile(profile));
});

router.put('/', requireAuth, async (req, res) => {
  const body = z
    .object({
      display_name: z.string().min(1).optional(),
      phone: z.string().nullable().optional(),
      cpf: z.string().nullable().optional(),
      avatar_url: z.string().nullable().optional(),
    })
    .parse(req.body);

  const profile = await prisma.profile.update({
    where: { userId: req.auth!.sub },
    data: {
      ...(body.display_name !== undefined ? { display_name: body.display_name } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.cpf !== undefined ? { cpf: body.cpf } : {}),
      ...(body.avatar_url !== undefined ? { avatar_url: body.avatar_url } : {}),
    },
  });

  res.json(serializeProfile(profile));
});

export default router;
