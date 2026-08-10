import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { withCache, CacheKey, CacheTTL } from '../config/redis.js'
import { NotFoundError } from '../middleware/error.middleware.js'

export async function getInnovations(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, stage, sector, category, featured, search } = req.query as any
    const offset = (page - 1) * limit

    let query = supabase
      .from('innovations')
      .select(`
        id, slug, title, tagline, description, stage, status, sector,
        is_featured, cover_image_url, created_at,
        problem, solution, support_required,
        owner:users(id, first_name, last_name),
        InnovationToInnovationCategory(innovation_categories(name, slug))
      `, { count: 'exact' })
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (stage) query = query.eq('stage', stage)
    if (sector) query = query.eq('sector', sector)
    if (featured) query = query.eq('is_featured', true)
    if (search) query = query.ilike('title', `%${search}%`)

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

export async function getFeaturedInnovations(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await withCache(CacheKey.innovations('featured'), CacheTTL.medium, async () => {
      const { data, error } = await supabase
        .from('innovations')
        .select('id, slug, title, tagline, description, stage, sector, cover_image_url')
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
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
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
}

export async function getInnovationBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const data = await withCache(CacheKey.innovations(slug), CacheTTL.medium, async () => {
      const { data, error } = await supabaseAdmin
        .from('innovations')
        .select(`
          *,
          owner:users(id, first_name, last_name, avatar_url),
          team_members(*),
          InnovationToInnovationCategory(innovation_categories(name, slug)),
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
}

export async function createDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const slugify = (await import('slugify')).default
    const slug = slugify(req.body.title, { lower: true, strict: true })

    const { title, tagline, description, problem, solution, stage, sector, categories, beneficiaries, traction, impactEvidence, supportRequired, ownerId, coverImageUrl } = req.body

    const owner_id = req.user?.sub || ownerId || null
    if (!owner_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'An ownerId is required in the request body, or a valid Authorization Bearer token must be provided.'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('innovations')
      .insert({
        id: crypto.randomUUID(),
        slug,
        title,
        tagline,
        description,
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

    // Sync nested team members
    const teamMembers = req.body.teamMembers
    if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
      const teamInsertPayload = teamMembers.map((m: any) => ({
        id: crypto.randomUUID(),
        innovation_id: data.id,
        name: m.name,
        role: m.role,
      }))
      const { error: teamError } = await supabaseAdmin
        .from('team_members')
        .insert(teamInsertPayload)
      if (teamError) {
        console.error("Failed to insert nested team members on createDraft:", teamError)
      }
    }

    const { data: finalData, error: finalError } = await supabaseAdmin
      .from('innovations')
      .select('*, team_members(*)')
      .eq('id', data.id)
      .single()

    if (finalError || !finalData) throw finalError || new NotFoundError('Innovation')
    res.status(201).json({ data: finalData })
  } catch (err) {
    next(err)
  }
}

export async function submitProposal(req: Request, res: Response, next: NextFunction) {
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
        id: crypto.randomUUID(),
        contact_name: contactName,
        contact_email: contactEmail,
        phone,
        institution: teamInfo, // fallback to team info as institution context
        notes: structuredNotes,
        innovation_id: innovationId ?? null,
        user_id: req.user?.sub ?? null,
        status: 'PENDING',
        title,
        sector,
        stage,
        problem,
        solution,
        support_required: supportRequired,
        team_info: teamInfo,
        project_links: projectLinks ?? null,
        attachment_url: attachmentUrl ?? null,
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

export async function updateInnovation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const updates: any = {}
    if (req.body.title !== undefined) updates.title = req.body.title
    if (req.body.tagline !== undefined) updates.tagline = req.body.tagline
    if (req.body.description !== undefined) updates.description = req.body.description
    if (req.body.problem !== undefined) updates.problem = req.body.problem
    if (req.body.solution !== undefined) updates.solution = req.body.solution
    if (req.body.stage !== undefined) updates.stage = req.body.stage
    if (req.body.sector !== undefined) updates.sector = req.body.sector
    if (req.body.beneficiaries !== undefined) updates.beneficiaries = req.body.beneficiaries
    if (req.body.traction !== undefined) updates.traction = req.body.traction
    if (req.body.impactEvidence !== undefined) updates.impact_evidence = req.body.impactEvidence
    if (req.body.supportRequired !== undefined) updates.support_required = req.body.supportRequired
    if (req.body.coverImageUrl !== undefined) updates.cover_image_url = req.body.coverImageUrl

    let query = supabaseAdmin
      .from('innovations')
      .update(updates)
      .eq('id', id)

    console.log("EXPRESS updateInnovation params ID:", id);
    console.log("EXPRESS updateInnovation user:", req.user);
    console.log("EXPRESS updateInnovation checks admin:", req.user!.role?.toLowerCase() === 'admin');

    if (req.user!.role?.toLowerCase() !== 'admin') {
      query = query.eq('owner_id', req.user!.sub)
    }

    const { data, error } = await query.select().single()
    if (error || !data) throw new NotFoundError('Innovation')

    // Sync nested team members
    const teamMembers = req.body.teamMembers
    if (teamMembers && Array.isArray(teamMembers)) {
      // First, delete old ones
      const { error: deleteError } = await supabaseAdmin
        .from('team_members')
        .delete()
        .eq('innovation_id', id)
      if (deleteError) {
        console.error("Failed to delete team members on updateInnovation:", deleteError)
      }

      // Then insert new ones
      if (teamMembers.length > 0) {
        const teamInsertPayload = teamMembers.map((m: any) => ({
          id: crypto.randomUUID(),
          innovation_id: id,
          name: m.name,
          role: m.role,
        }))
        const { error: teamError } = await supabaseAdmin
          .from('team_members')
          .insert(teamInsertPayload)
        if (teamError) {
          console.error("Failed to insert team members on updateInnovation:", teamError)
        }
      }
    }

    const { data: finalData, error: finalError } = await supabaseAdmin
      .from('innovations')
      .select('*, team_members(*)')
      .eq('id', id)
      .single()

    if (finalError || !finalData) throw finalError || new NotFoundError('Innovation')
    res.json({ data: finalData })
  } catch (err) {
    next(err)
  }
}
