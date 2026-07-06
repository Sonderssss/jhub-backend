import { z } from 'zod'

export const contactSchema = z.object({
  name:                     z.string().min(1),
  email:                    z.string().email(),
  phone:                    z.string().min(5),
  category:                 z.enum([
    'GENERAL','INNOVATION_SUBMISSION','INCUBATION',
    'PARTNERSHIP','FUNDING','COURSES','EVENTS','MEDIA','OTHER'
  ]).default('GENERAL'),
  subject:                  z.string().min(3).max(200).optional().default('General Inquiry'),
  message:                  z.string().min(10).max(5000),
  preferredResponseChannel: z.enum(['email', 'phone', 'whatsapp']),
})
