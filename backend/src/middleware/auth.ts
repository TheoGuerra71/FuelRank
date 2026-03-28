/**
 * Autenticação JWT via header `Authorization: Bearer <token>`.
 *
 * Fluxo:
 * 1) O front guarda o token no localStorage após o login.
 * 2) O Axios injeta o header em todas as requisições.
 * 3) Aqui validamos a assinatura e propagamos `req.auth` para as rotas.
 */

import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthTokenPayload } from '../types/express.js';

function readSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET ausente ou fraco. Defina em backend/.env (mín. 16 caracteres).');
  }
  return secret;
}

/**
 * Middleware estrito: exige Bearer válido. Usado em rotas privadas (ex.: painel admin).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Faça login novamente. Token não enviado.' });
      return;
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, readSecret()) as AuthTokenPayload;
    if (!payload.sub) {
      res.status(401).json({ message: 'Token inválido.' });
      return;
    }
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Sessão expirada ou token inválido.' });
  }
}

/**
 * Middleware permissivo: popula `req.auth` se houver token; segue sem erro se não houver.
 * Útil para GET /auth/session descobrir se o usuário está logado sem retornar 401.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      req.auth = undefined;
      next();
      return;
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, readSecret()) as AuthTokenPayload;
    req.auth = payload.sub ? payload : undefined;
  } catch {
    req.auth = undefined;
  }
  next();
}

/**
 * Deve ser aplicado *depois* de `requireAuth`.
 * Só perfis com `isAdmin: true` no JWT podem acessar o módulo administrativo.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth?.sub) {
    res.status(401).json({ message: 'Não autenticado.' });
    return;
  }
  if (!req.auth.isAdmin) {
    res.status(403).json({ message: 'Acesso restrito a administradores.' });
    return;
  }
  next();
}
