import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { formLimiter } from '../middleware/rateLimiter.middleware.js'
import { contactSchema } from '../schemas/contact.schema.js'
import { submitInquiry, getInfo } from '../controllers/contact.controller.js'

export const contactRouter = Router()

// ── POST /contact ──────────────────────────────────────
contactRouter.post('/', formLimiter, validate(contactSchema), submitInquiry)

// ── GET /contact/info ───────────────────────────────────
contactRouter.get('/info', getInfo)

export default contactRouter
