import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { updatePartnerSchema, createSponsorshipSchema, createPartnerProfileSchema, updateApplicationSchema } from '../../schemas/partners.schema.js'
import { createPartner, getApplications, getApplicationById, updateApplicationStatus, updatePartner, deletePartner, createSponsorship } from '../../controllers/admin/partners.controller.js'

const router = Router()

// ── POST / ─────────────────────────────────────────────
router.post('/', validate(createPartnerProfileSchema), createPartner)

// ── GET /applications ──────────────────────────────────
router.get('/applications', getApplications)

// ── GET /applications/:id ──────────────────────────────
router.get('/applications/:id', getApplicationById)

// ── PATCH /applications/:id ────────────────────────────
router.patch('/applications/:id', validate(updateApplicationSchema), updateApplicationStatus)

// ── PATCH /:id ─────────────────────────────────────────
router.patch('/:id', validate(updatePartnerSchema), updatePartner)

// ── DELETE /:id ────────────────────────────────────────
router.delete('/:id', deletePartner)

// ── POST /:id/sponsorships ─────────────────────────────
router.post('/:id/sponsorships', validate(createSponsorshipSchema), createSponsorship)

export default router
