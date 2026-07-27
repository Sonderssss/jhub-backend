import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../../config/supabase.js'
import { redis, CacheKey } from '../../config/redis.js'
import { NotFoundError } from '../../middleware/error.middleware.js'

export async function getAdminPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, category, featured, search, tag } = req.query as any
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('posts')
      .select('id, slug, title, excerpt, category, is_published, is_featured, published_at, cover_image_url, tags, authorId', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) query = query.eq('category', category)
    if (featured) query = query.eq('is_featured', true)
    if (search)   query = query.ilike('title', `%${search}%`)
    if (tag)      query = query.contains('tags', [tag])

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

export async function getAdminPostById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundError('Article')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function createAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const slugify = (await import('slugify')).default
    const slug = slugify(req.body.title, { lower: true, strict: true })

    const { title, excerpt, content, category, isPublished, isFeatured, publishedAt, coverImageUrl, tags, authorId } = req.body

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        id: crypto.randomUUID(),
        slug,
        title,
        excerpt: excerpt || null,
        content,
        category,
        is_published: isPublished,
        is_featured: isFeatured,
        published_at: publishedAt || (isPublished ? new Date().toISOString() : null),
        cover_image_url: coverImageUrl || null,
        tags: tags || [],
        authorId: authorId || null,
      })
      .select()
      .single()

    if (error) throw error

    // Evict Redis Cache
    if (redis) {
      await Promise.all([
        redis.del(CacheKey.news()),
        redis.del(CacheKey.news('featured')),
      ])
    }

    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { title, excerpt, content, category, isPublished, isFeatured, publishedAt, coverImageUrl, tags, authorId } = req.body

    // Retrieve existing post to clear specific slug cache
    const { data: existing } = await supabaseAdmin
      .from('posts')
      .select('slug, published_at')
      .eq('id', id)
      .single()

    const updates: any = {}
    if (title !== undefined) {
      updates.title = title
      const slugify = (await import('slugify')).default
      updates.slug = slugify(title, { lower: true, strict: true })
    }
    if (excerpt !== undefined) updates.excerpt = excerpt || null
    if (content !== undefined) updates.content = content
    if (category !== undefined) updates.category = category
    if (isPublished !== undefined) {
      updates.is_published = isPublished
      if (isPublished && !existing?.published_at && !publishedAt) {
        updates.published_at = new Date().toISOString()
      }
    }
    if (isFeatured !== undefined) updates.is_featured = isFeatured
    if (publishedAt !== undefined) updates.published_at = publishedAt || null
    if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl || null
    if (tags !== undefined) updates.tags = tags
    if (authorId !== undefined) updates.authorId = authorId || null

    const { data, error } = await supabaseAdmin
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new NotFoundError('Article')

    // Evict Redis Cache
    if (redis) {
      const cacheKeys = [
        CacheKey.news(),
        CacheKey.news('featured'),
      ]
      if (existing?.slug) cacheKeys.push(CacheKey.news(existing.slug))
      if (data.slug && data.slug !== existing?.slug) cacheKeys.push(CacheKey.news(data.slug))

      const client = redis
      await Promise.all(cacheKeys.map(k => client.del(k)))
    }

    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function deleteAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    // Retrieve existing post to clear specific slug cache
    const { data: existing } = await supabaseAdmin
      .from('posts')
      .select('slug')
      .eq('id', id)
      .single()

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Evict Redis Cache
    if (redis) {
      const cacheKeys = [
        CacheKey.news(),
        CacheKey.news('featured'),
      ]
      if (existing?.slug) cacheKeys.push(CacheKey.news(existing.slug))

      const client = redis
      await Promise.all(cacheKeys.map(k => client.del(k)))
    }

    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
