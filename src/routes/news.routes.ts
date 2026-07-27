import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { newsQuerySchema } from '../schemas/news.schema.js'
import { getNews, getFeaturedNews, getArticleBySlug } from '../controllers/news.controller.js'

export const newsRouter = Router()

// ── GET /news ──────────────────────────────────────────
newsRouter.get('/', validate(newsQuerySchema, 'query'), getNews)

// ── GET /news/featured ──────────────────────────────────
newsRouter.get('/featured', getFeaturedNews)

// ── GET /news/:slug ─────────────────────────────────────
newsRouter.get('/:slug', getArticleBySlug)

export default newsRouter
