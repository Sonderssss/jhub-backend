import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { NotFoundError } from '../../middleware/error.middleware.js'
import { updatePartnerSchema, createSponsorshipSchema, createPartnerProfileSchema, updateApplicationSchema } from '../../schemas/partners.schema.js'
import { redis, CacheKey } from '../../config/redis.js'

const router = Router()

// ── POST / ─────────────────────────────────────────────
router.post(
  '/',
  validate(createPartnerProfileSchema),
  async (req, res, next) => {
    try {
      const slugify = (await import('slugify')).default
      const slug = slugify(req.body.name, { lower: true, strict: true })

      const { name, type, logoUrl, website, description, isFeatured, isActive } = req.body

      const { data, error } = await supabaseAdmin
        .from('partners')
        .insert({
          id: crypto.randomUUID(),
          slug,
          name,
          type,
          logo_url: logoUrl,
          website,
          description,
          is_featured: isFeatured,
          is_active: isActive,
        })
        .select()
        .single()

      if (error) throw error

      if (redis) {
        await redis.del(CacheKey.partners())
      }

      res.status(201).json({ data })
    } catch (err) {
      next(err)
    }
  }
)

// ── GET /applications ──────────────────────────────────
router.get(
  '/applications',
  async (req, res, next) => {
    try {
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 12
      const offset = (page - 1) * limit
      const type = req.query.type

      let query = supabaseAdmin
        .from('applications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error, count } = await query
      if (error) throw error

      res.json({
        data,
        meta: { page, limit, total: count, totalPages: Math.ceil((count ?? 0) / limit) },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── GET /applications/:id ──────────────────────────────
router.get(
  '/applications/:id',
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { data, error } = await supabaseAdmin
        .from('applications')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) throw new NotFoundError('Application')
      res.json({ data })
    } catch (err) {
      next(err)
    }
  }
)

// ── PATCH /applications/:id ────────────────────────────
router.patch(
  '/applications/:id',
  validate(updateApplicationSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { status, reviewNotes } = req.body

      const { data, error } = await supabaseAdmin
        .from('applications')
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) throw new NotFoundError('Application')
      res.json({ data })
    } catch (err) {
      next(err)
    }
  }
)

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

      if (redis) {
        await redis.del(CacheKey.partners())
      }

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

      if (redis) {
        await redis.del(CacheKey.partners())
      }

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
