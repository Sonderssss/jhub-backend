import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../../config/supabase.js'
import { NotFoundError } from '../../middleware/error.middleware.js'

export async function updateSubmissionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status } = req.body

    const { data, error } = await supabaseAdmin
      .from('innovations')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new NotFoundError('Innovation')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function toggleFeatured(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const is_featured = req.body.isFeatured !== undefined ? req.body.isFeatured : true

    const { data, error } = await supabaseAdmin
      .from('innovations')
      .update({ is_featured })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new NotFoundError('Innovation')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}
