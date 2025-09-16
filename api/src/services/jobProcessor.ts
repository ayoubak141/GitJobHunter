// Job processing service with Prisma database integration
import { PrismaClient } from '@prisma/client'
import { Env, JobEntry } from '../types'
import { getAllFeeds, fetchRSS, isJobSeen, saveJobs, getRecentJobs } from './feeds'
import { getDiscordConfig, sendDiscordNotification } from './discord'

/**
 * Process all feeds and send notifications
 */
export async function processJobs(env: Env) {
  const db = env.db!
  
  // Check if Discord is configured first
  const discordConfig = await getDiscordConfig(db)
  if (!discordConfig) {
    throw new Error('Discord webhook must be configured before processing jobs')
  }
  
  if (!discordConfig.enabled) {
    throw new Error('Discord notifications are disabled')
  }
  
  // Get all feeds
  const feeds = await getAllFeeds(db)
  
  if (feeds.length === 0) {
    throw new Error('No feeds configured')
  }
  
  let allNewJobs: JobEntry[] = []
  let failedFeeds: string[] = []
  
  // Process each feed
  for (const feed of feeds.filter(f => f.enabled !== false)) {
    try {
      const jobs = await fetchRSS(feed)
      
      // Filter out already seen jobs
      const newJobs: JobEntry[] = []
      
      for (const job of jobs) {
        const seen = await isJobSeen(db, job.hash)
        if (!seen) {
          newJobs.push(job)
        }
      }
      
      if (newJobs.length > 0) {
        // Save new jobs to database
        await saveJobs(db, newJobs, feed.id!)
        allNewJobs.push(...newJobs)
      }
    } catch (error) {
      console.error(`Failed to process feed ${feed.name}:`, error)
      failedFeeds.push(feed.name)
    }
  }
  
  // Send notifications
  let notificationSent = false
  let notificationError = null
  
  if (allNewJobs.length > 0) {
    try {
      await sendDiscordNotification(allNewJobs, db)
      notificationSent = true
    } catch (error) {
      notificationError = error instanceof Error ? error.message : 'Unknown notification error'
      console.error('Notification error:', error)
    }
  }
  
  // Get recent jobs for preview
  const previewJobs = await getRecentJobs(db, 5)
  
  return {
    success: true,
    message: `Processed ${feeds.filter(f => f.enabled).length} feeds`,
    newJobsFound: allNewJobs.length,
    notificationSent,
    notificationError,
    failedFeeds: failedFeeds.length > 0 ? failedFeeds : undefined,
    jobs: previewJobs,
    totalJobs: allNewJobs.length
  }
}
