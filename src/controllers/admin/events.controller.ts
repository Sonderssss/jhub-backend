import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../../config/supabase.js'
import { NotFoundError } from '../../middleware/error.middleware.js'

export async function getAdminEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, type, upcoming, past, featured } = req.query as any
    const offset = (page - 1) * limit
    const now = new Date().toISOString()

    let query = supabaseAdmin
      .from('events')
      .select('id, slug, title, description, type, status, start_date, end_date, location, is_online, is_featured, cover_image_url', { count: 'exact' })
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

export async function getAdminEventById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundError('Event')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function createAdminEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const slugify = (await import('slugify')).default
    const slug = slugify(req.body.title, { lower: true, strict: true })

    const { title, description, type, status, isFeatured, startDate, endDate, location, isOnline, meetingUrl, maxCapacity, registrationUrl, registrationDeadline, coverImageUrl } = req.body

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        id: crypto.randomUUID(),
        slug,
        title,
        description,
        type,
        status,
        is_featured: isFeatured,
        start_date: startDate,
        end_date: endDate,
        location,
        is_online: isOnline,
        meeting_url: meetingUrl,
        max_capacity: maxCapacity,
        registration_url: registrationUrl,
        registration_deadline: registrationDeadline,
        cover_image_url: coverImageUrl,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { title, description, type, status, isFeatured, startDate, endDate, location, isOnline, meetingUrl, maxCapacity, registrationUrl, registrationDeadline, coverImageUrl } = req.body

    const updates: any = {}
    if (title !== undefined) {
      updates.title = title
      const slugify = (await import('slugify')).default
      updates.slug = slugify(title, { lower: true, strict: true })
    }
    if (description !== undefined) updates.description = description
    if (type !== undefined) updates.type = type
    if (status !== undefined) updates.status = status
    if (isFeatured !== undefined) updates.is_featured = isFeatured
    if (startDate !== undefined) updates.start_date = startDate
    if (endDate !== undefined) updates.end_date = endDate
    if (location !== undefined) updates.location = location
    if (isOnline !== undefined) updates.is_online = isOnline
    if (meetingUrl !== undefined) updates.meeting_url = meetingUrl
    if (maxCapacity !== undefined) updates.max_capacity = maxCapacity
    if (registrationUrl !== undefined) updates.registration_url = registrationUrl
    if (registrationDeadline !== undefined) updates.registration_deadline = registrationDeadline
    if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new NotFoundError('Event')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function deleteAdminEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
