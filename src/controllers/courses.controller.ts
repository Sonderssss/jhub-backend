import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { withCache, CacheKey, CacheTTL } from '../config/redis.js'
import { NotFoundError, ConflictError } from '../middleware/error.middleware.js'

export async function getCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, category, mode, featured, search } = req.query as any
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
}

export async function getFeaturedCourses(req: Request, res: Response, next: NextFunction) {
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
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
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
}

export async function getCourseBySlug(req: Request, res: Response, next: NextFunction) {
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
}

export async function enroll(req: Request, res: Response, next: NextFunction) {
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
        id:        crypto.randomUUID(),
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

export async function getProgress(req: Request, res: Response, next: NextFunction) {
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

export async function registerInterest(req: Request, res: Response, next: NextFunction) {
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
      id:                      crypto.randomUUID(),
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
