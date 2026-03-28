import type { JwtPayload } from 'jsonwebtoken';

/**
 * Payload mínimo do JWT emitido pelo /api/auth/login.
 * Mantemos `sub` (padrão JWT) como ID do usuário no banco.
 */
export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  isAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      /** Preenchido pelos middlewares de auth quando o Bearer é válido. */
      auth?: AuthTokenPayload;
    }
  }
}

export {};
