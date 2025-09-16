// Job processing and statistics routes with Prisma database integration
import { Hono } from 'hono'
import { Env } from '../types'
import { processJobs } from '../services/jobProcessor'
import { getJobsStats } from '../services/feeds'

export const jobRoutes = new Hono<{ Bindings: Env }>()

// Process all feeds and find new jobs
jobRoutes.post('/process', async (c) => {
  try {
    const result = await processJobs(c.env)
    return c.json(result)
  } catch (error) {
    return c.json({ 
      error: 'Processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get jobs statistics
jobRoutes.get('/status', async (c) => {
  try {
    const stats = await getJobsStats(c.env.db!)
    return c.json(stats)
  } catch (error) {
    return c.json({ error: 'Failed to fetch jobs statistics' }, 500)
  }
})
