import { Router } from 'express'
import { getResources, getResourceBySlug, incrementDownload } from '../controllers/resources.controller.js'

const router = Router()

// ── GET /resources ─────────────────────────────────────
router.get('/', getResources)

// ── GET /resources/:slug ────────────────────────────────
router.get('/:slug', getResourceBySlug)

// ── POST /resources/:id/download — increment download counter ──
router.post('/:id/download', incrementDownload)

export default router
