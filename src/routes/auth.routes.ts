import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { authLimiter } from '../middleware/rateLimiter.middleware.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth.schema.js'
import { register, login, adminLogin, refresh, logout, getMe } from '../controllers/auth.controller.js'

const router = Router()

// ── POST /auth/register ────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), register)

// ── POST /auth/login ───────────────────────────────────
router.post('/login', authLimiter, validate(loginSchema), login)

// ── POST /auth/admin/login ────────────────────────────
router.post('/admin/login', authLimiter, validate(loginSchema), adminLogin)

// ── POST /auth/refresh ─────────────────────────────────
router.post('/refresh', authLimiter, validate(refreshSchema), refresh)

// ── POST /auth/logout ──────────────────────────────────
router.post('/admin/logout', requireAuth, logout)

// ── GET /auth/me ───────────────────────────────────────
router.get('/me', requireAuth, getMe)

export default router
