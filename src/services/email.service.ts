import { Resend } from 'resend'
import { RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO } from '../config/env.js'

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!resend) {
    console.warn('Resend mailer is not configured. Email notification skipped.')
    return null
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM || 'inquiries@jhubafrica.com',
      to,
      reply_to: EMAIL_REPLY_TO || undefined,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send email via Resend:', error)
      throw error
    }

    return data
  } catch (err) {
    console.error('Error sending email:', err)
    throw err
  }
}

export async function sendAdminNotification(subject: string, htmlContent: string) {
  return sendEmail({
    to: EMAIL_FROM || 'team@jhubafrica.com',
    subject,
    html: htmlContent,
  })
}

export async function sendInnovationLeadNotification(subject: string, htmlContent: string) {
  return sendEmail({
    to: 'innovation-lead@jhubafrica.com',
    subject,
    html: htmlContent,
  })
}

export async function sendFundingLeadNotification(subject: string, htmlContent: string) {
  return sendEmail({
    to: 'funding-lead@jhubafrica.com',
    subject,
    html: htmlContent,
  })
}

export async function sendPartnershipsLeadNotification(subject: string, htmlContent: string) {
  return sendEmail({
    to: 'partnerships-lead@jhubafrica.com',
    subject,
    html: htmlContent,
  })
}

export async function sendCoursesCoordinatorNotification(subject: string, htmlContent: string) {
  return sendEmail({
    to: 'courses-coordinator@jhubafrica.com',
    subject,
    html: htmlContent,
  })
}

export async function sendEventsCoordinatorNotification(subject: string, htmlContent: string) {
  return sendEmail({
    to: 'events-coordinator@jhubafrica.com',
    subject,
    html: htmlContent,
  })
}

export async function sendSecretariatNotification(subject: string, htmlContent: string) {
  return sendEmail({
    to: 'secretariat@jhubafrica.com',
    subject,
    html: htmlContent,
  })
}
