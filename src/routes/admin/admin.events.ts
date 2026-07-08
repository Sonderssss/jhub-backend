import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { supabaseAdmin } from '../../config/supabase.js'
import { NotFoundError } from '../../middleware/error.middleware.js'
import { updateEventSchema } from '../../schemas/events.schema.js'

const router = Router()

// ── PATCH /:id ─────────────────────────────────────────
router.patch(
  '/:id',
  validate(updateEventSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { title, description, type, status, isFeatured, startDate, endDate, location, isOnline, meetingUrl, maxCapacity, registrationUrl, registrationDeadline, coverImageUrl } = req.body

      const updates: any = {}
      if (title !== undefined) {
        updates.title = title
        const slugify = (await import('slugify')).default
        updates.slug = slugify(title, { lower: true, strict: true })
      }
      if (description !== undefined) updates.description = description
      if (type !== undefined) updates.type = type
      if (status !== undefined) updates.status = status
      if (isFeatured !== undefined) updates.is_featured = isFeatured
      if (startDate !== undefined) updates.start_date = startDate
      if (endDate !== undefined) updates.end_date = endDate
      if (location !== undefined) updates.location = location
      if (isOnline !== undefined) updates.is_online = isOnline
      if (meetingUrl !== undefined) updates.meeting_url = meetingUrl
      if (maxCapacity !== undefined) updates.max_capacity = maxCapacity
      if (registrationUrl !== undefined) updates.registration_url = registrationUrl
      if (registrationDeadline !== undefined) updates.registration_deadline = registrationDeadline
      if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl

      const { data, error } = await supabaseAdmin
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error || !data) throw new NotFoundError('Event')
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
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  }
)

export default router
