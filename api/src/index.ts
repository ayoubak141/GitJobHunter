import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { feedRoutes, processJobs, getJobsStats } from './feeds'
import { Env, DiscordConfig } from './types'
import { openAPISpec } from './swagger'

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

// Helper functions for Discord config
function isValidDiscordWebhook(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'discord.com' || urlObj.hostname === 'discordapp.com'
  } catch {
    return false
  }
}

async function getDiscordConfig(env: Env): Promise<DiscordConfig | null> {
  try {
    const configData = await env.KV.get('discord_config')
    return configData ? JSON.parse(configData) : null
  } catch (error) {
    console.error('Error getting Discord config:', error)
    return null
  }
}

// Health check endpoint
app.get('/health', async (c) => {
  const discordConfig = await getDiscordConfig(c.env)
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
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

// Simplified Discord configuration routes
app.get('/config', async (c) => {
  try {
    const config = await getDiscordConfig(c.env)
    if (!config) {
      return c.json({ 
        configured: false,
        message: 'Discord webhook not configured'
      })
    }
    
    return c.json({
      configured: true,
      enabled: config.enabled,
      maxJobsPerMessage: config.maxJobsPerMessage,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    })
  } catch (error) {
    return c.json({ error: 'Failed to get Discord config' }, 500)
  }
})

app.post('/config', async (c) => {
  try {
    const { webhookUrl, enabled = true, maxJobsPerMessage = 10 } = await c.req.json()
    
    if (!webhookUrl) {
      return c.json({ error: 'webhookUrl is required' }, 400)
    }
    
    if (!isValidDiscordWebhook(webhookUrl)) {
      return c.json({ error: 'Invalid Discord webhook URL. Must be a valid Discord webhook.' }, 400)
    }
    
    if (maxJobsPerMessage < 1 || maxJobsPerMessage > 10) {
      return c.json({ error: 'maxJobsPerMessage must be between 1 and 10' }, 400)
    }
    
    const config: DiscordConfig = {
      webhookUrl,
      enabled,
      maxJobsPerMessage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await c.env.KV.put('discord_config', JSON.stringify(config))
    
    return c.json({ 
      message: 'Discord webhook configured successfully',
      config: {
        enabled: config.enabled,
        maxJobsPerMessage: config.maxJobsPerMessage,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to configure Discord webhook' }, 500)
  }
})

// Test Discord webhook
app.post('/test', async (c) => {
  try {
    const config = await getDiscordConfig(c.env)
    if (!config) {
      return c.json({ 
        error: 'Discord webhook not configured. Please configure Discord webhook first.',
        message: 'Use POST /config to set up Discord webhook'
      }, 400)
    }
    
    if (!config.enabled) {
      return c.json({ 
        error: 'Discord notifications are disabled',
        message: 'Enable Discord notifications in configuration'
      }, 400)
    }
    
    // Send test notification
    const testEmbed = {
      title: '🧪 GitJobHunter Test Notification',
      description: '**Status:** Discord webhook is working correctly!\n**Time:** ' + new Date().toLocaleString(),
      color: 0x00FF00,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'GitJobHunter API Test'
      }
    }
    
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '✅ **Discord Test Successful!** Your webhook is properly configured.',
        embeds: [testEmbed]
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return c.json({ 
        error: 'Discord webhook test failed',
        message: `Discord API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, 400)
    }
    
    return c.json({
      success: true,
      message: 'Discord test notification sent successfully!',
      webhookUrl: config.webhookUrl.replace(/\/[^\/]+$/, '/***'),  // Hide token
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Discord test error:', error)
    return c.json({
      error: 'Failed to send test notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Mount simplified feed routes
app.route('/feeds', feedRoutes)

// Process all feeds
app.post('/process', async (c) => {
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
app.get('/jobs', async (c) => {
  try {
    const stats = await getJobsStats(c.env)
    return c.json(stats)
  } catch (error) {
    return c.json({ error: 'Failed to fetch jobs' }, 500)
  }
})

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
