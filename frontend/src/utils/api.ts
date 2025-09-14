// API configuration
const API_BASE_URL = 'http://localhost:8787' // Your Hono API running locally

// Types from your API
export interface Job {
  title: string
  link: string
  description?: string
  pubDate?: string
  company?: string
  location?: string
  source?: string
}

export interface Feed {
  name: string
  url: string
  source: string
  category?: string
  params?: Record<string, string | number>
}

export interface DiscordConfig {
  webhookUrl?: string
  enabled: boolean
  maxJobsPerMessage: number
  configured: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TestResponse {
  success: boolean
  message: string
  webhookUrl: string
  timestamp: string
}

export interface FeedConfig {
  id?: string
  name: string
  url: string
  source: string
  category: string
  enabled?: boolean
  params?: Record<string, string | number>
}

export interface ProcessResponse {
  success: boolean
  message: string
  totalJobs: number
  newJobsFound: number
  notificationSent?: boolean
  notificationError?: string
  failedFeeds?: string[]
  jobs?: Array<{
    id: string
    title: string
    link: string
    description: string
    publishedAt: string
    source: string
  }>
}

export interface HealthStatus {
  status: string
  timestamp: string
  version: string
  discord: {
    configured: boolean
    enabled: boolean
  }
}

export interface JobsStats {
  totalJobs: number
  newJobs: number
  lastProcessed?: string
  feeds: Feed[]
}

// API utility functions
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      throw error
    }
  }

  // Health check
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health')
  }

  // Discord configuration
  async getConfig(): Promise<DiscordConfig> {
    return this.request<DiscordConfig>('/config')
  }

  async setConfig(config: { webhookUrl?: string; enabled?: boolean; maxJobsPerMessage?: number }): Promise<{ message: string }> {
    return this.request('/config', {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }

  async testDiscord(): Promise<TestResponse> {
    return this.request<TestResponse>('/test', {
      method: 'POST',
    })
  }

  // Feed management
  async getFeeds(): Promise<{ feeds: FeedConfig[] }> {
    return this.request<{ feeds: FeedConfig[] }>('/feeds')
  }

  async addFeed(feed: Omit<FeedConfig, 'id'>): Promise<{ message: string; feed: FeedConfig }> {
    return this.request('/feeds', {
      method: 'POST',
      body: JSON.stringify(feed),
    })
  }

  // Job processing
  async processJobs(): Promise<ProcessResponse> {
    return this.request<ProcessResponse>('/process', {
      method: 'POST',
    })
  }

  async getJobs(): Promise<JobsStats> {
    return this.request<JobsStats>('/jobs')
  }
}

export const api = new ApiClient()
