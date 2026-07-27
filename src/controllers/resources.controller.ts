import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { withCache, CacheKey, CacheTTL } from '../config/redis.js'
import { NotFoundError } from '../middleware/error.middleware.js'

export async function getResources(req: Request, res: Response, next: NextFunction) {
  try {
    const { category } = req.query
    const cacheKey = category ? `resources:${category}` : CacheKey.resources()

    const data = await withCache(cacheKey, CacheTTL.long, async () => {
      let query = supabase
        .from('resources')
        .select('id, slug, title, description, category, file_url, external_url, download_count')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', String(category))
      }

      const { data, error } = await query
      if (error) throw error
      return data
    })

    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getResourceBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error || !data) throw new NotFoundError('Resource')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function incrementDownload(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin.rpc('increment_download_count', { resource_id: id })
    if (error) throw error
    res.json({ message: 'Download tracked' })
  } catch (err) {
    next(err)
  }
}
