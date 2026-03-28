/**
 * Autenticação mínima para o FuelRank local / MVP.
 *
 * O front espera:
 * - POST /api/auth/login → { accessToken, session, isAdmin }
 * - GET  /api/auth/session → { accessToken?, session, isAdmin } (token ecoado se o header vier)
 * - POST /api/auth/logout → 204 (o front limpa localStorage; aqui é no-op idempotente)
 *
 * Em produção você pode trocar JWT por cookies HttpOnly + refresh tokens — o contrato HTTP pode permanecer parecido.
 */

import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { optionalAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import type { AuthTokenPayload } from '../types/express.js';

const router = Router();

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error('Configure JWT_SECRET no .env (mínimo 16 caracteres).');
  }
  return s;
}

function signToken(userId: string, isAdmin: boolean): string {
  const payload: AuthTokenPayload = { sub: userId, isAdmin };
  return jwt.sign(payload, jwtSecret(), { expiresIn: '7d' });
}

/**
 * Cadastro de motorista (DRIVER).
 * Aceita o contrato mínimo `{ name, email, password }` e também campos extras do formulário legado do front.
 */
router.post('/register', async (req, res) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1).optional(),
        displayName: z.string().min(1).optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        documentId: z.string().optional(),
        companyName: z.string().optional(),
        tenantSlug: z.string().min(1).optional(),
      })
      .parse(req.body);

    const displayName = body.name ?? body.displayName;
    if (!displayName?.trim()) {
      res.status(400).json({ message: 'Informe seu nome.' });
      return;
    }

    const email = body.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          isAdmin: false,
          role: UserRole.DRIVER,
          profile: {
            create: {
              display_name: displayName.trim(),
              phone: body.phone?.trim() || null,
              cpf: body.cpf?.trim() || null,
            },
          },
        },
      });

      if (body.tenantSlug?.trim()) {
        const slug = body.tenantSlug.trim().toLowerCase().replace(/\s+/g, '-');
        const tenantName = body.companyName?.trim() || `Rede ${slug}`;
        const tenant = await tx.tenant.upsert({
          where: { slug },
          update: {},
          create: { name: tenantName, slug },
        });
        await tx.tenantMembership.upsert({
          where: { tenantId_userId: { tenantId: tenant.id, userId: created.id } },
          update: { role: 'owner' },
          create: { tenantId: tenant.id, userId: created.id, role: 'owner' },
        });
      }

      return created;
    });

    const accessToken = signToken(user.id, user.isAdmin);
    res.status(201).json({
      accessToken,
      isAdmin: user.isAdmin,
      session: { user: { id: user.id, email: user.email } },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ message: 'Dados inválidos.', issues: e.errors });
      return;
    }
    throw e;
  }
});

/** Placeholders até integrar provedor de e-mail — evitam 404 no front. */
router.post('/forgot-password', (_req, res) => {
  res.json({ message: 'Se existir uma conta com este e-mail, enviaremos instruções em breve.' });
});

router.post('/reset-password', (_req, res) => {
  res.status(501).json({ message: 'Redefinição de senha por e-mail ainda não está configurada no servidor.' });
});

router.post('/resend-verification', (_req, res) => {
  res.json({ message: 'Verificação de e-mail não é obrigatória neste ambiente local.' });
});

router.post('/login', async (req, res) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user) {
      res.status(401).json({ message: 'E-mail ou senha incorretos.' });
      return;
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ message: 'E-mail ou senha incorretos.' });
      return;
    }
    const accessToken = signToken(user.id, user.isAdmin);
    res.json({
      accessToken,
      isAdmin: user.isAdmin,
      session: {
        user: { id: user.id, email: user.email },
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ message: 'Dados inválidos.', issues: e.errors });
      return;
    }
    throw e;
  }
});

router.get('/session', optionalAuth, async (req, res) => {
  try {
    if (!req.auth?.sub) {
      res.json({ session: null, isAdmin: false, accessToken: null });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
    if (!user) {
      res.json({ session: null, isAdmin: false, accessToken: null });
      return;
    }
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    res.json({
      session: {
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: null,
        },
      },
      isAdmin: user.isAdmin,
      accessToken: bearer,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erro ao validar sessão.' });
  }
});

router.post('/logout', (_req, res) => {
  /** Logout stateless: o cliente apaga o token; mantemos 204 para o Axios não falhar. */
  res.status(204).send();
});

export default router;
