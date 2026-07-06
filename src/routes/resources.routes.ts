import { Router } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { withCache, CacheKey, CacheTTL } from '../config/redis.js'
import { NotFoundError } from '../middleware/error.middleware.js'

export const resourcesRouter = Router()

// ── GET /resources ──────────────────────────────────────
resourcesRouter.get('/', async (req, res, next) => {
  try {
    const { category } = req.query
    const data = await withCache(
      category ? `resources:${category}` : CacheKey.resources(),
      CacheTTL.long,
      async () => {
        let query = supabase
          .from('resources')
          .select('id, slug, title, description, category, file_url, external_url, download_count')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
        if (category) query = query.eq('category', String(category))
        const { data, error } = await query
        if (error) throw error
        return data
      }
    )
    res.json({ data })
  } catch (err) { next(err) }
})

// ── GET /resources/:slug ────────────────────────────────
resourcesRouter.get('/:slug', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('is_published', true)
      .single()
    if (error || !data) throw new NotFoundError('Resource')
    res.json({ data })
  } catch (err) { next(err) }
})

// ── POST /resources/:id/download ────────────────────────
resourcesRouter.post('/:id/download', async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin.rpc('increment_download_count', { resource_id: req.params.id })
    if (error) throw error
    res.json({ message: 'Download tracked' })
  } catch (err) { next(err) }
})

export default resourcesRouter
