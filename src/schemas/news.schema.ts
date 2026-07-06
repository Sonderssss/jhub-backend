import { z } from 'zod'

export const newsQuerySchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(50).default(10),
  category: z.enum(['news','impact-story','partner-story','project-update','announcement']).optional(),
  featured: z.coerce.boolean().optional(),
  search:   z.string().optional(),
  tag:      z.string().optional(),
})
