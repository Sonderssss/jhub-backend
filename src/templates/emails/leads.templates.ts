import { compileBaseLayout } from './base.layout.js'

// Helper to compile details tables in leads emails
function compileDetailsTable(rows: { label: string; value: string }[]): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
      ${rows.map(row => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #475569; width: 180px; vertical-align: top;">${row.label}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; vertical-align: top;">${row.value}</td>
        </tr>
      `).join('')}
    </table>
  `
}

export function compileInnovationSubmissionLeadEmail(data: {
  contactName: string
  contactEmail: string
  phone: string
  title: string
  sector: string
  stage: string
  problem: string
  solution: string
  supportRequired: string
  teamInfo: string
  projectLinks?: string
  attachmentUrl?: string
}): string {
  const table = compileDetailsTable([
    { label: 'Innovator Name', value: data.contactName },
    { label: 'Email Address', value: `<a href="mailto:${data.contactEmail}" style="color: #3b82f6; text-decoration: none;">${data.contactEmail}</a>` },
    { label: 'Phone Number', value: data.phone },
    { label: 'Project Name', value: data.title },
    { label: 'Sector', value: data.sector },
    { label: 'Development Stage', value: `<span style="background-color: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${data.stage}</span>` },
    { label: 'Team Info', value: data.teamInfo },
    { label: 'Project Links', value: data.projectLinks ? `<a href="${data.projectLinks}" style="color: #3b82f6; text-decoration: none;">${data.projectLinks}</a>` : 'N/A' },
    { label: 'Attachment Link', value: data.attachmentUrl ? `<a href="${data.attachmentUrl}" style="color: #3b82f6; text-decoration: none;">View File</a>` : 'N/A' }
  ])

  const contentHtml = `
    <h2 style="margin-top: 0; margin-bottom: 8px; color: #0f172a; font-size: 20px; font-weight: 700;">New Innovation Submission</h2>
    <p style="margin-top: 0; margin-bottom: 24px; color: #64748b; font-size: 15px; line-height: 1.5;">Dear Innovation Program Lead,</p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #334155; font-size: 14px; line-height: 1.6;">A new innovative project has been submitted for consideration. Below are the details:</p>
    
    ${table}

    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">Problem Being Addressed</div>
      <div style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">${data.problem}</div>
    </div>

    <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">Proposed Solution</div>
      <div style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">${data.solution}</div>
    </div>

    <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">Support Requested</div>
      <div style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">${data.supportRequired}</div>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="mailto:${data.contactEmail}?subject=RE: Innovation Submission - ${encodeURIComponent(data.title)}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block;">
            Contact Innovator
          </a>
        </td>
      </tr>
    </table>
  `

  return compileBaseLayout({
    title: `Innovation Submission: ${data.title}`,
    preheader: `New innovation submission under stage ${data.stage} from ${data.contactName}`,
    contentHtml
  })
}

export function compileSponsorInquiryLeadEmail(data: {
  sponsorName: string
  sponsorEmail: string
  organization: string
  interestArea: string
  projectTitle?: string
  sponsorshipType: string
  budgetRange?: string
  expectedOutcome: string
  preferredContactMethod: string
  message?: string
}): string {
  const table = compileDetailsTable([
    { label: 'Sponsor Name', value: data.sponsorName },
    { label: 'Email Address', value: `<a href="mailto:${data.sponsorEmail}" style="color: #3b82f6; text-decoration: none;">${data.sponsorEmail}</a>` },
    { label: 'Organization', value: data.organization },
    { label: 'Interest Area', value: data.interestArea },
    { label: 'Project of Interest', value: data.projectTitle || 'General/Undetermined' },
    { label: 'Sponsorship Type', value: data.sponsorshipType },
    { label: 'Budget Range', value: data.budgetRange || 'N/A' },
    { label: 'Preferred Contact Method', value: `<span style="text-transform: capitalize;">${data.preferredContactMethod}</span>` }
  ])

  const contentHtml = `
    <h2 style="margin-top: 0; margin-bottom: 8px; color: #0f172a; font-size: 20px; font-weight: 700;">New Sponsor Inquiry</h2>
    <p style="margin-top: 0; margin-bottom: 24px; color: #64748b; font-size: 15px; line-height: 1.5;">Dear Partnership & Funding Lead,</p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #334155; font-size: 14px; line-height: 1.6;">An investor/funder has expressed interest in supporting our hub projects. Below are the details:</p>
    
    ${table}

    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">Expected Outcome</div>
      <div style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">${data.expectedOutcome}</div>
    </div>

    ${data.message ? `
    <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">Additional Message</div>
      <div style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">${data.message}</div>
    </div>
    ` : ''}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="mailto:${data.sponsorEmail}?subject=RE: Sponsor Inquiry - ${encodeURIComponent(data.organization)}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block;">
            Contact Sponsor
          </a>
        </td>
      </tr>
    </table>
  `

  return compileBaseLayout({
    title: `Sponsor Inquiry: ${data.organization}`,
    preheader: `New sponsorship interest from ${data.sponsorName} (${data.organization})`,
    contentHtml
  })
}

export function compilePartnerInquiryLeadEmail(data: {
  organizationName: string
  partnershipType: string
  sector: string
  proposedCollaboration: string
  expectedTimeline: string
  contactName: string
  contactEmail: string
  contactPhone: string
}): string {
  const table = compileDetailsTable([
    { label: 'Organization Name', value: data.organizationName },
    { label: 'Partnership Type', value: data.partnershipType },
    { label: 'Sector', value: data.sector },
    { label: 'Expected Timeline', value: data.expectedTimeline },
    { label: 'Contact Name', value: data.contactName },
    { label: 'Email Address', value: `<a href="mailto:${data.contactEmail}" style="color: #3b82f6; text-decoration: none;">${data.contactEmail}</a>` },
    { label: 'Phone Number', value: data.contactPhone }
  ])

  const contentHtml = `
    <h2 style="margin-top: 0; margin-bottom: 8px; color: #0f172a; font-size: 20px; font-weight: 700;">New Strategic Partnership Proposal</h2>
    <p style="margin-top: 0; margin-bottom: 24px; color: #64748b; font-size: 15px; line-height: 1.5;">Dear Strategic Partnerships Lead,</p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #334155; font-size: 14px; line-height: 1.6;">An institution has submitted a strategic partnership inquiry. Below are the details:</p>
    
    ${table}

    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">Proposed Collaboration details</div>
      <div style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">${data.proposedCollaboration}</div>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="mailto:${data.contactEmail}?subject=RE: Partnership Proposal - ${encodeURIComponent(data.organizationName)}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block;">
            Contact Partner Representative
          </a>
        </td>
      </tr>
    </table>
  `

  return compileBaseLayout({
    title: `Partnership Inquiry: ${data.organizationName}`,
    preheader: `New partnership proposal from ${data.organizationName} (${data.partnershipType})`,
    contentHtml
  })
}

export function compileCourseInterestLeadEmail(data: {
  courseTitle: string
  preferredCohort: string
  preferredLearningMode: string
  eligibilityDetails: string
  name: string
  email: string
  phone: string
  paymentReadiness: boolean
}): string {
  const table = compileDetailsTable([
    { label: 'Student Name', value: data.name },
    { label: 'Email Address', value: `<a href="mailto:${data.email}" style="color: #3b82f6; text-decoration: none;">${data.email}</a>` },
    { label: 'Phone Number', value: data.phone },
    { label: 'Course of Interest', value: data.courseTitle },
    { label: 'Preferred Cohort', value: data.preferredCohort },
    { label: 'Learning Mode', value: data.preferredLearningMode },
    { label: 'Payment Readiness', value: data.paymentReadiness ? `<span style="color: #059669; font-weight: 600;">Yes (Ready to pay on cohort confirmation)</span>` : `<span style="color: #dc2626;">No / Seeking Scholarship</span>` }
  ])

  const contentHtml = `
    <h2 style="margin-top: 0; margin-bottom: 8px; color: #0f172a; font-size: 20px; font-weight: 700;">New Course Interest Registration</h2>
    <p style="margin-top: 0; margin-bottom: 24px; color: #64748b; font-size: 15px; line-height: 1.5;">Dear Training & Courses Coordinator,</p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #334155; font-size: 14px; line-height: 1.6;">A user has registered interest for an upcoming cohort/course. Below are the details:</p>
    
    ${table}

    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">Eligibility details</div>
      <div style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">${data.eligibilityDetails}</div>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="mailto:${data.email}?subject=RE: Course Interest - ${encodeURIComponent(data.courseTitle)}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block;">
            Contact Student
          </a>
        </td>
      </tr>
    </table>
  `

  return compileBaseLayout({
    title: `Course Interest: ${data.courseTitle}`,
    preheader: `Course interest from ${data.name} for ${data.courseTitle}`,
    contentHtml
  })
}

export function compileEventRegistrationLeadEmail(data: {
  eventTitle: string
  guestName: string
  guestEmail: string
  guestPhone: string
  affiliation: string
  dietaryRequirements?: string
  accessibilityRequirements?: string
  marketingConsent: boolean
}): string {
  const table = compileDetailsTable([
    { label: 'Attendee Name', value: data.guestName },
    { label: 'Email Address', value: `<a href="mailto:${data.guestEmail}" style="color: #3b82f6; text-decoration: none;">${data.guestEmail}</a>` },
    { label: 'Phone Number', value: data.guestPhone },
    { label: 'Event Name', value: data.eventTitle },
    { label: 'Affiliation / Role', value: data.affiliation },
    { label: 'Dietary Requirements', value: data.dietaryRequirements || 'None' },
    { label: 'Accessibility Accommodations', value: data.accessibilityRequirements || 'None' },
    { label: 'Future Updates Consent', value: data.marketingConsent ? `<span style="color: #059669; font-weight: 600;">Consented</span>` : `<span style="color: #64748b;">Not Consented</span>` }
  ])

  const contentHtml = `
    <h2 style="margin-top: 0; margin-bottom: 8px; color: #0f172a; font-size: 20px; font-weight: 700;">New Event Registration</h2>
    <p style="margin-top: 0; margin-bottom: 24px; color: #64748b; font-size: 15px; line-height: 1.5;">Dear Events Coordinator,</p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #334155; font-size: 14px; line-height: 1.6;">An attendee has registered for your event. Below are the registration details:</p>
    
    ${table}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
      <tr>
        <td align="center">
          <a href="mailto:${data.guestEmail}?subject=RE: Event Registration - ${encodeURIComponent(data.eventTitle)}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block;">
            Email Attendee
          </a>
        </td>
      </tr>
    </table>
  `

  return compileBaseLayout({
    title: `Event RSVP: ${data.eventTitle}`,
    preheader: `New RSVP from ${data.guestName} for ${data.eventTitle}`,
    contentHtml
  })
}

export function compileGeneralContactLeadEmail(data: {
  category: string
  subject: string
  message: string
  name: string
  email: string
  phone: string
  preferredResponseChannel: string
}): string {
  const table = compileDetailsTable([
    { label: 'Sender Name', value: data.name },
    { label: 'Email Address', value: `<a href="mailto:${data.email}" style="color: #3b82f6; text-decoration: none;">${data.email}</a>` },
    { label: 'Phone Number', value: data.phone },
    { label: 'Inquiry Category', value: `<span style="background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${data.category}</span>` },
    { label: 'Subject', value: data.subject },
    { label: 'Preferred Contact Channel', value: `<span style="text-transform: capitalize;">${data.preferredResponseChannel}</span>` }
  ])

  const contentHtml = `
    <h2 style="margin-top: 0; margin-bottom: 8px; color: #0f172a; font-size: 20px; font-weight: 700;">General Inquiry Submitted</h2>
    <p style="margin-top: 0; margin-bottom: 24px; color: #64748b; font-size: 15px; line-height: 1.5;">Dear Secretariat,</p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #334155; font-size: 14px; line-height: 1.6;">A user has submitted a general inquiry. Below are the details:</p>
    
    ${table}

    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">Inquiry Message</div>
      <div style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">${data.message}</div>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="mailto:${data.email}?subject=RE: [Secretariat Inquiry] ${encodeURIComponent(data.subject)}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block;">
            Respond to Sender
          </a>
        </td>
      </tr>
    </table>
  `

  return compileBaseLayout({
    title: `Inquiry: ${data.subject}`,
    preheader: `New general contact inquiry category ${data.category} from ${data.name}`,
    contentHtml
  })
}
