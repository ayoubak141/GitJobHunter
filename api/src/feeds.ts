import { Hono } from 'hono'
import { XMLParser } from 'fast-xml-parser'
import { JobEntry, FeedConfig, DiscordConfig, Env } from './types'

// XML Parser setup
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
})

// Discord notification functions
async function getDiscordConfig(env: Env): Promise<DiscordConfig | null> {
  try {
    const configData = await env.KV.get('discord_config')
    return configData ? JSON.parse(configData) : null
  } catch (error) {
    console.error('Error getting Discord config:', error)
    return null
  }
}

async function sendDiscordNotification(jobs: JobEntry[], env: Env): Promise<boolean> {
  if (jobs.length === 0) return true
  
  const discordConfig = await getDiscordConfig(env)
  if (!discordConfig || !discordConfig.enabled) {
    throw new Error('Discord webhook not configured. Please set up Discord webhook first.')
  }
  
  try {
    const maxJobs = discordConfig.maxJobsPerMessage || 10
    const jobsToSend = jobs.slice(0, maxJobs)
    
    const embeds = jobsToSend.map(job => ({
      title: job.title.substring(0, 256),
      url: job.link,
      description: `**Source:** ${job.source}\n**Posted:** ${new Date(job.publishedAt).toLocaleString()}`.substring(0, 4096),
      color: 0x00FF00,
      timestamp: job.publishedAt
    }))
    
    const response = await fetch(discordConfig.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🚀 Found ${jobs.length} new job${jobs.length > 1 ? 's' : ''}!${jobs.length > maxJobs ? ` (Showing first ${maxJobs})` : ''}`,
        embeds
      })
    })
    
    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status} ${response.statusText}`)
    }
    
    return true
  } catch (error) {
    console.error('Discord notification error:', error)
    throw error
  }
}

export function generateHash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString()
}

export async function fetchRSS(feed: FeedConfig): Promise<JobEntry[]> {
  try {
    // Construct URL with params if they exist
    let fetchUrl = feed.url
    if (feed.params && Object.keys(feed.params).length > 0) {
      const urlObj = new URL(feed.url)
      Object.entries(feed.params).forEach(([key, value]) => {
        urlObj.searchParams.set(key, value)
      })
      fetchUrl = urlObj.toString()
    }
    
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'GitJobHunter/2.0 (Cloudflare Worker)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const xml = await response.text()
    const parsed = parser.parse(xml)
    
    const items = parsed.rss?.channel?.item || parsed.feed?.entry || []
    const itemsArray = Array.isArray(items) ? items : [items]
    
    return itemsArray.map((item: any) => {
      const title = item.title?.['#text'] || item.title || 'No title'
      const link = item.link?.['@_href'] || item.link || item.guid || ''
      const description = item.description?.['#text'] || item.description || item.summary || ''
      const pubDate = item.pubDate || item.published || new Date().toISOString()
      
      return {
        id: generateHash(link + title),
        title: title.substring(0, 200),
        link,
        description: description.substring(0, 500),
        publishedAt: new Date(pubDate).toISOString(),
        processedAt: new Date().toISOString(),
        source: feed.source,
        hash: generateHash(link + title)
      }
    })
  } catch (error) {
    console.error('RSS fetch error:', error)
    return []
  }
}

// Get all feeds
export async function getAllFeeds(env: Env): Promise<FeedConfig[]> {
  const feedsData = await env.KV.get('feeds')
  return feedsData ? JSON.parse(feedsData) : []
}

// Feed routes
export const feedRoutes = new Hono<{ Bindings: Env }>()

// Get all feeds
feedRoutes.get('/', async (c) => {
  try {
    const feeds = await getAllFeeds(c.env)
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
    
    const feedsData = await c.env.KV.get('feeds')
    const feeds: FeedConfig[] = feedsData ? JSON.parse(feedsData) : []
    
    const newFeed: FeedConfig = {
      id: generateHash(name + url),
      name,
      url,
      source,
      category,
      params: params || null,
      enabled: true
    }
    
    feeds.push(newFeed)
    await c.env.KV.put('feeds', JSON.stringify(feeds))
    
    return c.json({ message: 'Feed added successfully', feed: newFeed })
  } catch (error) {
    return c.json({ error: 'Failed to add feed' }, 500)
  }
})

// Process all feeds and send notifications
export async function processJobs(env: Env) {
  // Check if Discord is configured first
  const discordConfig = await getDiscordConfig(env)
  if (!discordConfig) {
    throw new Error('Discord webhook must be configured before processing jobs')
  }
  
  if (!discordConfig.enabled) {
    throw new Error('Discord notifications are disabled')
  }
  
  // Get all feeds
  const feeds = await getAllFeeds(env)
  
  if (feeds.length === 0) {
    throw new Error('No feeds configured')
  }
  
  // Get seen jobs for deduplication
  const seenJobsData = await env.KV.get('seen_jobs')
  const seenJobs: Record<string, string> = seenJobsData ? JSON.parse(seenJobsData) : {}
  
  let allNewJobs: JobEntry[] = []
  let failedFeeds: string[] = []
  
  // Process each feed
  for (const feed of feeds.filter(f => f.enabled !== false)) {
    try {
      const jobs = await fetchRSS(feed)
      
      // Filter out already seen jobs
      const newJobs = jobs.filter(job => !seenJobs[job.hash])
      allNewJobs.push(...newJobs)
      
      // Mark jobs as seen
      newJobs.forEach(job => {
        seenJobs[job.hash] = job.processedAt
      })
    } catch (error) {
      console.error(`Failed to process feed ${feed.name}:`, error)
      failedFeeds.push(feed.name)
    }
  }
  
  // Update seen jobs
  await env.KV.put('seen_jobs', JSON.stringify(seenJobs))
  
  // Send notifications
  let notificationSent = false
  let notificationError = null
  
  if (allNewJobs.length > 0) {
    try {
      await sendDiscordNotification(allNewJobs, env)
      notificationSent = true
    } catch (error) {
      notificationError = error instanceof Error ? error.message : 'Unknown notification error'
      console.error('Notification error:', error)
    }
  }
  
  return {
    success: true,
    message: `Processed ${feeds.filter(f => f.enabled).length} feeds`,
    newJobsFound: allNewJobs.length,
    notificationSent,
    notificationError,
    failedFeeds: failedFeeds.length > 0 ? failedFeeds : undefined,
    jobs: allNewJobs.slice(0, 5), // Return first 5 jobs for preview
    totalJobs: allNewJobs.length
  }
}

// Get jobs statistics
export async function getJobsStats(env: Env) {
  const seenJobsData = await env.KV.get('seen_jobs')
  const seenJobs: Record<string, string> = seenJobsData ? JSON.parse(seenJobsData) : {}
  
  return {
    totalJobs: Object.keys(seenJobs).length,
    lastProcessed: Object.values(seenJobs).sort().pop() || null
  }
}
