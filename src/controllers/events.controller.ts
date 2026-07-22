import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { withCache, CacheKey, CacheTTL } from '../config/redis.js'
import { NotFoundError } from '../middleware/error.middleware.js'

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, type, upcoming, past, featured } = req.query as any
    const offset = (page - 1) * limit
    const now = new Date().toISOString()

    let query = supabase
      .from('events')
      .select('id, slug, title, description, type, status, start_date, end_date, location, is_online, is_featured, cover_image_url', { count: 'exact' })
      .eq('status', 'PUBLISHED')
      .order('start_date', { ascending: upcoming !== false })
      .range(offset, offset + limit - 1)

    if (type)     query = query.eq('type', type)
    if (featured) query = query.eq('is_featured', true)
    if (upcoming) query = query.gte('start_date', now)
    if (past)     query = query.lt('start_date', now)

    const { data, error, count } = await query
    if (error) throw error

    res.json({
      data,
      meta: { page, limit, total: count, totalPages: Math.ceil((count ?? 0) / limit) },
    })
  } catch (err) {
    next(err)
  }
}

export async function getUpcomingEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await withCache(CacheKey.events('upcoming'), CacheTTL.short, async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, slug, title, type, start_date, end_date, location, is_online, cover_image_url')
        .eq('status', 'PUBLISHED')
        .gte('start_date', new Date().toISOString())
        .order('start_date')
        .limit(8)
      if (error) throw error
      return data
    })
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getCalendarEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, year } = req.query
    const y = Number(year) || new Date().getFullYear()
    const m = Number(month) || new Date().getMonth() + 1

    const startOfMonth = new Date(y, m - 1, 1).toISOString()
    const endOfMonth   = new Date(y, m, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('events')
      .select('id, slug, title, type, start_date, end_date, is_online, location')
      .eq('status', 'PUBLISHED')
      .gte('start_date', startOfMonth)
      .lte('start_date', endOfMonth)
      .order('start_date')

    if (error) throw error
    res.json({ data, meta: { month: m, year: y } })
  } catch (err) {
    next(err)
  }
}

export async function getPastEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1
    const limit = 12
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('events')
      .select('id, slug, title, type, start_date, location, cover_image_url', { count: 'exact' })
      .eq('status', 'COMPLETED')
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    res.json({ data, meta: { page, total: count } })
  } catch (err) {
    next(err)
  }
}

export async function getEventBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const data = await withCache(CacheKey.events(slug), CacheTTL.short, async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'PUBLISHED')
        .single()
      if (error) return null
      return data
    })
    if (!data) throw new NotFoundError('Event')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function rsvp(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const userId = req.user?.sub ?? null

    // Verify event exists and has capacity
    const { data: event } = await supabase
      .from('events')
      .select('id, title, max_capacity, registration_deadline, type, start_date, location, is_online, meeting_url')
      .eq('id', id)
      .single()

    if (!event) throw new NotFoundError('Event')

    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return res.status(400).json({ error: 'Registration deadline has passed' })
    }

    const { guestName, guestEmail, guestPhone, affiliation, dietaryRequirements, accessibilityRequirements, marketingConsent } = req.body

    const { data, error } = await supabaseAdmin
      .from('event_rsvps')
      .insert({
        id:                         crypto.randomUUID(),
        event_id:                   id,
        user_id:                    userId,
        guest_name:                 guestName,
        guest_email:                guestEmail,
        guest_phone:                guestPhone || null,
        affiliation,
        dietary_requirements:       dietaryRequirements || null,
        accessibility_requirements: accessibilityRequirements || null,
        marketing_consent:          marketingConsent,
      })
      .select()
      .single()

    if (error) throw error

    // Retrieve recipient details and send the RSVP confirmation email
    try {
      let recipientEmail = guestEmail
      let recipientName = guestName

      if (userId) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email, first_name, last_name, phone')
          .eq('id', userId)
          .single()
        if (user) {
          recipientEmail = user.email
          recipientName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Attendee'
        }
      }

      if (recipientEmail && event) {
        const { compileRsvpEmail } = await import('../templates/emails/rsvp.template.js')
        const { sendEmail } = await import('../services/email.service.js')

        const emailHtml = compileRsvpEmail({
          recipientName,
          eventTitle: event.title,
          eventType: event.type,
          startDate: event.start_date,
          location: event.location,
          isOnline: event.is_online,
          meetingUrl: event.meeting_url,
        })

        await sendEmail({
          to: recipientEmail,
          subject: `RSVP Confirmed: ${event.title}`,
          html: emailHtml,
        })

        // Notify Events Coordinator using professional template
        const { compileEventRegistrationLeadEmail } = await import('../templates/emails/leads.templates.js')
        const { sendEventsCoordinatorNotification } = await import('../services/email.service.js')

        const coordEmailHtml = compileEventRegistrationLeadEmail({
          eventTitle: event.title,
          guestName: recipientName,
          guestEmail: recipientEmail,
          guestPhone: guestPhone || 'N/A',
          affiliation,
          dietaryRequirements,
          accessibilityRequirements,
          marketingConsent,
        })

        await sendEventsCoordinatorNotification(`[Event Registration] ${event.title} - ${recipientName}`, coordEmailHtml)
      }
    } catch (emailErr) {
      console.error('Failed to send event RSVP confirmation email:', emailErr)
    }

    res.status(201).json({ message: `RSVP confirmed for ${event.title}`, data })
  } catch (err) {
    next(err)
  }
}

export async function proposeEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { error } = await supabaseAdmin.from('contact_inquiries').insert({
      name:     req.body.organizerName,
      email:    req.body.organizerEmail,
      category: 'EVENTS',
      subject:  `Event proposal: ${req.body.eventTitle}`,
      message:  JSON.stringify(req.body, null, 2),
    })
    if (error) throw error
    res.status(201).json({ message: 'Event proposal submitted. Our team will review and contact you.' })
  } catch (err) {
    next(err)
  }
}
