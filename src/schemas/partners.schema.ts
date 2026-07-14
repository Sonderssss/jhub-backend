import { z } from 'zod'

export const partnerApplicationSchema = z.object({
  organizationName:     z.string().min(1),
  partnershipType:      z.string().min(1),
  sector:               z.string().min(1),
  proposedCollaboration: z.string().min(10),
  expectedTimeline:      z.string().min(1),
  contactName:          z.string().min(1),
  contactEmail:         z.string().email(),
  contactPhone:         z.string().min(5),
})

export const partnerSponsorSchema = z.object({
  sponsorName:            z.string().min(1),
  sponsorEmail:           z.string().email(),
  organization:           z.string().min(1),
  interestArea:           z.string().min(1),
  innovationId:           z.string().uuid().optional(),
  sponsorshipType:        z.string().min(1),
  budgetRange:            z.string().optional().or(z.literal('')),
  expectedOutcome:        z.string().min(10),
  preferredContactMethod: z.enum(['email', 'phone', 'whatsapp']),
  message:                z.string().optional(),
})

export const createPartnerProfileSchema = z.object({
  name:        z.string().min(1),
  type:        z.enum(['INDUSTRY', 'ACADEMIC', 'GOVERNMENT', 'NGO', 'FUNDER', 'MEDIA']),
  logoUrl:     z.string().url().optional().or(z.literal('')),
  website:     z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  isFeatured:  z.coerce.boolean().default(false),
  isActive:    z.coerce.boolean().default(true),
})

export const updatePartnerSchema = createPartnerProfileSchema.partial()

export const createSponsorshipSchema = z.object({
  innovationId: z.string().uuid(),
  amount:       z.coerce.number().optional(),
  currency:     z.string().default('KES'),
  description:  z.string().optional(),
  startDate:    z.string().datetime().optional(),
  endDate:      z.string().datetime().optional(),
})

export const updateApplicationSchema = z.object({
  status:      z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional().or(z.literal('')),
})
