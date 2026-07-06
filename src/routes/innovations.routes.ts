import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'
import { formLimiter } from '../middleware/rateLimiter.middleware.js'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { withCache, CacheKey, CacheTTL } from '../config/redis.js'
import { NotFoundError } from '../middleware/error.middleware.js'
import { listQuerySchema, createSchema, submitSchema, updateInnovationStatusSchema } from '../schemas/innovations.schema.js'

const router = Router()

// ── GET /innovations ───────────────────────────────────
router.get('/', validate(listQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, stage, sector, category, featured, search } = req.query as any
    const offset = (page - 1) * limit

    let query = supabase
      .from('innovations')
      .select(`
        id, slug, title, tagline, stage, status, sector,
        is_featured, cover_image_url, created_at,
        owner:users(id, first_name, last_name),
        innovation_categories(name, slug)
      `, { count: 'exact' })
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (stage)    query = query.eq('stage', stage)
    if (sector)   query = query.eq('sector', sector)
    if (featured) query = query.eq('is_featured', true)
    if (search)   query = query.ilike('title', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error

    res.json({
      data,
      meta: { page, limit, total: count, totalPages: Math.ceil((count ?? 0) / limit) },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /innovations/featured ──────────────────────────
router.get('/featured', async (req, res, next) => {
  try {
    const data = await withCache(CacheKey.innovations('featured'), CacheTTL.medium, async () => {
      const { data, error } = await supabase
        .from('innovations')
        .select('id, slug, title, tagline, stage, sector, cover_image_url')
        .eq('status', 'APPROVED')
        .eq('is_featured', true)
        .limit(6)
      if (error) throw error
      return data
    })
    res.json({ data })
  } catch (err) {
    next(err)
  }
})

// ── GET /innovations/categories ────────────────────────
router.get('/categories', async (req, res, next) => {
  try {
    const data = await withCache('innovations:categories', CacheTTL.long, async () => {
      const { data, error } = await supabase
        .from('innovation_categories')
        .select('id, name, slug, description')
        .order('name')
      if (error) throw error
      return data
    })
    res.json({ data })
  } catch (err) {
    next(err)
  }
})

// ── GET /innovations/:slug ─────────────────────────────
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params
    const data = await withCache(CacheKey.innovations(slug), CacheTTL.medium, async () => {
      const { data, error } = await supabase
        .from('innovations')
        .select(`
          *,
          owner:users(id, first_name, last_name, avatar_url),
          team_members(*),
          innovation_categories(name, slug),
          sponsorships(
            id, amount, currency,
            partner:partners(name, logo_url, website)
          )
        `)
        .eq('slug', slug)
        .eq('status', 'APPROVED')
        .single()
      if (error) return null
      return data
    })

    if (!data) throw new NotFoundError('Innovation')
    res.json({ data })
  } catch (err) {
    next(err)
  }
})

// ── POST /innovations — create public endpoint for seeding ──
router.post(
  '/',
  validate(createSchema),
  async (req, res, next) => {
    try {
      const slugify = (await import('slugify')).default
      const slug = slugify(req.body.title, { lower: true, strict: true })

      const { title, tagline, problem, solution, stage, sector, categories, beneficiaries, traction, impactEvidence, supportRequired, ownerId, coverImageUrl } = req.body

      const owner_id = req.user?.sub || ownerId || null

      const { data, error } = await supabaseAdmin
        .from('innovations')
        .insert({
          slug,
          title,
          tagline,
          problem,
          solution,
          stage,
          sector,
          beneficiaries,
          traction,
          impact_evidence: impactEvidence,
          support_required: supportRequired,
          cover_image_url: coverImageUrl,
          owner_id,
          status: 'DRAFT',
        })
        .select()
        .single()

      if (error) throw error
      res.status(201).json({ data })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /innovations/submit — public submission form ──
router.post(
  '/submit',
  formLimiter,
  validate(submitSchema),
  async (req, res, next) => {
    try {
      const { contactName, contactEmail, phone, title, sector, stage, problem, solution, supportRequired, teamInfo, projectLinks, attachmentUrl, innovationId } = req.body

      const structuredNotes = `
Project Name: ${title}
Sector: ${sector}
Stage: ${stage}
Problem: ${problem}
Solution: ${solution}
Support Required: ${supportRequired}
Team Info: ${teamInfo}
Links: ${projectLinks || 'None'}
Attachment: ${attachmentUrl || 'None'}
      `.trim()

      const { data, error } = await supabaseAdmin
        .from('innovation_submissions')
        .insert({
          contact_name:     contactName,
          contact_email:    contactEmail,
          phone,
          institution:      teamInfo, // fallback to team info as institution context
          notes:            structuredNotes,
          innovation_id:    innovationId ?? null,
          user_id:          req.user?.sub ?? null,
          status:           'PENDING',
          title,
          sector,
          stage,
          problem,
          solution,
          support_required: supportRequired,
          team_info:        teamInfo,
          project_links:    projectLinks ?? null,
          attachment_url:   attachmentUrl ?? null,
        })
        .select()
        .single()

      if (error) throw error

      // Notify Innovation Program Lead using professional template
      try {
        const { compileInnovationSubmissionLeadEmail } = await import('../templates/emails/leads.templates.js')
        const { sendInnovationLeadNotification } = await import('../services/email.service.js')

        const emailHtml = compileInnovationSubmissionLeadEmail({
          contactName,
          contactEmail,
          phone,
          title,
          sector,
          stage,
          problem,
          solution,
          supportRequired,
          teamInfo,
          projectLinks,
          attachmentUrl,
        })

        await sendInnovationLeadNotification(`[Innovation Submission] ${title}`, emailHtml)
      } catch (emailErr) {
        console.error('Failed to notify Innovation Lead:', emailErr)
      }

      res.status(201).json({
        message: 'Innovation submitted successfully. We will review and get back to you.',
        submissionId: data.id,
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── PATCH /innovations/:id — update (owner or admin) ──
router.patch(
  '/:id',
  requireAuth,
  async (req, res, next) => {
    try {
      const { id } = req.params
      const allowed = ['title','tagline','problem','solution','stage','sector',
                       'beneficiaries','traction','impactEvidence','supportRequired','coverImageUrl']
      const updates = Object.fromEntries(
        Object.entries(req.body).filter(([k]) => allowed.includes(k))
      )

      const { data, error } = await supabaseAdmin
        .from('innovations')
        .update(updates)
        .eq('id', id)
        .eq('owner_id', req.user!.sub) // RLS: only owner can update
        .select()
        .single()

      if (error || !data) throw new NotFoundError('Innovation')
      res.json({ data })
    } catch (err) {
      next(err)
    }
  }
)

// ── PATCH /innovations/:id/status — admin update status 
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin'),
  validate(updateInnovationStatusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { status } = req.body

      const { data, error } = await supabaseAdmin
        .from('innovations')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) throw new NotFoundError('Innovation')
      res.json({ data })
    } catch (err) {
      next(err)
    }
  }
)

// ── PATCH /innovations/:id/feature — admin toggle feature 
router.patch(
  '/:id/feature',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const is_featured = req.body.isFeatured !== undefined ? req.body.isFeatured : true

      const { data, error } = await supabaseAdmin
        .from('innovations')
        .update({ is_featured })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) throw new NotFoundError('Innovation')
      res.json({ data })
    } catch (err) {
      next(err)
    }
  }
)

export default router
