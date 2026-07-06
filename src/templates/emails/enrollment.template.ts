import { compileBaseLayout } from './base.layout.js'

export interface EnrollmentEmailOptions {
  studentName: string
  courseTitle: string
  deliveryMode: string
  durationWeeks?: number | null
  startDate?: string | null
  zoomLink?: string | null
  location?: string | null
}

export function compileEnrollmentEmail(options: EnrollmentEmailOptions): string {
  const { studentName, courseTitle, deliveryMode, durationWeeks, startDate, zoomLink, location } = options

  const formattedDate = startDate ? new Date(startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'To Be Announced'

  const contentHtml = `
    <h2 style="margin-top: 0; margin-bottom: 8px; color: #0f172a; font-size: 20px; font-weight: 700;">Enrollment Confirmed!</h2>
    <p style="margin-top: 0; margin-bottom: 24px; color: #64748b; font-size: 15px; line-height: 1.5;">Dear ${studentName},</p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #334155; font-size: 15px; line-height: 1.6;">Congratulations! You have been successfully enrolled in <strong>${courseTitle}</strong>. We are thrilled to welcome you to this cohort.</p>
    
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <h3 style="margin-top: 0; margin-bottom: 16px; color: #0f172a; font-size: 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Course Details</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 140px;">Delivery Mode</td>
          <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 500;">${deliveryMode}</td>
        </tr>
        ${durationWeeks ? `
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Duration</td>
          <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 500;">${durationWeeks} Weeks</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Start Date</td>
          <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 500;">${formattedDate}</td>
        </tr>
        ${location ? `
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Physical Location</td>
          <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 500;">${location}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${zoomLink ? `
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <h4 style="margin-top: 0; margin-bottom: 8px; color: #065f46; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Virtual Classroom Connection</h4>
      <p style="margin-top: 0; margin-bottom: 16px; color: #065f46; font-size: 14px;">Here is your link to access the live virtual sessions:</p>
      <a href="${zoomLink}" style="background-color: #10b981; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
        Join Class (Zoom)
      </a>
    </div>
    ` : ''}

    <p style="margin-top: 0; margin-bottom: 12px; color: #334155; font-size: 15px; line-height: 1.6;"><strong>Next Steps:</strong></p>
    <ul style="margin-top: 0; margin-bottom: 24px; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      <li style="margin-bottom: 8px;">Ensure you have a reliable internet connection and a working development environment setup (e.g. VS Code, Node.js, Python, or compiler based on your syllabus).</li>
      <li style="margin-bottom: 8px;">Log in to the student portal to access your syllabus, course curriculum, and lesson materials.</li>
      <li style="margin-bottom: 0;">Be on time for the sessions. For physical courses, check in at the Maker Space 10 minutes prior to session start.</li>
    </ul>

    <p style="margin-top: 0; margin-bottom: 0; color: #64748b; font-size: 14px; line-height: 1.5;">We wish you an excellent learning journey!<br>Warm regards,<br><strong>The JHUB Academy Team</strong></p>
  `

  return compileBaseLayout({
    title: `Enrollment Confirmed: ${courseTitle}`,
    preheader: `Welcome to the class, ${studentName}! Your enrollment is complete.`,
    contentHtml
  })
}
