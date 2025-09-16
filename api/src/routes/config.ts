// Discord configuration routes with Prisma database integration
import { Hono } from 'hono'
import { Env } from '../types'
import { getDiscordConfig, upsertDiscordConfig, isValidDiscordWebhook } from '../services/discord'

export const configRoutes = new Hono<{ Bindings: Env }>()

// Get Discord configuration
configRoutes.get('/', async (c) => {
  try {
    const config = await getDiscordConfig(c.env.db!)
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
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString()
    })
  } catch (error) {
    return c.json({ error: 'Failed to get Discord config' }, 500)
  }
})

// Create or update Discord configuration
configRoutes.post('/', async (c) => {
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
    
    const config = await upsertDiscordConfig(c.env.db!, {
      webhookUrl,
      enabled,
      maxJobsPerMessage
    })
    
    return c.json({ 
      message: 'Discord webhook configured successfully',
      config: {
        enabled: config.enabled,
        maxJobsPerMessage: config.maxJobsPerMessage,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString()
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to configure Discord webhook' }, 500)
  }
})

// Test Discord webhook
configRoutes.post('/test', async (c) => {
  try {
    const config = await getDiscordConfig(c.env.db!)
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
