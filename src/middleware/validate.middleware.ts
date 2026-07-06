import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

type ValidateTarget = 'body' | 'query' | 'params'

export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target])

    if (!result.success) {
      const errors = formatZodErrors(result.error)
      return res.status(422).json({
        error: 'Validation failed',
        details: errors,
      })
    }

    // Replace raw input with the parsed (and coerced) data
    req[target] = result.data as typeof req[typeof target]
    next()
  }
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((acc, issue) => {
    const path = issue.path.join('.') || 'root'
    if (!acc[path]) acc[path] = []
    acc[path].push(issue.message)
    return acc
  }, {})
}
