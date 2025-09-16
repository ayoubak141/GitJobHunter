// Discord service with Prisma database integration
import { PrismaClient } from '@prisma/client'
import { JobEntry } from '../types'

export interface DiscordConfigData {
  webhookUrl: string
  enabled: boolean
  maxJobsPerMessage: number
}

/**
 * Get Discord configuration from database
 */
export async function getDiscordConfig(db: PrismaClient) {
  try {
    // Get the latest Discord config (assuming single config)
    const config = await db.discordConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    })
    
    return config
  } catch (error) {
    console.error('Error getting Discord config:', error)
    return null
  }
}

/**
 * Create or update Discord configuration
 */
export async function upsertDiscordConfig(
  db: PrismaClient, 
  configData: DiscordConfigData
) {
  try {
    // Delete existing configs and create new one (simple approach)
    await db.discordConfig.deleteMany({})
    
    const config = await db.discordConfig.create({
      data: configData
    })
    
    return config
  } catch (error) {
    console.error('Error upserting Discord config:', error)
    throw error
  }
}

/**
 * Send Discord notification with job data
 */
export async function sendDiscordNotification(
  jobs: JobEntry[], 
  db: PrismaClient
): Promise<boolean> {
  if (jobs.length === 0) return true
  
  const discordConfig = await getDiscordConfig(db)
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

/**
 * Validate Discord webhook URL
 */
export function isValidDiscordWebhook(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'discord.com' || urlObj.hostname === 'discordapp.com'
  } catch {
    return false
  }
}
