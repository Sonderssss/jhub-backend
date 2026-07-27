import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { withCache, CacheKey, CacheTTL } from '../config/redis.js'
import { NotFoundError } from '../middleware/error.middleware.js'

export async function getPartners(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await withCache(CacheKey.partners(), CacheTTL.long, async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, slug, type, logo_url, website, description, is_featured')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name')
      if (error) throw error
      return data
    })
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getPartnerBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const { data, error } = await supabase
      .from('partners')
      .select(`
        *,
        sponsorships(
          id, amount, currency,
          innovation:innovations(id, slug, title, stage)
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !data) throw new NotFoundError('Partner')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function applyPartnership(req: Request, res: Response, next: NextFunction) {
  try {
    const { organizationName, partnershipType, sector, proposedCollaboration, expectedTimeline, contactName, contactEmail, contactPhone } = req.body

    const structuredCollaboration = `
Partnership Type: ${partnershipType}
Sector: ${sector}
Expected Timeline: ${expectedTimeline}
Collaboration Proposal:
${proposedCollaboration}
    `.trim()

    const { error } = await supabaseAdmin.from('applications').insert({
      id:                     crypto.randomUUID(),
      type:                   'partnership',
      applicant_name:         contactName,
      applicant_email:        contactEmail,
      organization:           organizationName,
      message:                structuredCollaboration,
      status:                 'PENDING',
      partnership_type:       partnershipType,
      sector,
      proposed_collaboration: proposedCollaboration,
      expected_timeline:      expectedTimeline,
      contact_phone:          contactPhone,
    })
    if (error) throw error

    // Notify Strategic Partnerships Lead using professional template
    try {
      const { compilePartnerInquiryLeadEmail } = await import('../templates/emails/leads.templates.js')
      const { sendPartnershipsLeadNotification } = await import('../services/email.service.js')

      const emailHtml = compilePartnerInquiryLeadEmail({
        organizationName,
        partnershipType,
        sector,
        proposedCollaboration,
        expectedTimeline,
        contactName,
        contactEmail,
        contactPhone,
      })

      await sendPartnershipsLeadNotification(`[Partnership Proposal] ${organizationName}`, emailHtml)
    } catch (emailErr) {
      console.error('Failed to notify Partnerships Lead:', emailErr)
    }

    res.status(201).json({ message: 'Partnership application received. We will be in touch within 5 business days.' })
  } catch (err) {
    next(err)
  }
}

export async function applySponsorship(req: Request, res: Response, next: NextFunction) {
  try {
    const { sponsorName, sponsorEmail, organization, interestArea, innovationId, sponsorshipType, budgetRange, expectedOutcome, preferredContactMethod, message } = req.body

    const structuredSponsorship = `
Organization: ${organization}
Interest Area: ${interestArea}
Sponsorship Type: ${sponsorshipType}
Budget Range: ${budgetRange || 'None Specified'}
Preferred Contact Method: ${preferredContactMethod}
Expected Outcome:
${expectedOutcome}
Message: ${message || 'None'}
    `.trim()

    const { error } = await supabaseAdmin.from('applications').insert({
      id:                       crypto.randomUUID(),
      type:                     'sponsorship',
      applicant_name:           sponsorName,
      applicant_email:          sponsorEmail,
      organization:             organization,
      message:                  structuredSponsorship,
      status:                   'PENDING',
      interest_area:            interestArea,
      sponsorship_type:         sponsorshipType,
      budget_range:             budgetRange ?? null,
      expected_outcome:         expectedOutcome,
      preferred_contact_method: preferredContactMethod,
    })
    if (error) throw error

    // Notify Funding Lead using professional template
    try {
      let projectTitle = undefined
      if (innovationId) {
        const { data: innovation } = await supabaseAdmin
          .from('innovations')
          .select('title')
          .eq('id', innovationId)
          .single()
        if (innovation) projectTitle = innovation.title
      }

      const { compileSponsorInquiryLeadEmail } = await import('../templates/emails/leads.templates.js')
      const { sendFundingLeadNotification } = await import('../services/email.service.js')

      const emailHtml = compileSponsorInquiryLeadEmail({
        sponsorName,
        sponsorEmail,
        organization,
        interestArea,
        projectTitle,
        sponsorshipType,
        budgetRange,
        expectedOutcome,
        preferredContactMethod,
        message,
      })

      await sendFundingLeadNotification(`[Sponsor Inquiry] ${organization}`, emailHtml)
    } catch (emailErr) {
      console.error('Failed to notify Funding Lead:', emailErr)
    }

    res.status(201).json({ message: 'Sponsorship interest received. Our partnerships team will follow up shortly.' })
  } catch (err) {
    next(err)
  }
}
