import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { formLimiter } from '../middleware/rateLimiter.middleware.js'
import { partnerApplicationSchema, partnerSponsorSchema } from '../schemas/partners.schema.js'
import { getPartners, getPartnerBySlug, applyPartnership, applySponsorship } from '../controllers/partners.controller.js'

const router = Router()

// ── GET /partners ──────────────────────────────────────
router.get('/', getPartners)

// ── GET /partners/:slug ─────────────────────────────────
router.get('/:slug', getPartnerBySlug)

// ── POST /partners/apply ───────────────────────────────
router.post('/apply', formLimiter, validate(partnerApplicationSchema), applyPartnership)

// ── POST /partners/sponsor ─────────────────────────────
router.post('/sponsor', formLimiter, validate(partnerSponsorSchema), applySponsorship)

export default router
