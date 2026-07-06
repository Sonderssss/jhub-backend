export interface BaseLayoutOptions {
  title: string
  preheader?: string
  contentHtml: string
}

export function compileBaseLayout({ title, preheader, contentHtml }: BaseLayoutOptions): string {
  const brandColor = '#0f172a' // Slate 900
  const accentColor = '#3b82f6' // Blue 500
  const lightBg = '#f8fafc' // Slate 50
  const textColor = '#334155' // Slate 700

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            padding: 10px !important;
          }
          .content-card {
            padding: 20px !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${lightBg}; color: ${textColor}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      ${preheader ? `<span style="display: none; max-height: 0px; overflow: hidden; font-size: 0px; color: transparent; mso-hide: all;">${preheader}</span>` : ''}
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${lightBg}; padding: 30px 0;">
        <tr>
          <td align="center">
            <table class="container" role="presentation" width="600" cellspacing="0" cellpadding="0" style="width: 600px; margin: 0 auto;">
              <!-- Header -->
              <tr>
                <td style="padding: 0 0 24px 0; text-align: center;">
                  <div style="font-size: 24px; font-weight: 800; color: ${brandColor}; letter-spacing: -0.5px;">
                    JHUB <span style="color: ${accentColor};">Africa</span>
                  </div>
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-top: 4px; font-weight: 600;">
                    Technology & Innovation Hub
                  </div>
                </td>
              </tr>

              <!-- Content Card -->
              <tr>
                <td class="content-card" style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                  ${contentHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 20px 0 20px; text-align: center; font-size: 13px; color: #64748b; line-height: 1.6;">
                  <p style="margin: 0 0 8px 0;">This email was sent from the JHUB Africa platform.</p>
                  <p style="margin: 0 0 16px 0; font-weight: 500;">
                    <a href="mailto:inquiries@jhubafrica.com" style="color: ${accentColor}; text-decoration: none; margin: 0 8px;">Contact Support</a> &bull; 
                    <a href="https://jhub.africa" style="color: ${accentColor}; text-decoration: none; margin: 0 8px;">Visit Website</a>
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} JHUB Africa. Jomo Kenyatta University of Agriculture and Technology (JKUAT), Nairobi, Kenya. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
