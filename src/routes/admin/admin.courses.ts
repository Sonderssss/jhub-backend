import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { updateCourseSchema, createCourseSchema, createCohortSchema, createLessonSchema } from '../../schemas/courses.schema.js'
import { createCourse, updateCourse, deleteCourse, createCohort, createLesson, getAdminCourses } from '../../controllers/admin/courses.controller.js'

const router = Router()

// GET /
router.get('/', getAdminCourses)

// POST /
router.post('/', validate(createCourseSchema), createCourse)

// PATCH /:id
router.patch('/:id', validate(updateCourseSchema), updateCourse)

// DELETE /:id
router.delete('/:id', deleteCourse)

// POST /:id/cohorts
router.post('/:id/cohorts', validate(createCohortSchema), createCohort)

// POST /:id/lessons
router.post('/:id/lessons', validate(createLessonSchema), createLesson)

export default router
