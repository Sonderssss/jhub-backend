import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { NotFoundError } from '../../middleware/error.middleware.js'
import { updatePartnerSchema, createSponsorshipSchema } from '../../schemas/partners.schema.js'

const router = Router()

// ── PATCH /:id ─────────────────────────────────────────
router.patch(
  '/:id',
  validate(updatePartnerSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { name, type, logoUrl, website, description, isFeatured, isActive } = req.body

      const updates: any = {}
      if (name !== undefined) {
        updates.name = name
        const slugify = (await import('slugify')).default
        updates.slug = slugify(name, { lower: true, strict: true })
      }
      if (type !== undefined) updates.type = type
      if (logoUrl !== undefined) updates.logo_url = logoUrl
      if (website !== undefined) updates.website = website
      if (description !== undefined) updates.description = description
      if (isFeatured !== undefined) updates.is_featured = isFeatured
      if (isActive !== undefined) updates.is_active = isActive

      const { data, error } = await supabaseAdmin
        .from('partners')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error || !data) throw new NotFoundError('Partner')
      res.json({ data })
    } catch (err) {
      next(err)
    }
  }
)

// ── DELETE /:id ────────────────────────────────────────
router.delete(
  '/:id',
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { error } = await supabaseAdmin
        .from('partners')
        .delete()
        .eq('id', id)

      if (error) throw error
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /:id/sponsorships ─────────────────────────────
router.post(
  '/:id/sponsorships',
  validate(createSponsorshipSchema),
  async (req, res, next) => {
    try {
      const { id: partnerId } = req.params
      const { innovationId, amount, currency, description, startDate, endDate } = req.body

      const { data, error } = await supabaseAdmin
        .from('sponsorships')
        .insert({
          id: crypto.randomUUID(),
          partner_id: partnerId,
          innovation_id: innovationId,
          amount,
          currency,
          description,
          start_date: startDate,
          end_date: endDate,
        })
        .select()
        .single()

      if (error) throw error
      res.status(201).json({ data })
    } catch (err) {
      next(err)
    }
  }
)

export default router
