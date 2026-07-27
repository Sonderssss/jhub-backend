import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../../config/supabase.js'
import { redis, CacheKey } from '../../config/redis.js'
import { NotFoundError } from '../../middleware/error.middleware.js'

export async function createPartner(req: Request, res: Response, next: NextFunction) {
  try {
    const slugify = (await import('slugify')).default
    const slug = slugify(req.body.name, { lower: true, strict: true })

    const { name, type, logoUrl, website, description, isFeatured, isActive } = req.body

    const { data, error } = await supabaseAdmin
      .from('partners')
      .insert({
        id: crypto.randomUUID(),
        slug,
        name,
        type,
        logo_url: logoUrl,
        website,
        description,
        is_featured: isFeatured,
        is_active: isActive,
      })
      .select()
      .single()

    if (error) throw error

    if (redis) {
      await redis.del(CacheKey.partners())
    }

    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 12
    const offset = (page - 1) * limit
    const type = req.query.type

    let query = supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type)
    }

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

export async function getApplicationById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundError('Application')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function updateApplicationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status, reviewNotes } = req.body

    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({
        status,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new NotFoundError('Application')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function updatePartner(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { name, type, logoUrl, website, description, isFeatured, isActive } = req.body

    const updates: any = {}
    if (name !== undefined) {
      updates.name = name
      const slugify = (await import('slugify')).default
      updates.slug = slugify(name, { lower: true, strict: true })
    }
    if (type !== undefined) updates.type = type
    if (logoUrl !== undefined) updates.logo_url = logoUrl
    if (website !== undefined) updates.website = website
    if (description !== undefined) updates.description = description
    if (isFeatured !== undefined) updates.is_featured = isFeatured
    if (isActive !== undefined) updates.is_active = isActive

    const { data, error } = await supabaseAdmin
      .from('partners')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new NotFoundError('Partner')

    if (redis) {
      await redis.del(CacheKey.partners())
    }

    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function deletePartner(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin
      .from('partners')
      .delete()
      .eq('id', id)

    if (error) throw error

    if (redis) {
      await redis.del(CacheKey.partners())
    }

    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function createSponsorship(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: partnerId } = req.params
    const { innovationId, amount, currency, description, startDate, endDate } = req.body

    const { data, error } = await supabaseAdmin
      .from('sponsorships')
      .insert({
        id: crypto.randomUUID(),
        partner_id: partnerId,
        innovation_id: innovationId,
        amount,
        currency,
        description,
        start_date: startDate,
        end_date: endDate,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}
