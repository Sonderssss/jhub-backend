import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'
import { formLimiter } from '../middleware/rateLimiter.middleware.js'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { withCache, CacheKey, CacheTTL } from '../config/redis.js'
import { NotFoundError, ConflictError } from '../middleware/error.middleware.js'
import { listQuerySchema, enrollSchema, interestSchema, createCourseSchema, updateCourseSchema, createCohortSchema, createLessonSchema } from '../schemas/courses.schema.js'

const router = Router()

// ── GET /courses ───────────────────────────────────────
router.get('/', validate(listQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, category, mode, featured, search, status } = req.query as any
    const offset = (page - 1) * limit

    let query = supabase
      .from('courses')
      .select(`
        id, slug, title, description, category, delivery_mode,
        duration_weeks, is_featured, cover_image_url,
        cohorts(id, name, status, start_date, end_date, max_capacity, enrollment_deadline)
      `, { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) query = query.eq('category', category)
    if (mode)     query = query.eq('delivery_mode', mode)
    if (featured) query = query.eq('is_featured', true)
    if (search)   query = query.ilike('title', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error

    res.json({
      data,
      meta: { page, limit, total: count, totalPages: Math.ceil((count ?? 0) / limit) },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /courses/featured ──────────────────────────────
router.get('/featured', async (req, res, next) => {
  try {
    const data = await withCache(CacheKey.courses('featured'), CacheTTL.medium, async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, slug, title, category, delivery_mode, cover_image_url, cohorts(status)')
        .eq('is_published', true)
        .eq('is_featured', true)
        .limit(6)
      if (error) throw error
      return data
    })
    res.json({ data })
  } catch (err) {
    next(err)
  }
})

// ── GET /courses/categories ────────────────────────────
router.get('/categories', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('category')
      .eq('is_published', true)
    if (error) throw error

    const categories = [...new Set(data.map((c: any) => c.category))].sort()
    res.json({ data: categories })
  } catch (err) {
    next(err)
  }
})

// ── GET /courses/:slug ─────────────────────────────────
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params
    const data = await withCache(CacheKey.courses(slug), CacheTTL.medium, async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          cohorts(*),
          lessons(id, title, order, is_published)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single()
      if (error) return null
      return data
    })
    if (!data) throw new NotFoundError('Course')
    res.json({ data })
  } catch (err) {
    next(err)
  }
})

// ── POST /courses/:id/enroll ───────────────────────────
router.post(
  '/:id/enroll',
  requireAuth,
  validate(enrollSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const userId = req.user!.sub

      // Check for existing enrollment
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('course_id', id)
        .eq('user_id', userId)
        .single()

      if (existing) {
        throw new ConflictError(`Already enrolled (status: ${existing.status})`)
      }

      const { data, error } = await supabaseAdmin
        .from('enrollments')
        .insert({
          user_id:   userId,
          course_id: id,
          cohort_id: req.body.cohortId ?? null,
          status:    'PENDING',
        })
        .select()
        .single()

      if (error) throw error

      // Retrieve user, course, and cohort details for the confirmation email
      try {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email, first_name, last_name')
          .eq('id', userId)
          .single()

        const { data: course } = await supabaseAdmin
          .from('courses')
          .select('title, delivery_mode, duration_weeks')
          .eq('id', id)
          .single()

        let cohort = null
        if (req.body.cohortId) {
          const { data: cohortData } = await supabaseAdmin
            .from('cohorts')
            .select('name, start_date, zoom_link, location')
            .eq('id', req.body.cohortId)
            .single()
          cohort = cohortData
        }

        if (user && course) {
          const { compileEnrollmentEmail } = await import('../templates/emails/enrollment.template.js')
          const { sendEmail } = await import('../services/email.service.js')

          const studentName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Student'
          const emailHtml = compileEnrollmentEmail({
            studentName,
            courseTitle: course.title,
            deliveryMode: course.delivery_mode,
            durationWeeks: course.duration_weeks,
            startDate: cohort?.start_date,
            zoomLink: cohort?.zoom_link,
            location: cohort?.location,
          })

          await sendEmail({
            to: user.email,
            subject: `Enrollment Confirmed: ${course.title}`,
            html: emailHtml,
          })
        }
      } catch (emailErr) {
        console.error('Failed to send enrollment email confirmation:', emailErr)
      }

      res.status(201).json({ message: 'Enrollment submitted for review.', data })
    } catch (err) {
      next(err)
    }
  }
)

// ── GET /courses/:id/progress ──────────────────────────
router.get(
  '/:id/progress',
  requireAuth,
  async (req, res, next) => {
    try {
      const { id } = req.params
      const userId = req.user!.sub

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select(`
          id, status, completed_at,
          lesson_progress(lesson_id, completed_at)
        `)
        .eq('course_id', id)
        .eq('user_id', userId)
        .single()

      if (!enrollment) throw new NotFoundError('Enrollment')

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, order')
        .eq('course_id', id)
        .eq('is_published', true)
        .order('order')

      const completedIds = new Set(
        (enrollment.lesson_progress ?? []).filter((p: any) => p.completed_at).map((p: any) => p.lesson_id)
      )
      const totalLessons = lessons?.length ?? 0
      const completedLessons = completedIds.size
      const percentComplete = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      res.json({
        data: {
          enrollment,
          lessons: lessons?.map((l: any) => ({ ...l, completed: completedIds.has(l.id) })),
          progress: { totalLessons, completedLessons, percentComplete },
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /courses/interest — no-account interest form ──
router.post(
  '/interest',
  formLimiter,
  validate(interestSchema),
  async (req, res, next) => {
    try {
      const { name, email, phone, courseId, preferredCohort, preferredLearningMode, eligibilityDetails, paymentReadiness } = req.body

      const structuredMessage = `
Preferred Cohort: ${preferredCohort}
Learning Mode: ${preferredLearningMode}
Payment Readiness: ${paymentReadiness ? 'Yes' : 'No'}
Eligibility details:
${eligibilityDetails}
      `.trim()

      // Store in contact_inquiries with COURSES category
      const { error } = await supabaseAdmin.from('contact_inquiries').insert({
        name,
        email,
        phone,
        category: 'COURSES',
        subject:  `Course interest: ${courseId}`,
        message:  structuredMessage,
        course_id:               courseId,
        preferred_cohort:        preferredCohort,
        preferred_learning_mode: preferredLearningMode,
        eligibility_details:     eligibilityDetails,
        payment_readiness:       paymentReadiness,
      })
      if (error) throw error

      // Notify Training & Courses Coordinator using professional template
      try {
        let courseTitle = 'Unknown Course'
        const { data: course } = await supabaseAdmin
          .from('courses')
          .select('title')
          .eq('id', courseId)
          .single()
        if (course) courseTitle = course.title

        const { compileCourseInterestLeadEmail } = await import('../templates/emails/leads.templates.js')
        const { sendCoursesCoordinatorNotification } = await import('../services/email.service.js')

        const emailHtml = compileCourseInterestLeadEmail({
          courseTitle,
          preferredCohort,
          preferredLearningMode,
          eligibilityDetails,
          name,
          email,
          phone,
          paymentReadiness,
        })

        await sendCoursesCoordinatorNotification(`[Course Interest] ${courseTitle}`, emailHtml)
      } catch (emailErr) {
        console.error('Failed to notify Courses Coordinator:', emailErr)
      }

      res.status(201).json({ message: 'Interest registered. We will be in touch soon.' })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /courses ──────────────────────────────────────
router.post(
  '/',
  validate(createCourseSchema),
  async (req, res, next) => {
    try {
      const slugify = (await import('slugify')).default
      const slug = slugify(req.body.title, { lower: true, strict: true })

      const { title, description, category, deliveryMode, durationWeeks, prerequisites, coverImageUrl, isFeatured, isPublished } = req.body

      const { data, error } = await supabaseAdmin
        .from('courses')
        .insert({
          slug,
          title,
          description,
          category,
          delivery_mode: deliveryMode,
          duration_weeks: durationWeeks,
          prerequisites,
          cover_image_url: coverImageUrl,
          is_featured: isFeatured,
          is_published: isPublished,
        })
        .select()
        .single()

      if (error) throw error
      res.status(201).json({ data })
    } catch (err) {
      next(err)
    }
  }
)

// ── PATCH /courses/:id — admin update ──────────────────
router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(updateCourseSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { title, description, category, deliveryMode, durationWeeks, prerequisites, coverImageUrl, isFeatured, isPublished } = req.body

      // Prepare updates mapping to db columns
      const updates: any = {}
      if (title !== undefined) {
        updates.title = title
        const slugify = (await import('slugify')).default
        updates.slug = slugify(title, { lower: true, strict: true })
      }
      if (description !== undefined) updates.description = description
      if (category !== undefined) updates.category = category
      if (deliveryMode !== undefined) updates.delivery_mode = deliveryMode
      if (durationWeeks !== undefined) updates.duration_weeks = durationWeeks
      if (prerequisites !== undefined) updates.prerequisites = prerequisites
      if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl
      if (isFeatured !== undefined) updates.is_featured = isFeatured
      if (isPublished !== undefined) updates.is_published = isPublished

      const { data, error } = await supabaseAdmin
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error || !data) throw new NotFoundError('Course')
      res.json({ data })
    } catch (err) {
      next(err)
    }
  }
)

// ── DELETE /courses/:id — admin delete ─────────────────
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { error } = await supabaseAdmin
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) throw error
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /courses/:id/cohorts — admin create cohort ────
router.post(
  '/:id/cohorts',
  requireAuth,
  requireRole('admin'),
  validate(createCohortSchema),
  async (req, res, next) => {
    try {
      const { id: courseId } = req.params
      const { name, status, startDate, endDate, maxCapacity, enrollmentDeadline, zoomLink, location } = req.body

      const { data, error } = await supabaseAdmin
        .from('cohorts')
        .insert({
          course_id: courseId,
          name,
          status,
          start_date: startDate,
          end_date: endDate,
          max_capacity: maxCapacity,
          enrollment_deadline: enrollmentDeadline,
          zoom_link: zoomLink,
          location,
        })
        .select()
        .single()

      if (error) throw error
      res.status(201).json({ data })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /courses/:id/lessons — admin create lesson ────
router.post(
  '/:id/lessons',
  requireAuth,
  requireRole('admin'),
  validate(createLessonSchema),
  async (req, res, next) => {
    try {
      const { id: courseId } = req.params
      const { title, content, videoUrl, order, isPublished } = req.body

      const { data, error } = await supabaseAdmin
        .from('lessons')
        .insert({
          course_id: courseId,
          title,
          content,
          video_url: videoUrl,
          order,
          is_published: isPublished,
        })
        .select()
        .single()

      if (error) throw error
      res.status(201).json({ data })
    } catch (err) {
      next(err)
    }
  }
)

export default router
