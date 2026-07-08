import { Router } from 'express'
import authRoutes from './auth.routes.js'
import innovationsRoutes from './innovations.routes.js'
import coursesRoutes from './courses.routes.js'
import eventsRoutes from './events.routes.js'
import newsRouter from './news.routes.js'
import partnersRouter from './partners.routes.js'
import resourcesRouter from './resources.routes.js'
import contactRouter from './contact.routes.js'
import adminRouter from './admin/index.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/innovations', innovationsRoutes)
router.use('/courses', coursesRoutes)
router.use('/events', eventsRoutes)
router.use('/news', newsRouter)
router.use('/partners', partnersRouter)
router.use('/resources', resourcesRouter)
router.use('/contact', contactRouter)

// Unified admin endpoints with RBAC protection
router.use('/admin', requireAuth, requireRole('admin'), adminRouter)

export default router
