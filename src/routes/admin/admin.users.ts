import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { z } from 'zod'
import { createAdminUser } from '../../controllers/admin/users.controller.js'

const router = Router()

const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'INNOVATOR', 'STUDENT', 'PARTNER', 'FUNDER']),
})

// ── POST / ─────────────────────────────────────────────
router.post('/', validate(adminCreateUserSchema), createAdminUser)

export default router
