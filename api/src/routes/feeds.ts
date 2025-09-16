// Feed routes with Prisma database integration
import { Hono } from 'hono'
import { Env } from '../types'
import { getAllFeeds, addFeed } from '../services/feeds'

export const feedRoutes = new Hono<{ Bindings: Env }>()

// Get all feeds
feedRoutes.get('/', async (c) => {
  try {
    const feeds = await getAllFeeds(c.env.db!)
    return c.json({ feeds })
  } catch (error) {
    return c.json({ error: 'Failed to fetch feeds' }, 500)
  }
})

// Add new feed
feedRoutes.post('/', async (c) => {
  try {
    const { name, url, source, category, params } = await c.req.json()
    
    if (!name || !url || !source || !category) {
      return c.json({ error: 'Name, URL, source, and category are required' }, 400)
    }
    
    const newFeed = await addFeed(c.env.db!, {
      name,
      url,
      source,
      category,
      params: params || null,
      enabled: true
    })
    
    return c.json({ message: 'Feed added successfully', feed: newFeed })
  } catch (error) {
    return c.json({ error: 'Failed to add feed' }, 500)
  }
})
