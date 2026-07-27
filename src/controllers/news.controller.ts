import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase.js'
import { withCache, CacheKey, CacheTTL } from '../config/redis.js'
import { NotFoundError } from '../middleware/error.middleware.js'

export async function getNews(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, category, featured, search, tag } = req.query as any
    const offset = (page - 1) * limit

    let query = supabase
      .from('posts')
      .select('id, slug, title, excerpt, category, published_at, is_featured, cover_image_url, tags, authorId', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) query = query.eq('category', category)
    if (featured) query = query.eq('is_featured', true)
    if (search)   query = query.ilike('title', `%${search}%`)
    if (tag)      query = query.contains('tags', [tag])

    const { data, error, count } = await query
    if (error) throw error
    res.json({ data, meta: { page, limit, total: count, totalPages: Math.ceil((count ?? 0) / limit) } })
  } catch (err) {
    next(err)
  }
}

export async function getFeaturedNews(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await withCache(CacheKey.news('featured'), CacheTTL.short, async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, slug, title, excerpt, category, published_at, cover_image_url')
        .eq('is_published', true)
        .eq('is_featured', true)
        .limit(4)
      if (error) throw error
      return data
    })
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getArticleBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const data = await withCache(CacheKey.news(slug), CacheTTL.medium, async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()
      if (error) return null
      return data
    })
    if (!data) throw new NotFoundError('Article')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}
