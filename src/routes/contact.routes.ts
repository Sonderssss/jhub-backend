import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { formLimiter } from '../middleware/rateLimiter.middleware.js'
import { supabaseAdmin } from '../config/supabase.js'
import { contactSchema } from '../schemas/contact.schema.js'
import { sendAdminNotification } from '../services/email.service.js'

export const contactRouter = Router()

// ── POST /contact ──────────────────────────────────────
contactRouter.post(
  '/',
  formLimiter,
  validate(contactSchema),
  async (req, res, next) => {
    try {
      const { name, email, phone, category, subject, message, preferredResponseChannel } = req.body

      const structuredMessage = `
Preferred Response Channel: ${preferredResponseChannel}
Message:
${message}
      `.trim()

      const { data, error } = await supabaseAdmin
        .from('contact_inquiries')
        .insert({
          name,
          email,
          phone,
          category,
          subject: subject || 'General Inquiry',
          message: structuredMessage,
          preferred_response_channel: preferredResponseChannel,
        })
        .select('id')
        .single()

      if (error) throw error

      // Notify Secretariat using professional template
      try {
        const { compileGeneralContactLeadEmail } = await import('../templates/emails/leads.templates.js')
        const { sendSecretariatNotification } = await import('../services/email.service.js')

        const emailHtml = compileGeneralContactLeadEmail({
          category,
          subject: subject || 'General Inquiry',
          message,
          name,
          email,
          phone,
          preferredResponseChannel,
        })

        await sendSecretariatNotification(`[General Inquiry: ${category}] ${subject || 'General Inquiry'}`, emailHtml)
      } catch (emailErr) {
        console.error('Failed to notify Secretariat:', emailErr)
      }

      res.status(201).json({
        message: 'Message received. We aim to respond within 2 business days.',
        inquiryId: data.id,
      })
    } catch (err) { next(err) }
  }
)

// ── GET /contact/info ───────────────────────────────────
contactRouter.get('/info', async (_req, res) => {
  res.json({
    data: {
      email:    'hello@jhubafrica.com',
      phone:    '+254 700 000 000',
      location: 'JKUAT, Juja, Kiambu County, Kenya',
      officeHours: 'Monday – Friday, 8:00 AM – 5:00 PM EAT',
      social: {
        twitter:   'https://twitter.com/jhubafrica',
        linkedin:  'https://linkedin.com/company/jhubafrica',
        instagram: 'https://instagram.com/jhubafrica',
        youtube:   'https://youtube.com/@jhubafrica',
      },
    },
  })
})

export default contactRouter
