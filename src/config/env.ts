// import { z } from 'zod'
import dotenv from 'dotenv'
// import path from 'path'
// import fs from 'fs'

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });
dotenv.config(); // Fallback to default .env if local env file doesn't exist

const {
  NODE_ENV,
  PORT,
  API_VERSION,
  CORS_ORIGINS,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  RESEND_API_KEY,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS } = process.env;

export {
  NODE_ENV,
  PORT,
  API_VERSION,
  CORS_ORIGINS,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  RESEND_API_KEY,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS
}
// // Load environment variables in order of priority (highest priority first)
// const envFiles = [
//   `.env.${nodeEnv}.local`,
//   `.env.local`,
//   `.env.${nodeEnv}`,
//   '.env',
// ]

// for (const file of envFiles) {
//   const envPath = path.resolve(process.cwd(), file)
//   if (fs.existsSync(envPath)) {
//     dotenv.config({ path: envPath })
//   }
// }

// const envSchema = z.object({
//   // Server
//   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
//   PORT: z.coerce.number().default(4000),
//   API_VERSION: z.string().default('v1'),
//   CORS_ORIGINS: z.string().default('http://localhost:3000'),

//   // Supabase (Required in all environments)
//   SUPABASE_URL: z.string().url(),
//   SUPABASE_ANON_KEY: z.string().min(1),
//   SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
//   DATABASE_URL: z.string().min(1),

//   // Auth (Required in all environments)
//   JWT_SECRET: z.string().min(32),
//   JWT_EXPIRES_IN: z.string().default('7d'),
//   REFRESH_TOKEN_SECRET: z.string().min(32),
//   REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

//   // Upstash Redis (Optional in development, required in production)
//   UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal('')),
//   UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal('')),

//   // Resend (Optional in development, required in production)
//   RESEND_API_KEY: z.string().optional().or(z.literal('')),
//   EMAIL_FROM: z.string().email().optional().or(z.literal('')),
//   EMAIL_REPLY_TO: z.string().email().optional().or(z.literal('')),

//   // Cloudflare R2 (Optional in development, required in production)
//   R2_ACCOUNT_ID: z.string().optional().or(z.literal('')),
//   R2_ACCESS_KEY_ID: z.string().optional().or(z.literal('')),
//   R2_SECRET_ACCESS_KEY: z.string().optional().or(z.literal('')),
//   R2_BUCKET_NAME: z.string().optional().or(z.literal('')),
//   R2_PUBLIC_URL: z.string().url().optional().or(z.literal('')),

//   // Rate Limiting
//   RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
//   RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
// }).superRefine((data, ctx) => {
//   if (data.NODE_ENV === 'production') {
//     const isPresent = (val: any) => val !== undefined && val !== null && val !== ''

//     // Enforce Upstash Redis in production
//     if (!isPresent(data.UPSTASH_REDIS_REST_URL) || !z.string().url().safeParse(data.UPSTASH_REDIS_REST_URL).success) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['UPSTASH_REDIS_REST_URL'],
//         message: 'Required and must be a valid URL in production mode',
//       })
//     }
//     if (!isPresent(data.UPSTASH_REDIS_REST_TOKEN)) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['UPSTASH_REDIS_REST_TOKEN'],
//         message: 'Required in production mode',
//       })
//     }

//     // Enforce Resend in production
//     if (!isPresent(data.RESEND_API_KEY)) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['RESEND_API_KEY'],
//         message: 'Required in production mode',
//       })
//     }
//     if (!isPresent(data.EMAIL_FROM) || !z.string().email().safeParse(data.EMAIL_FROM).success) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['EMAIL_FROM'],
//         message: 'Required and must be a valid email in production mode',
//       })
//     }
//     if (!isPresent(data.EMAIL_REPLY_TO) || !z.string().email().safeParse(data.EMAIL_REPLY_TO).success) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['EMAIL_REPLY_TO'],
//         message: 'Required and must be a valid email in production mode',
//       })
//     }

//     // Enforce Cloudflare R2 in production
//     if (!isPresent(data.R2_ACCOUNT_ID)) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['R2_ACCOUNT_ID'],
//         message: 'Required in production mode',
//       })
//     }
//     if (!isPresent(data.R2_ACCESS_KEY_ID)) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['R2_ACCESS_KEY_ID'],
//         message: 'Required in production mode',
//       })
//     }
//     if (!isPresent(data.R2_SECRET_ACCESS_KEY)) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['R2_SECRET_ACCESS_KEY'],
//         message: 'Required in production mode',
//       })
//     }
//     if (!isPresent(data.R2_BUCKET_NAME)) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['R2_BUCKET_NAME'],
//         message: 'Required in production mode',
//       })
//     }
//     if (!isPresent(data.R2_PUBLIC_URL) || !z.string().url().safeParse(data.R2_PUBLIC_URL).success) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['R2_PUBLIC_URL'],
//         message: 'Required and must be a valid URL in production mode',
//       })
//     }
//   }
// })

// const parsed = envSchema.safeParse(process.env)

// if (!parsed.success) {
//   console.error('❌  Invalid environment variables:')
//   console.error(parsed.error.flatten().fieldErrors)
//   process.exit(1)
// }

// export const env = parsed.data

// export const isDev = env.NODE_ENV === 'development'
// export const isProd = env.NODE_ENV === 'production'