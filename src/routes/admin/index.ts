import { Router } from 'express'
import adminInnovationsRouter from './admin.innovations.js'
import adminCoursesRouter from './admin.courses.js'
import adminEventsRouter from './admin.events.js'
import adminPartnersRouter from './admin.partners.js'

export const adminRouter = Router()

// Mount admin resource routers
adminRouter.use('/innovations', adminInnovationsRouter)
adminRouter.use('/courses', adminCoursesRouter)
adminRouter.use('/events', adminEventsRouter)
adminRouter.use('/partners', adminPartnersRouter)

export default adminRouter
