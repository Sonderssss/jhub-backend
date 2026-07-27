import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../../config/supabase.js'
import { NotFoundError } from '../../middleware/error.middleware.js'

export async function createCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const slugify = (await import('slugify')).default
    const slug = slugify(req.body.title, { lower: true, strict: true })

    const { title, description, category, deliveryMode, durationWeeks, prerequisites, coverImageUrl, isFeatured, isPublished } = req.body

    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({
        id: crypto.randomUUID(),
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

export async function updateCourse(req: Request, res: Response, next: NextFunction) {
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

export async function deleteCourse(req: Request, res: Response, next: NextFunction) {
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

export async function createCohort(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: courseId } = req.params
    const { name, status, startDate, endDate, maxCapacity, enrollmentDeadline, zoomLink, location } = req.body

    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .insert({
        id: crypto.randomUUID(),
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

export async function createLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: courseId } = req.params
    const { title, content, videoUrl, order, isPublished } = req.body

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .insert({
        id: crypto.randomUUID(),
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

export async function getAdminCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('id, slug, title, description, category, delivery_mode, duration_weeks, is_featured, is_published, cover_image_url')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ data })
  } catch (err) {
    next(err)
  }
}
