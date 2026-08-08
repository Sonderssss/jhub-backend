import { z } from 'zod'

export const listQuerySchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(50).default(12),
  type:     z.enum(['HACKATHON','WORKSHOP','SEMINAR','CONFERENCE','WEBINAR','NETWORKING','OTHER']).optional(),
  upcoming: z.coerce.boolean().optional(),
  past:     z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
})

export const rsvpSchema = z.object({
  guestName:                 z.string().min(1),
  guestEmail:                z.string().email(),
  guestPhone:                z.string().min(5),
  affiliation:               z.string().min(1),
  dietaryRequirements:       z.string().optional().or(z.literal('')),
  accessibilityRequirements: z.string().optional().or(z.literal('')),
  marketingConsent:          z.coerce.boolean().default(false),
})

export const eventProposalSchema = z.object({
  organizerName:  z.string().min(1),
  organizerEmail: z.string().email(),
  organization:   z.string().optional(),
  eventTitle:     z.string().min(3),
  eventType:      z.enum(['HACKATHON','WORKSHOP','SEMINAR','CONFERENCE','WEBINAR','NETWORKING','OTHER']),
  description:    z.string().min(20),
  proposedDate:   z.string().datetime().optional(),
  expectedAttendees: z.coerce.number().optional(),
  message:        z.string().optional(),
})

export const createEventSchema = z.object({
  title:           z.string().min(3),
  description:     z.string().min(10),
  type:            z.enum(['HACKATHON', 'WORKSHOP', 'SEMINAR', 'CONFERENCE', 'WEBINAR', 'NETWORKING', 'OTHER']),
  status:          z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).default('DRAFT'),
  isFeatured:      z.coerce.boolean().default(false),
  startDate:       z.string().datetime(),
  endDate:         z.string().datetime().optional(),
  location:        z.string().optional(),
  isOnline:        z.coerce.boolean().default(false),
  meetingUrl:      z.string().url().optional().or(z.literal('')),
  maxCapacity:     z.coerce.number().optional(),
  registrationUrl: z.string().url().optional().or(z.literal('')),
  registrationDeadline: z.string().datetime().optional(),
  coverImageUrl:   z.string().optional().or(z.literal('')),
})

export const updateEventSchema = createEventSchema.partial()
