import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { formLimiter } from '../middleware/rateLimiter.middleware.js'
import { listQuerySchema, createSchema, submitSchema } from '../schemas/innovations.schema.js'
import { getInnovations, getFeaturedInnovations, getCategories, getInnovationBySlug, createDraft, submitProposal, updateInnovation } from '../controllers/innovations.controller.js'

const router = Router()

// GET /innovations
router.get('/', validate(listQuerySchema, 'query'), getInnovations)

// GET /innovations/featured
router.get('/featured', getFeaturedInnovations)

// GET /innovations/categories
router.get('/categories', getCategories)

// GET /innovations/:slug
router.get('/:slug', getInnovationBySlug)

// POST /innovations
router.post('/', validate(createSchema), createDraft)

// POST /innovations/submit
router.post('/submit', formLimiter, validate(submitSchema), submitProposal)

// PATCH /innovations/:id
router.patch('/:id', requireAuth, updateInnovation)

export default router
