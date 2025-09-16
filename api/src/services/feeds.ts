// Feed service with Prisma database integration
import { XMLParser } from 'fast-xml-parser'
import { PrismaClient } from '@prisma/client'
import { JobEntry, FeedConfig } from '../types'

// XML Parser setup
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
})

export function generateHash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString()
}

/**
 * Get all feeds from database
 */
export async function getAllFeeds(db: PrismaClient): Promise<FeedConfig[]> {
  try {
    const feeds = await db.feed.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return feeds.map(feed => ({
      id: feed.id,
      name: feed.name,
      url: feed.url,
      source: feed.source,
      category: feed.category,
      params: feed.params as Record<string, string> | null,
      enabled: feed.enabled
    }))
  } catch (error) {
    console.error('Error getting feeds:', error)
    return []
  }
}

/**
 * Add new feed to database
 */
export async function addFeed(
  db: PrismaClient,
  feedData: Omit<FeedConfig, 'id'>
): Promise<FeedConfig> {
  try {
    const feed = await db.feed.create({
      data: {
        name: feedData.name,
        url: feedData.url,
        source: feedData.source,
        category: feedData.category,
        params: feedData.params || undefined,
        enabled: feedData.enabled ?? true
      }
    })
    
    return {
      id: feed.id,
      name: feed.name,
      url: feed.url,
      source: feed.source,
      category: feed.category,
      params: feed.params as Record<string, string> | null,
      enabled: feed.enabled
    }
  } catch (error) {
    console.error('Error adding feed:', error)
    throw error
  }
}

/**
 * Fetch RSS feed and parse job entries
 */
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

/**
 * Check if job already exists in database (deduplication)
 */
export async function isJobSeen(db: PrismaClient, hash: string): Promise<boolean> {
  try {
    const existingJob = await db.job.findUnique({
      where: { hash }
    })
    return !!existingJob
  } catch (error) {
    console.error('Error checking job existence:', error)
    return false
  }
}

/**
 * Save new jobs to database
 */
export async function saveJobs(
  db: PrismaClient, 
  jobs: JobEntry[], 
  feedId: string
): Promise<void> {
  try {
    // Use createMany for bulk insert
    const jobsData = jobs.map(job => ({
      id: job.id,
      title: job.title,
      link: job.link,
      description: job.description || null,
      publishedAt: new Date(job.publishedAt),
      processedAt: new Date(job.processedAt),
      source: job.source,
      hash: job.hash,
      feedId: feedId
    }))
    
    await db.job.createMany({
      data: jobsData,
      skipDuplicates: true // Skip if hash or link already exists
    })
  } catch (error) {
    console.error('Error saving jobs:', error)
    throw error
  }
}

/**
 * Get jobs statistics
 */
export async function getJobsStats(db: PrismaClient) {
  try {
    const totalJobs = await db.job.count()
    const lastJob = await db.job.findFirst({
      orderBy: { processedAt: 'desc' },
      select: { processedAt: true }
    })
    
    return {
      totalJobs,
      lastProcessed: lastJob?.processedAt?.toISOString() || null
    }
  } catch (error) {
    console.error('Error getting jobs stats:', error)
    return {
      totalJobs: 0,
      lastProcessed: null
    }
  }
}

/**
 * Get recent jobs for preview
 */
export async function getRecentJobs(
  db: PrismaClient, 
  limit: number = 5
): Promise<JobEntry[]> {
  try {
    const jobs = await db.job.findMany({
      orderBy: { processedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        link: true,
        description: true,
        publishedAt: true,
        processedAt: true,
        source: true,
        hash: true
      }
    })
    
    return jobs.map(job => ({
      id: job.id,
      title: job.title,
      link: job.link,
      description: job.description || undefined,
      publishedAt: job.publishedAt.toISOString(),
      processedAt: job.processedAt.toISOString(),
      source: job.source,
      hash: job.hash
    }))
  } catch (error) {
    console.error('Error getting recent jobs:', error)
    return []
  }
}
