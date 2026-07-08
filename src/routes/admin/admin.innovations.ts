import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { NotFoundError } from '../../middleware/error.middleware.js'
import { updateInnovationStatusSchema } from '../../schemas/innovations.schema.js'

const router = Router()

// ── PATCH /:id/status ──────────────────────────────────
router.patch(
  '/:id/status',
  validate(updateInnovationStatusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { status } = req.body

      const { data, error } = await supabaseAdmin
        .from('innovations')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) throw new NotFoundError('Innovation')
      res.json({ data })
    } catch (err) {
      next(err)
    }
  }
)

// ── PATCH /:id/feature ─────────────────────────────────
router.patch(
  '/:id/feature',
  async (req, res, next) => {
    try {
      const { id } = req.params
      const is_featured = req.body.isFeatured !== undefined ? req.body.isFeatured : true

      const { data, error } = await supabaseAdmin
        .from('innovations')
        .update({ is_featured })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) throw new NotFoundError('Innovation')
      res.json({ data })
    } catch (err) {
      next(err)
    }
  }
)

export default router
