import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { createNewsSchema, updateNewsSchema, newsQuerySchema } from '../../schemas/news.schema.js'
import { getAdminPosts, getAdminPostById, createAdminPost, updateAdminPost, deleteAdminPost } from '../../controllers/admin/news.controller.js'

const router = Router()

// ── GET / ──────────────────────────────────────────────
router.get('/', validate(newsQuerySchema, 'query'), getAdminPosts)

// ── GET /:id ───────────────────────────────────────────
router.get('/:id', getAdminPostById)

// ── POST / ─────────────────────────────────────────────
router.post('/', validate(createNewsSchema), createAdminPost)

// ── PATCH /:id ─────────────────────────────────────────
router.patch('/:id', validate(updateNewsSchema), updateAdminPost)

// ── DELETE /:id ────────────────────────────────────────
router.delete('/:id', deleteAdminPost)

export default router
