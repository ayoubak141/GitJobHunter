import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { Env } from './types'
import { openAPISpec } from './swagger'
import getPrismaClient from './db'
import { getDiscordConfig } from './services/discord'
import { feedRoutes } from './routes/feeds'
import { configRoutes } from './routes/config'
import { jobRoutes } from './routes/jobs'
import { processJobs } from './services/jobProcessor'

// Cloudflare Worker types for scheduled events
interface ScheduledController {
  readonly scheduledTime: Date
  readonly cron: string
  noRetry(): void
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void
  passThroughOnException(): void
}

const app = new Hono<{ Bindings: Env }>()

// Database middleware - initialize database connection
app.use('*', async (c, next) => {
  try {
    const db = getPrismaClient(c.env)
    c.env.db = db
  } catch (error) {
    console.error('Database initialization failed:', error)
    return c.json({ error: 'Database connection failed' }, 500)
  }
  await next()
})

// CORS middleware to handle cross-origin requests from frontend
app.use('*', async (c, next) => {
  // Handle preflight OPTIONS requests
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
      },
    })
  }
  
  // Add CORS headers to all responses
  await next()
  
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
})

// Health check endpoint uses database connection

// Health check endpoint
app.get('/health', async (c) => {
  const discordConfig = await getDiscordConfig(c.env.db!)
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: 'connected',
    discord: {
      configured: !!discordConfig,
      enabled: discordConfig?.enabled || false
    }
  })
})

// Swagger UI documentation
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

// OpenAPI specification endpoint
app.get('/openapi.json', (c) => {
  return c.json(openAPISpec)
})

// Mount route modules
app.route('/feeds', feedRoutes)
app.route('/config', configRoutes)
app.route('/jobs', jobRoutes)

// Error handler
app.onError((err, c) => {
  console.error('Application error:', err)
  return c.json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Scheduled event handler for cron triggers
export default {
  // Handle HTTP requests
  fetch: app.fetch.bind(app),
  
  // Handle scheduled events (cron triggers)
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Cron trigger fired at:', new Date().toISOString())
    
    try {
      // Initialize database connection for scheduled job
      const db = getPrismaClient(env)
      env.db = db
      
      // Process all job feeds
      const result = await processJobs(env)
      console.log('Scheduled job processing completed:', result)
    } catch (error) {
      console.error('Scheduled job processing failed:', error)
      // Don't throw to avoid marking the cron execution as failed
      // The error is logged for monitoring purposes
    }
  }
}
