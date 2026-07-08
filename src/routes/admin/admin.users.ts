import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { z } from 'zod'

const router = Router()

const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'INNOVATOR', 'STUDENT', 'PARTNER', 'FUNDER']),
})

// ── POST / ─────────────────────────────────────────────
router.post(
  '/',
  validate(adminCreateUserSchema),
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, role } = req.body

      // Create user in Supabase Auth via Admin client
      const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { firstName, lastName, role },
      })

      if (error) throw error

      // Sync user profile into public users table
      const { data: profile, error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role: role.toUpperCase(),
          is_verified: true,
          is_active: true,
        })
        .select()
        .single()

      if (dbError) throw dbError

      res.status(201).json({
        message: 'User account created successfully',
        user: profile
      })
    } catch (err) {
      next(err)
    }
  }
)

export default router
