import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN } from '../config/env.js'
import { supabaseAdmin } from '../config/supabase.js'

export interface JWTPayload {
  sub: string        // user id
  email: string
  role: UserRole
  iat: number
  exp: number
}

export type UserRole = 'admin' | 'innovator' | 'student' | 'partner' | 'funder' | 'guest'

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

// ── Require valid JWT ──────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as JWTPayload
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ── Attach user if token present, but don't block ─────
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET as string) as JWTPayload
    } catch {
      // Token invalid — proceed as guest
    }
  }
  next()
}

// ── Role-based access control ──────────────────────────
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      })
    }
    next()
  }
}

// ── Helper ─────────────────────────────────────────────
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  // Also accept cookie for SSR requests from Next.js
  return req.cookies?.['jhub-token'] ?? null
}

// ── Token factory ──────────────────────────────────────
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: JWT_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
  })
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, REFRESH_TOKEN_SECRET as string, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
  })
}
