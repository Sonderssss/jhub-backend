import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { signToken, signRefreshToken, blacklistToken } from '../middleware/auth.middleware.js'

export async function register(req: Request, res: Response, next: NextFunction) {
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
      id: authUser.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role: role.toUpperCase(),
      is_verified: true,
      is_active: true,
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

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body

    const { data, error } = await supabase.auth.signInWithPassword({
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

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body

    const { data, error } = await supabase.auth.signInWithPassword({
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

export async function refresh(req: Request, res: Response, next: NextFunction) {
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

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.token
    const exp = req.user?.exp
    if (token && exp) {
      await blacklistToken(token, exp)
    }

    await supabaseAdmin.auth.admin.signOut(req.user!.sub)
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
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
}
