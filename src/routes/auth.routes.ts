import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { validate } from '../middleware/validate.middleware.js'
import { authLimiter } from '../middleware/rateLimiter.middleware.js'
import { requireAuth, signToken, signRefreshToken } from '../middleware/auth.middleware.js'
import { supabaseAdmin } from '../config/supabase.js'
import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth.schema.js'

const router = Router()

// ── POST /auth/register ────────────────────────────────
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, role } = req.body

      // Create user in Supabase Auth
      const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { firstName, lastName, role },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          return res.status(409).json({ error: 'Email already registered' })
        }
        throw error
      }

      // Sync user profile into public users table
      const { error: dbError } = await supabaseAdmin.from('users').insert({
        id:          authUser.user.id,
        email,
        first_name:  firstName,
        last_name:   lastName,
        role:        role.toUpperCase(),
        is_verified: true,
        is_active:   true,
      })
      if (dbError) throw dbError

      const token = signToken({
        sub: authUser.user.id,
        email,
        role: role.toLowerCase() as any,
      })
      const refreshToken = signRefreshToken(authUser.user.id)

      res.status(201).json({
        message: 'Account created. Please verify your email.',
        token,
        refreshToken,
        user: {
          id: authUser.user.id,
          email,
          firstName,
          lastName,
          role,
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /auth/login ───────────────────────────────────
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      const role = data.user.user_metadata?.role ?? 'guest'

      const token = signToken({
        sub: data.user.id,
        email: data.user.email!,
        role,
      })
      const refreshToken = signRefreshToken(data.user.id)

      res.json({
        token,
        refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          role,
          ...data.user.user_metadata,
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /auth/admin/login ────────────────────────────
router.post(
  '/admin/login',
  authLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      const role = data.user.user_metadata?.role ?? 'guest'
      if (role.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Administrator privileges required' })
      }

      const token = signToken({
        sub: data.user.id,
        email: data.user.email!,
        role: 'admin',
      })
      const refreshToken = signRefreshToken(data.user.id)

      res.json({
        token,
        refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: 'admin',
          ...data.user.user_metadata,
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /auth/refresh ─────────────────────────────────
router.post(
  '/refresh',
  authLimiter,
  validate(refreshSchema),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body
      const jwt = await import('jsonwebtoken')
      const { REFRESH_TOKEN_SECRET } = await import('../config/env.js')

      const payload = jwt.default.verify(refreshToken, REFRESH_TOKEN_SECRET as string) as { sub: string }

      const { data: user } = await supabaseAdmin.auth.admin.getUserById(payload.sub)
      if (!user.user) {
        return res.status(401).json({ error: 'User not found' })
      }

      const newToken = signToken({
        sub: user.user.id,
        email: user.user.email!,
        role: user.user.user_metadata?.role ?? 'guest',
      })

      res.json({ token: newToken })
    } catch {
      res.status(401).json({ error: 'Invalid refresh token' })
    }
  }
)

// ── POST /auth/logout ──────────────────────────────────
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await supabaseAdmin.auth.admin.signOut(req.user!.sub)
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
})

// ── GET /auth/me ───────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(req.user!.sub)
    if (!user.user) return res.status(404).json({ error: 'User not found' })

    res.json({
      id: user.user.id,
      email: user.user.email,
      role: user.user.user_metadata?.role,
      isVerified: user.user.email_confirmed_at != null,
      ...user.user.user_metadata,
    })
  } catch (err) {
    next(err)
  }
})

export default router
