/**
 * Lista os tenants ligados ao usuário logado.
 * O `TenantContext` do React chama GET /api/tenants — mantemos esta rota para o app não ficar vazio após o login.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

const router = Router();

router.get('/tenants', requireAuth, async (req, res) => {
  const userId = req.auth!.sub;
  const memberships = await prisma.tenantMembership.findMany({
    where: { userId },
    include: { tenant: true },
  });
  res.json({
    tenants: memberships.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      role: m.role as 'owner' | 'admin' | 'manager' | 'member',
    })),
  });
});

export default router;
