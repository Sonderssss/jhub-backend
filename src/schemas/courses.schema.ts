import { z } from 'zod'

export const listQuerySchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(50).default(12),
  category: z.string().optional(),
  mode:     z.enum(['IN_PERSON','ONLINE','HYBRID']).optional(),
  status:   z.enum(['UPCOMING','OPEN','IN_PROGRESS','CLOSED','COMPLETED']).optional(),
  featured: z.coerce.boolean().optional(),
  search:   z.string().optional(),
})

export const enrollSchema = z.object({
  cohortId: z.string().uuid().optional(),
  notes:    z.string().optional(),
})

export const interestSchema = z.object({
  name:                  z.string().min(1),
  email:                 z.string().email(),
  phone:                 z.string().min(5),
  courseId:              z.string().uuid(),
  preferredCohort:       z.string().min(1),
  preferredLearningMode: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']),
  eligibilityDetails:    z.string().min(10),
  paymentReadiness:      z.coerce.boolean().default(false),
})

export const createCourseSchema = z.object({
  title:         z.string().min(3),
  description:   z.string().min(10),
  category:      z.string().min(1),
  deliveryMode:  z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']),
  durationWeeks: z.coerce.number().optional(),
  prerequisites: z.string().optional(),
  coverImageUrl: z.string().optional().or(z.literal('')),
  isFeatured:    z.coerce.boolean().default(false),
  isPublished:   z.coerce.boolean().default(false),
})

export const updateCourseSchema = z.object({
  title:         z.string().min(3).optional(),
  description:   z.string().min(10).optional(),
  category:      z.string().min(1).optional(),
  deliveryMode:  z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']).optional(),
  durationWeeks: z.coerce.number().optional(),
  prerequisites: z.string().optional(),
  coverImageUrl: z.string().optional().or(z.literal('')),
  isFeatured:    z.coerce.boolean().optional(),
  isPublished:   z.coerce.boolean().optional(),
})

export const createCohortSchema = z.object({
  name:               z.string().min(1),
  status:             z.enum(['UPCOMING', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'COMPLETED']).default('UPCOMING'),
  startDate:          z.string().datetime().optional(),
  endDate:            z.string().datetime().optional(),
  maxCapacity:        z.coerce.number().optional(),
  enrollmentDeadline: z.string().datetime().optional(),
  zoomLink:           z.string().url().optional().or(z.literal('')),
  location:           z.string().optional(),
})

export const createLessonSchema = z.object({
  title:       z.string().min(1),
  content:     z.string().optional(),
  videoUrl:    z.string().url().optional().or(z.literal('')),
  order:       z.coerce.number().int().min(1),
  isPublished: z.coerce.boolean().default(true),
})
