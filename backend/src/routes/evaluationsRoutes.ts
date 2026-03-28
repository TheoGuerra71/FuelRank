/**
 * Avaliações e denúncias enviadas pelo motorista.
 *
 * Separamos em duas rotas POST (em vez de um único multipart) para o Axios enviar JSON puro,
 * alinhado ao contrato da Fase 2. Quando o upload real for para S3, basta trocar `proofUrl`
 * por uma URL assinada gerada antes deste POST.
 */

import { FuelType } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

const router = Router();

router.post('/review', requireAuth, async (req, res) => {
  const userId = req.auth!.sub;
  const body = z
    .object({
      stationId: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().min(1),
      proofUrl: z.string().min(1),
    })
    .parse(req.body);

  const station = await prisma.station.findUnique({ where: { id: body.stationId } });
  if (!station) {
    res.status(404).json({ message: 'Posto não encontrado.' });
    return;
  }

  await prisma.$transaction([
    prisma.review.create({
      data: {
        stationId: body.stationId,
        userId,
        rating: body.rating,
        comment: body.comment,
        proofUrl: body.proofUrl,
        isVerified: false,
      },
    }),
    prisma.profile.update({
      where: { userId },
      data: {
        totalRefuels: { increment: 1 },
        points: { increment: 10 },
      },
    }),
    prisma.station.update({
      where: { id: body.stationId },
      data: { reviewCount: { increment: 1 } },
    }),
  ]);

  res.status(201).json({ ok: true });
});

router.post('/complaint', requireAuth, async (req, res) => {
  const userId = req.auth!.sub;
  const body = z
    .object({
      stationId: z.string().uuid(),
      fuelType: z.nativeEnum(FuelType).optional(),
      description: z.string().min(1),
      proofUrl: z.string().min(1),
      /** Formato típico do input type="date": YYYY-MM-DD (aceitamos também ISO completo). */
      refuelingDate: z.string().optional(),
    })
    .parse(req.body);

  const station = await prisma.station.findUnique({ where: { id: body.stationId } });
  if (!station) {
    res.status(404).json({ message: 'Posto não encontrado.' });
    return;
  }

  await prisma.$transaction([
    prisma.complaint.create({
      data: {
        stationId: body.stationId,
        userId,
        description: body.description,
        proofUrl: body.proofUrl,
        fuelType: body.fuelType,
        refuelingDate:
          body.refuelingDate && !Number.isNaN(Date.parse(body.refuelingDate)) ? new Date(body.refuelingDate) : null,
        status: 'pending',
      },
    }),
    prisma.station.update({
      where: { id: body.stationId },
      data: { complaintsCount: { increment: 1 } },
    }),
  ]);

  res.status(201).json({ ok: true });
});

export default router;
