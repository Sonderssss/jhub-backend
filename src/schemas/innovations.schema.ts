import { z } from 'zod'

export const listQuerySchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(50).default(12),
  stage:    z.enum(['IDEA','PROTOTYPE','PILOT','SCALING','MATURE']).optional(),
  sector:   z.string().optional(),
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  search:   z.string().optional(),
})

export const createSchema = z.object({
  title:           z.string().min(3).max(120),
  tagline:         z.string().max(200).optional(),
  description:     z.string().optional(),
  problem:         z.string().min(10),
  solution:        z.string().min(10),
  stage:           z.enum(['IDEA','PROTOTYPE','PILOT','SCALING','MATURE']),
  sector:          z.string().min(1),
  categories:      z.array(z.string()).min(1),
  beneficiaries:   z.string().optional(),
  traction:        z.string().optional(),
  impactEvidence:  z.string().optional(),
  supportRequired: z.string().optional(),
  ownerId:         z.string().uuid().optional(),
  coverImageUrl:   z.string().optional().or(z.literal('')),
  teamMembers:     z.array(z.object({
    name: z.string().min(1),
    role: z.string().min(1)
  })).optional(),
})

export const submitSchema = z.object({
  contactName:     z.string().min(1),
  contactEmail:    z.string().email(),
  phone:           z.string().min(5),
  title:           z.string().min(3),
  sector:          z.string().min(1),
  stage:           z.enum(['IDEA', 'PROTOTYPE', 'PILOT', 'SCALING', 'MATURE']),
  problem:         z.string().min(10),
  solution:        z.string().min(10),
  supportRequired: z.string().min(5),
  teamInfo:        z.string().min(5),
  projectLinks:    z.string().optional().or(z.literal('')),
  attachmentUrl:   z.string().url().optional().or(z.literal('')),
  innovationId:    z.string().uuid().optional(),
})

export const updateInnovationStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']),
})
