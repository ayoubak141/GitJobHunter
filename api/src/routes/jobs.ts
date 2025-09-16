// Job processing and statistics routes with Prisma database integration
import { Hono } from 'hono'
import { Env, JobsQueryParams, PaginatedJobsResponse, JobEntry } from '../types'
import { processJobs } from '../services/jobProcessor'
import { getJobsStats } from '../services/feeds'

// Input validation and sanitization
function validateAndSanitizeParams(query: JobsQueryParams): {
  valid: boolean
  errors: string[]
  sanitized: JobsQueryParams
} {
  const errors: string[] = []
  const sanitized: JobsQueryParams = {}
  
  // Validate and sanitize pagination
  const page = parseInt(query.page || '1')
  const limit = parseInt(query.limit || '10')
  
  if (isNaN(page) || page < 1) {
    errors.push('Page must be a positive integer')
  } else if (page > 10000) {
    errors.push('Page number too large (max 10000)')
  } else {
    sanitized.page = page.toString()
  }
  
  if (isNaN(limit) || limit < 1 || limit > 100) {
    errors.push('Limit must be between 1 and 100')
  } else {
    sanitized.limit = limit.toString()
  }
  
  // Sanitize search term
  if (query.search) {
    const search = query.search.trim()
    if (search.length > 200) {
      errors.push('Search term too long (max 200 characters)')
    } else if (search.length > 0) {
      // Basic XSS protection
      sanitized.search = search.replace(/<[^>]*>/g, '')
    }
  }
  
  // Sanitize source filter
  if (query.source) {
    const source = query.source.trim()
    if (source.length > 100) {
      errors.push('Source filter too long (max 100 characters)')
    } else if (source.length > 0) {
      sanitized.source = source.replace(/<[^>]*>/g, '')
    }
  }
  
  // Sanitize category filter
  if (query.category) {
    const category = query.category.trim()
    if (category.length > 100) {
      errors.push('Category filter too long (max 100 characters)')
    } else if (category.length > 0) {
      sanitized.category = category.replace(/<[^>]*>/g, '')
    }
  }
  
  // Validate date filters
  if (query.dateFrom) {
    const date = new Date(query.dateFrom)
    if (isNaN(date.getTime())) {
      errors.push('Invalid dateFrom format')
    } else {
      sanitized.dateFrom = query.dateFrom
    }
  }
  
  if (query.dateTo) {
    const date = new Date(query.dateTo)
    if (isNaN(date.getTime())) {
      errors.push('Invalid dateTo format')
    } else {
      sanitized.dateTo = query.dateTo
    }
  }
  
  // Validate sorting
  const validSortFields = ['publishedAt', 'processedAt', 'title']
  if (query.sortBy && !validSortFields.includes(query.sortBy)) {
    errors.push('Invalid sortBy field')
  } else {
    sanitized.sortBy = query.sortBy || 'publishedAt'
  }
  
  const validSortOrders = ['asc', 'desc']
  if (query.sortOrder && !validSortOrders.includes(query.sortOrder)) {
    errors.push('Invalid sortOrder')
  } else {
    sanitized.sortOrder = query.sortOrder || 'desc'
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized
  }
}

export const jobRoutes = new Hono<{ Bindings: Env }>()

// Get all jobs with pagination and filters (optimized)
jobRoutes.get('/', async (c) => {
  try {
    const rawQuery = c.req.query() as JobsQueryParams
    
    // Validate and sanitize input parameters
    const validation = validateAndSanitizeParams(rawQuery)
    if (!validation.valid) {
      return c.json({ 
        error: 'Invalid request parameters',
        details: validation.errors
      }, 400)
    }
    
    const query = validation.sanitized
    
    // Parse validated parameters
    const page = parseInt(query.page || '1')
    const limit = parseInt(query.limit || '10')
    const offset = (page - 1) * limit
    const sortBy = query.sortBy || 'publishedAt'
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'
    
    // Build optimized where clause
    const where: any = {}
    
    // Optimized search - use database full-text search if available
    if (query.search) {
      const searchTerm = query.search
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }
    
    // Optimized source filter - exact match for better index usage
    if (query.source) {
      where.source = { equals: query.source, mode: 'insensitive' }
    }
    
    // Optimized category filter with better index usage
    if (query.category) {
      where.feed = {
        category: { equals: query.category, mode: 'insensitive' }
      }
    }
    
    // Date range filters - optimized for index usage
    if (query.dateFrom || query.dateTo) {
      where.publishedAt = {}
      if (query.dateFrom) {
        where.publishedAt.gte = new Date(query.dateFrom)
      }
      if (query.dateTo) {
        where.publishedAt.lte = new Date(query.dateTo)
      }
    }
    
    // Build optimized orderBy clause
    const orderBy: any = {}
    if (sortBy === 'publishedAt' || sortBy === 'processedAt' || sortBy === 'title') {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.publishedAt = 'desc'
    }
    
    // Execute optimized queries in parallel
    const [jobs, totalCount] = await Promise.all([
      c.env.db!.job.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        // Optimized field selection - only fetch needed fields
        select: {
          id: true,
          title: true,
          link: true,
          description: true,
          publishedAt: true,
          processedAt: true,
          source: true,
          hash: true,
          feed: {
            select: {
              name: true,
              source: true,
              category: true
            }
          }
        }
      }),
      c.env.db!.job.count({ where })
    ])
    
    // Transform jobs with minimal processing
    const transformedJobs: JobEntry[] = jobs.map(job => ({
      id: job.id,
      title: job.title,
      link: job.link,
      description: job.description || undefined,
      publishedAt: job.publishedAt.toISOString(),
      processedAt: job.processedAt.toISOString(),
      source: job.source,
      hash: job.hash
    }))
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1
    
    const response: PaginatedJobsResponse = {
      jobs: transformedJobs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev
      },
      filters: {
        search: query.search,
        source: query.source,
        category: query.category,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo
      }
    }
    
    return c.json(response)
    
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return c.json({ 
      error: 'Failed to fetch jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get job sources (optimized for filters)
jobRoutes.get('/sources', async (c) => {
  try {
    const sources = await c.env.db!.job.groupBy({
      by: ['source'],
      _count: {
        source: true
      },
      orderBy: {
        _count: {
          source: 'desc'
        }
      }
    })
    
    const result = {
      sources: sources.map(s => ({
        name: s.source,
        count: s._count.source
      }))
    }
    
    return c.json(result)
  } catch (error) {
    return c.json({ 
      error: 'Failed to fetch sources',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get job categories (optimized for filters)
jobRoutes.get('/categories', async (c) => {
  try {
    const categories = await c.env.db!.feed.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      where: {
        enabled: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    })
    
    const result = {
      categories: categories.map(c => ({
        name: c.category,
        count: c._count.category
      }))
    }
    
    return c.json(result)
  } catch (error) {
    return c.json({ 
      error: 'Failed to fetch categories',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

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
