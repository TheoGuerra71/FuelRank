/**
 * Seed opcional — popula um admin, um tenant e postos de exemplo.
 *
 * Rode a partir da pasta `backend`:
 *   npx prisma db push
 *   npm run db:seed
 */

import { PrismaClient, StationApprovalStatus, FuelType, SealStatus, Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fuelrank.local' },
    update: { passwordHash, isAdmin: true, role: UserRole.ADMIN },
    create: {
      email: 'admin@fuelrank.local',
      passwordHash,
      isAdmin: true,
      role: UserRole.ADMIN,
    },
  });

  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      display_name: 'Administrador FuelRank',
      phone: '11999990000',
      influence_level: 'Administrador',
      points: 0,
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-regiao' },
    update: {},
    create: {
      name: 'Região demonstração',
      slug: 'demo-regiao',
    },
  });

  await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: admin.id } },
    update: { role: 'owner' },
    create: {
      tenantId: tenant.id,
      userId: admin.id,
      role: 'owner',
    },
  });

  const stationApproved = await prisma.station.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      tenantId: tenant.id,
      name: 'Posto Exemplo Aprovado',
      brand: 'Demo',
      address: 'Av. Paulista, 1000 — São Paulo',
      lat: -23.5617,
      lng: -46.656,
      seal: SealStatus.trusted,
      approvalStatus: StationApprovalStatus.approved,
      rating: 4.5,
      reviewCount: 12,
      complaintsCount: 0,
    },
  });

  await prisma.station.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      tenantId: tenant.id,
      name: 'Posto Aguardando Moderação',
      brand: 'Novo',
      address: 'Rua Exemplo, 50',
      lat: -23.55,
      lng: -46.64,
      seal: SealStatus.observation,
      approvalStatus: StationApprovalStatus.pending,
      rating: 0,
      reviewCount: 0,
      complaintsCount: 0,
    },
  });

  for (const [fuelType, price] of [
    [FuelType.gasolina_comum, 5.89] as const,
    [FuelType.etanol, 3.99] as const,
  ]) {
    await prisma.fuelPrice.upsert({
      where: {
        stationId_fuelType: { stationId: stationApproved.id, fuelType },
      },
      update: { price: new Prisma.Decimal(price) },
      create: {
        stationId: stationApproved.id,
        fuelType,
        price: new Prisma.Decimal(price),
      },
    });
  }

  await prisma.tenantReferenceFuelPrice.upsert({
    where: {
      tenantId_fuelType: { tenantId: tenant.id, fuelType: FuelType.gasolina_comum },
    },
    update: { price: new Prisma.Decimal(5.95) },
    create: {
      tenantId: tenant.id,
      fuelType: FuelType.gasolina_comum,
      price: new Prisma.Decimal(5.95),
    },
  });

  console.log('Seed OK. Login admin: admin@fuelrank.local / Admin123!');
  console.log(`Tenant ID (use no painel): ${tenant.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
