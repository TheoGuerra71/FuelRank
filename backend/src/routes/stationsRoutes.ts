/**
 * Postos — rotas públicas (listagem + detalhe) e criação autenticada (cadastro pelo app).
 *
 * Por que `approvalStatus: approved` na listagem?
 * - Evitamos exibir na Home postos ainda não moderados; o motorista só vê o que passou pela triagem.
 * - O detalhe por ID (`GET /:id`) ainda retorna qualquer posto (ex.: link direto após cadastro).
 */

import { FuelType, Prisma, StationApprovalStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { fuelPriceToRow, stationListItem } from '../lib/serialize.js';

const router = Router();

const PriceItem = z.object({
  fuel_type: z.nativeEnum(FuelType),
  price: z.number().positive(),
});

router.get('/', async (req, res) => {
  const tenantId = typeof req.query.tenantId === 'string' && z.string().uuid().safeParse(req.query.tenantId).success ? req.query.tenantId : undefined;

  const stations = await prisma.station.findMany({
    where: {
      approvalStatus: StationApprovalStatus.approved,
      ...(tenantId ? { tenantId } : {}),
    },
    include: { fuelPrices: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(stations.map(stationListItem));
});

router.post('/', requireAuth, async (req, res) => {
  const userId = req.auth!.sub;
  const body = z
    .object({
      tenant_id: z.string().uuid(),
      name: z.string().min(1),
      brand: z.string().min(1),
      address: z.string().min(1),
      lat: z.number(),
      lng: z.number(),
      has_promotion: z.boolean().optional(),
      promotion_text: z.string().nullable().optional(),
      prices: z.array(PriceItem).min(1),
    })
    .parse(req.body);

  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId: body.tenant_id, userId },
  });
  if (!membership) {
    res.status(403).json({ message: 'Você não tem permissão para cadastrar postos neste workspace.' });
    return;
  }

  const station = await prisma.station.create({
    data: {
      tenantId: body.tenant_id,
      name: body.name,
      brand: body.brand,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      hasPromotion: body.has_promotion ?? false,
      promotionText: body.promotion_text ?? null,
      approvalStatus: StationApprovalStatus.pending,
      createdBy: userId,
      fuelPrices: {
        create: body.prices.map((p) => ({
          fuelType: p.fuel_type,
          price: new Prisma.Decimal(p.price),
        })),
      },
    },
  });

  res.status(201).json({ id: station.id });
});

router.get('/:id', async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const station = await prisma.station.findUnique({
    where: { id },
    include: {
      fuelPrices: true,
      complaints: {
        where: { status: 'approved' },
        select: { id: true, description: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!station) {
    res.status(404).json({ message: 'Posto não encontrado.' });
    return;
  }

  res.json({
    station: {
      id: station.id,
      name: station.name,
      address: station.address,
      brand: station.brand,
      rating: station.rating,
      review_count: station.reviewCount,
      seal: station.seal,
      complaints_count: station.complaintsCount,
    },
    prices: station.fuelPrices.map(fuelPriceToRow),
    complaints: station.complaints.map((c) => ({ id: c.id, description: c.description })),
  });
});

export default router;
