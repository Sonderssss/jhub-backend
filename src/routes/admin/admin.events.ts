import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { updateEventSchema, createEventSchema, listQuerySchema } from '../../schemas/events.schema.js'
import { getAdminEvents, getAdminEventById, createAdminEvent, updateAdminEvent, deleteAdminEvent } from '../../controllers/admin/events.controller.js'

const router = Router()

// ── GET / ──────────────────────────────────────────────
router.get('/', validate(listQuerySchema, 'query'), getAdminEvents)

// ── GET /:id ───────────────────────────────────────────
router.get('/:id', getAdminEventById)

// ── POST / ─────────────────────────────────────────────
router.post('/', validate(createEventSchema), createAdminEvent)

// ── PATCH /:id ─────────────────────────────────────────
router.patch('/:id', validate(updateEventSchema), updateAdminEvent)

// ── DELETE /:id ────────────────────────────────────────
router.delete('/:id', deleteAdminEvent)

export default router
