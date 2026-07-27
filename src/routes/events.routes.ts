import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { optionalAuth } from '../middleware/auth.middleware.js'
import { formLimiter } from '../middleware/rateLimiter.middleware.js'
import { listQuerySchema, rsvpSchema, eventProposalSchema } from '../schemas/events.schema.js'
import { getEvents, getUpcomingEvents, getCalendarEvents, getPastEvents, getEventBySlug, rsvp, proposeEvent } from '../controllers/events.controller.js'

const router = Router()

// ── GET /events ────────────────────────────────────────
router.get('/', validate(listQuerySchema, 'query'), getEvents)

// ── GET /events/upcoming ───────────────────────────────
router.get('/upcoming', getUpcomingEvents)

// ── GET /events/calendar — structured for calendar UI ──
router.get('/calendar', getCalendarEvents)

// ── GET /events/past ───────────────────────────────────
router.get('/past', getPastEvents)

// ── GET /events/:slug ──────────────────────────────────
router.get('/:slug', getEventBySlug)

// ── POST /events/:id/rsvp ──────────────────────────────
router.post('/:id/rsvp', optionalAuth, formLimiter, validate(rsvpSchema), rsvp)

// ── POST /events/propose ───────────────────────────────
router.post('/propose', formLimiter, validate(eventProposalSchema), proposeEvent)

export default router
