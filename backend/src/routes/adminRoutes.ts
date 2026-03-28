/**
 * Rotas administrativas — contrato alinhado ao frontend (`src/lib/adminApi.ts`).
 *
 * Prefixo no servidor: app.use('/api/admin', adminRoutes)
 * Logo, esta rota GET '/' aqui vira GET /api/admin/overview no mundo exterior.
 *
 * Todas as respostas JSON usam chaves snake_case nos objetos aninhados que o React já espera
 * (ex.: `station_id`, `display_name`) para evitar refatorar dezenas de componentes legados.
 */

import {
  ComplaintStatus,
  FuelType,
  Prisma,
  SealStatus,
  StationApprovalStatus,
} from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

const router = Router();

// --- Middleware em cadeia: JWT obrigatório + flag isAdmin -------------------------------
router.use(requireAuth, requireAdmin);

const FuelTypeSchema = z.nativeEnum(FuelType);
const ComplaintStatusSchema = z.nativeEnum(ComplaintStatus);
const SealSchema = z.nativeEnum(SealStatus);

/** Converte Decimal do Prisma para número JSON seguro. */
function dec(n: Prisma.Decimal): number {
  return Number(n);
}

function serializeStation(s: {
  id: string;
  tenantId: string | null;
  name: string;
  brand: string;
  address: string;
  lat: number;
  lng: number;
  seal: SealStatus;
  approvalStatus: StationApprovalStatus;
  rating: number;
  reviewCount: number;
  complaintsCount: number;
}) {
  return {
    id: s.id,
    tenant_id: s.tenantId,
    name: s.name,
    brand: s.brand,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    seal: s.seal,
    approval_status: s.approvalStatus,
    rating: s.rating,
    review_count: s.reviewCount,
    complaints_count: s.complaintsCount,
  };
}

function serializeProfile(p: {
  id: string;
  userId: string;
  display_name: string;
  phone: string | null;
  cpf: string | null;
  influence_level: string;
  points: number;
  avatar_url: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    user_id: p.userId,
    display_name: p.display_name,
    phone: p.phone,
    cpf: p.cpf,
    influence_level: p.influence_level,
    points: p.points,
    avatar_url: p.avatar_url,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

function serializeComplaint(c: {
  id: string;
  stationId: string;
  userId: string | null;
  description: string;
  status: ComplaintStatus;
  proofUrl: string;
  fuelType: FuelType | null;
  refuelingDate: Date | null;
  videoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  station: { name: string };
  user: { profile: { display_name: string } | null } | null;
}) {
  return {
    id: c.id,
    station_id: c.stationId,
    reported_by: c.userId ?? '',
    user_id: c.userId,
    description: c.description,
    status: c.status,
    proof_url: c.proofUrl,
    fuel_type: c.fuelType,
    refueling_date: c.refuelingDate?.toISOString() ?? null,
    video_url: c.videoUrl,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
    stations: { name: c.station.name },
    profiles: c.user?.profile ? { display_name: c.user.profile.display_name } : null,
  };
}

function serializeReview(r: {
  id: string;
  stationId: string;
  userId: string;
  comment: string | null;
  rating: number;
  proofUrl: string;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: Date;
  station: { id: string; name: string };
  user: { profile: { display_name: string } | null };
}) {
  return {
    id: r.id,
    station_id: r.stationId,
    user_id: r.userId,
    comment: r.comment,
    rating: r.rating,
    proof_url: r.proofUrl,
    is_verified: r.isVerified,
    helpful_count: r.helpfulCount,
    created_at: r.createdAt.toISOString(),
    stations: { id: r.station.id, name: r.station.name },
    profiles: r.user.profile ? { display_name: r.user.profile.display_name } : null,
  };
}

/**
 * GET /api/admin/overview?tenantId=<uuid>
 *
 * Por que exigimos tenantId?
 * - O FuelRank é multi-região / multi-rede; o admin só enxerga dados da rede selecionada no app,
 *   evitando vazamento acidental de dados entre tenants.
 */
router.get('/overview', async (req, res) => {
  const parsed = z.object({ tenantId: z.string().uuid() }).safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: 'Parâmetro tenantId (UUID) é obrigatório.' });
    return;
  }
  const { tenantId } = parsed.data;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    res.status(404).json({ message: 'Tenant não encontrado.' });
    return;
  }

  // Postos aprovados: listagem operacional (mapa, busca).
  const approvedStations = await prisma.station.findMany({
    where: { tenantId, approvalStatus: StationApprovalStatus.approved },
    orderBy: { name: 'asc' },
  });

  // Fila de moderação de cadastro.
  const pendingStations = await prisma.station.findMany({
    where: { tenantId, approvalStatus: StationApprovalStatus.pending },
    orderBy: { createdAt: 'desc' },
  });

  // Membros do tenant — mostramos o perfil para o admin identificar quem colabora.
  const memberships = await prisma.tenantMembership.findMany({
    where: { tenantId },
    include: { user: { include: { profile: true } } },
  });
  const users = memberships
    .map((m) => m.user.profile)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(serializeProfile);

  // Denúncias ligadas a postos desse tenant.
  const complaints = await prisma.complaint.findMany({
    where: { station: { tenantId } },
    include: {
      station: { select: { name: true } },
      user: { include: { profile: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Avaliações ainda não verificadas (fila de moderação de comentário).
  const pendingReviewsRaw = await prisma.review.findMany({
    where: {
      isVerified: false,
      station: { tenantId },
    },
    include: {
      station: { select: { id: true, name: true } },
      user: { include: { profile: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const referenceRows = await prisma.tenantReferenceFuelPrice.findMany({ where: { tenantId } });
  const referencePrices: Partial<Record<FuelType, number>> = {};
  for (const row of referenceRows) {
    referencePrices[row.fuelType] = dec(row.price);
  }

  res.json({
    stations: approvedStations.map(serializeStation),
    pendingStations: pendingStations.map(serializeStation),
    pendingReviews: pendingReviewsRaw.map(serializeReview),
    reports: complaints.map(serializeComplaint),
    users,
    referencePrices,
  });
});

/**
 * PATCH /api/admin/stations/:id/approval
 * Aceita `{ status: 'approved' | 'rejected' }` conforme contrato do React.
 */
router.patch('/stations/:id/approval', async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const body = z
    .object({
      status: z.enum(['approved', 'rejected']),
    })
    .parse(req.body);

  const nextStatus =
    body.status === 'approved' ? StationApprovalStatus.approved : StationApprovalStatus.rejected;

  const updated = await prisma.station.updateMany({
    where: { id },
    data: { approvalStatus: nextStatus },
  });
  if (updated.count === 0) {
    res.status(404).json({ message: 'Posto não encontrado.' });
    return;
  }
  res.status(204).send();
});

/**
 * PATCH /api/admin/stations/:id/prices
 * Atualização em transação: cada combustível recebe upsert na tabela `FuelPrice`.
 *
 * Por que transação?
 * - Ou todos os preços da requisição são gravados, ou nenhum — evita mapa com metade dos combustíveis desatualizada.
 */
router.patch('/stations/:id/prices', async (req, res) => {
  const stationId = z.string().uuid().parse(req.params.id);
  const body = z
    .object({
      items: z.array(
        z.object({
          fuel_type: FuelTypeSchema,
          price: z.number().positive(),
        }),
      ),
    })
    .parse(req.body);

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) {
    res.status(404).json({ message: 'Posto não encontrado.' });
    return;
  }

  await prisma.$transaction(
    body.items.map((item) =>
      prisma.fuelPrice.upsert({
        where: {
          stationId_fuelType: { stationId, fuelType: item.fuel_type },
        },
        create: {
          stationId,
          fuelType: item.fuel_type,
          price: new Prisma.Decimal(item.price),
        },
        update: {
          price: new Prisma.Decimal(item.price),
        },
      }),
    ),
  );

  res.status(204).send();
});

/**
 * PATCH /api/admin/reviews/:id
 * `is_verified: true` publica a avaliação como moderada; `false` mantém na fila ou pode ser usado para desfazer.
 */
router.patch('/reviews/:id', async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const body = z.object({ is_verified: z.boolean() }).parse(req.body);

  const updated = await prisma.review.updateMany({
    where: { id },
    data: { isVerified: body.is_verified },
  });
  if (updated.count === 0) {
    res.status(404).json({ message: 'Avaliação não encontrada.' });
    return;
  }
  res.status(204).send();
});

/**
 * PATCH /api/admin/complaints/:id
 * Status no vocabulário da missão: pending | in_analysis | resolved | archived.
 */
router.patch('/complaints/:id', async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const body = z.object({ status: ComplaintStatusSchema }).parse(req.body);

  const updated = await prisma.complaint.updateMany({
    where: { id },
    data: { status: body.status },
  });
  if (updated.count === 0) {
    res.status(404).json({ message: 'Denúncia não encontrada.' });
    return;
  }
  res.status(204).send();
});

/**
 * PUT /api/admin/reference-fuel-prices
 * Corpo: { tenantId, prices: [{ fuel_type, price }, ...] }
 *
 * Por que array em vez de mapa?
 * - O contrato da missão pediu lista explícita — facilita validar com Zod item a item e logar auditoria no futuro.
 */
router.put('/reference-fuel-prices', async (req, res) => {
  const body = z
    .object({
      tenantId: z.string().uuid(),
      prices: z.array(
        z.object({
          fuel_type: FuelTypeSchema,
          price: z.number().positive(),
        }),
      ),
    })
    .parse(req.body);

  const tenant = await prisma.tenant.findUnique({ where: { id: body.tenantId } });
  if (!tenant) {
    res.status(404).json({ message: 'Tenant não encontrado.' });
    return;
  }

  await prisma.$transaction(
    body.prices.map((row) =>
      prisma.tenantReferenceFuelPrice.upsert({
        where: {
          tenantId_fuelType: { tenantId: body.tenantId, fuelType: row.fuel_type },
        },
        create: {
          tenantId: body.tenantId,
          fuelType: row.fuel_type,
          price: new Prisma.Decimal(row.price),
        },
        update: {
          price: new Prisma.Decimal(row.price),
        },
      }),
    ),
  );

  res.status(204).send();
});

/**
 * PATCH /api/admin/stations/:id/seal
 * Extra usado pelo painel para marcar confiável / observação / reclamações.
 */
router.patch('/stations/:id/seal', async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const body = z.object({ seal: SealSchema }).parse(req.body);

  const updated = await prisma.station.updateMany({
    where: { id },
    data: { seal: body.seal },
  });
  if (updated.count === 0) {
    res.status(404).json({ message: 'Posto não encontrado.' });
    return;
  }
  res.status(204).send();
});

export default router;
