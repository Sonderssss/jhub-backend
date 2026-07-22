import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../../config/supabase.js'

export async function createAdminUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, role } = req.body

    // Create user in Supabase Auth via Admin client
    const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { firstName, lastName, role },
    })

    if (error) throw error

    // Sync user profile into public users table
    const { data: profile, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: role.toUpperCase(),
        is_verified: true,
        is_active: true,
      })
      .select()
      .single()

    if (dbError) throw dbError

    res.status(201).json({
      message: 'User account created successfully',
      user: profile
    })
  } catch (err) {
    next(err)
  }
}
