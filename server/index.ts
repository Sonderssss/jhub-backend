import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'

import { NODE_ENV, API_VERSION, PORT, CORS_ORIGINS } from '../src/config/env.js'
import { apiLimiter } from '../src/middleware/rateLimiter.middleware.js'
import { errorHandler, notFoundHandler } from '../src/middleware/error.middleware.js'

// ── Route modules ──────────────────────────────────────
import apiRouter from '../src/routes/router.js'
import { supabaseAdmin } from '../src/config/supabase.js'

// ── App ────────────────────────────────────────────────
const app = express()

// ── Security & parsing ─────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: CORS_ORIGINS ? CORS_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// if (isDev) {
//   app.use(morgan('dev'))
// } else {
//   app.use(morgan('combined'))
// }

// ── Global rate limit ──────────────────────────────────
app.use(`/api/${API_VERSION}`, apiLimiter)

// ── Health check ───────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: API_VERSION,
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ── API Routes ─────────────────────────────────────────
app.use(`/api/${API_VERSION}`, apiRouter)

app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to JHUB Africa API',
    version: API_VERSION,
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

app.get('/test-supabase', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')

  if (error) {
    return res.status(500).json(error)
  }

  res.json(data)
})

// ── 404 & error handlers (must be last) ───────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ┌────────────────────────────────────────────────┐
  │  JHUB Africa API                               │
  │  http://localhost:${PORT}                      │
  │                                                │
  │  Environment : ${NODE_ENV}                     │
  │  API version : ${API_VERSION}                  │
  │  Base URL    : /api/${API_VERSION}             │
  └────────────────────────────────────────────────┘
  `)
})

export default app
