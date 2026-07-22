import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { updateInnovationStatusSchema } from '../../schemas/innovations.schema.js'
import { updateSubmissionStatus, toggleFeatured } from '../../controllers/admin/innovations.controller.js'

const router = Router()

// ── PATCH /:id/status ──────────────────────────────────
router.patch('/:id/status', validate(updateInnovationStatusSchema), updateSubmissionStatus)

// ── PATCH /:id/feature ─────────────────────────────────
router.patch('/:id/feature', toggleFeatured)

export default router
