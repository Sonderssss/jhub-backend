import { compileBaseLayout } from './base.layout.js'

export interface RsvpEmailOptions {
  recipientName: string
  eventTitle: string
  eventType: string
  startDate: string
  location?: string | null
  isOnline: boolean
  meetingUrl?: string | null
}

export function compileRsvpEmail(options: RsvpEmailOptions): string {
  const { recipientName, eventTitle, eventType, startDate, location, isOnline, meetingUrl } = options

  const formattedDate = new Date(startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formattedTime = new Date(startDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const contentHtml = `
    <h2 style="margin-top: 0; margin-bottom: 8px; color: #0f172a; font-size: 20px; font-weight: 700;">RSVP Confirmed</h2>
    <p style="margin-top: 0; margin-bottom: 24px; color: #64748b; font-size: 15px; line-height: 1.5;">Hi ${recipientName},</p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #334155; font-size: 15px; line-height: 1.6;">You're on the list! We've registered your RSVP for the upcoming event: <strong>${eventTitle}</strong>.</p>
    
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <h3 style="margin-top: 0; margin-bottom: 16px; color: #0f172a; font-size: 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Event Information</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 120px;">Event Type</td>
          <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 500;">${eventType}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Date</td>
          <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 500;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Time</td>
          <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 500;">${formattedTime}</td>
        </tr>
        ${location ? `
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Venue</td>
          <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 500;">${location}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Format</td>
          <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 500;">${isOnline ? 'Online / Remote' : 'Physical / In-Person'}</td>
        </tr>
      </table>
    </div>

    ${isOnline && meetingUrl ? `
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <h4 style="margin-top: 0; margin-bottom: 8px; color: #1e3a8a; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Webinar Link</h4>
      <p style="margin-top: 0; margin-bottom: 16px; color: #1e3a8a; font-size: 14px;">This is a remote session. Click below to join when the session goes live:</p>
      <a href="${meetingUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);">
        Join Event (Webinar Link)
      </a>
    </div>
    ` : ''}

    <p style="margin-top: 0; margin-bottom: 24px; color: #334155; font-size: 15px; line-height: 1.6;">If you have any questions or require special accommodations, please don't hesitate to reply to this email.</p>
    
    <p style="margin-top: 0; margin-bottom: 0; color: #64748b; font-size: 14px; line-height: 1.5;">We look forward to seeing you there!<br>Warm regards,<br><strong>The JHUB Events Team</strong></p>
  `

  return compileBaseLayout({
    title: `RSVP Confirmed: ${eventTitle}`,
    preheader: `Thank you for RSVPing to ${eventTitle}. We've saved your spot!`,
    contentHtml
  })
}
