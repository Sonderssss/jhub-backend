import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { formLimiter } from '../middleware/rateLimiter.middleware.js'
import { listQuerySchema, enrollSchema, interestSchema } from '../schemas/courses.schema.js'
import { getCourses, getFeaturedCourses, getCategories, getCourseBySlug, enroll, getProgress, registerInterest } from '../controllers/courses.controller.js'

const router = Router()

// ── GET /courses ───────────────────────────────────────
router.get('/', validate(listQuerySchema, 'query'), getCourses)

// ── GET /courses/featured ──────────────────────────────
router.get('/featured', getFeaturedCourses)

// ── GET /courses/categories ────────────────────────────
router.get('/categories', getCategories)

// ── GET /courses/:slug ─────────────────────────────────
router.get('/:slug', getCourseBySlug)

// ── POST /courses/:id/enroll ───────────────────────────
router.post('/:id/enroll', requireAuth, validate(enrollSchema), enroll)

// ── GET /courses/:id/progress ──────────────────────────
router.get('/:id/progress', requireAuth, getProgress)

// ── POST /courses/interest — no-account interest form ──
router.post('/interest', formLimiter, validate(interestSchema), registerInterest)

export default router
