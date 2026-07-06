import { compileBaseLayout } from './base.layout.js'

export interface InquiryEmailOptions {
  name: string
  email: string
  phone?: string
  category: string
  subject: string
  message: string
}

export function compileInquiryEmail(options: InquiryEmailOptions): string {
  const { name, email, phone, category, subject, message } = options

  const contentHtml = `
    <h2 style="margin-top: 0; margin-bottom: 8px; color: #0f172a; font-size: 20px; font-weight: 700;">New Inquiry Received</h2>
    <p style="margin-top: 0; margin-bottom: 24px; color: #64748b; font-size: 15px; line-height: 1.5;">An inquiry has been submitted via the contact form on the website. Here are the submission details:</p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #475569; width: 120px;">Name</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #475569;">Email Address</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a;"><a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #475569;">Phone</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a;">${phone || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #475569;">Category</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a;"><span style="background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${category}</span></td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #475569;">Subject</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; font-weight: 500;">${subject}</td>
      </tr>
    </table>

    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 8px;">Message Content</div>
      <div style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">${message}</div>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <a href="mailto:${email}?subject=RE: [JHUB Inquiry] ${encodeURIComponent(subject)}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);">
            Reply to Inquirer
          </a>
        </td>
      </tr>
    </table>
  `

  return compileBaseLayout({
    title: `Inquiry: ${subject}`,
    preheader: `New contact form submission from ${name}`,
    contentHtml
  })
}
