// API configuration
const API_BASE_URL = 'http://localhost:8787' // Your Hono API running locally

// Types matching OpenAPI specification
export interface Job {
  id: string
  title: string
  link: string
  description: string
  publishedAt: string
  source: string
}

export interface FeedConfig {
  id?: string
  name: string
  url: string
  source: string
  category: string
  params?: Record<string, string> | null
  enabled?: boolean
}

export interface DiscordConfig {
  configured: boolean
  enabled: boolean
  maxJobsPerMessage: number
  createdAt?: string
  updatedAt?: string
}

export interface TestResponse {
  success: boolean
  message: string
  webhookUrl: string
  timestamp: string
}

export interface ProcessResponse {
  success: boolean
  message: string
  newJobsFound: number
  notificationSent: boolean
  notificationError?: string | null
  failedFeeds?: string[] | null
  jobs: Job[]
  totalJobs: number
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
  lastProcessed?: string | null
}

export interface ApiError {
  error: string
  message?: string
  timestamp?: string
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

  async setConfig(config: { webhookUrl?: string; enabled?: boolean; maxJobsPerMessage?: number }): Promise<{ message: string; config: DiscordConfig }> {
    return this.request('/config', {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }

  async testDiscord(): Promise<TestResponse> {
    return this.request<TestResponse>('/config/test', {
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

  // Job processing and statistics
  async processJobs(): Promise<ProcessResponse> {
    return this.request<ProcessResponse>('/jobs/process', {
      method: 'POST',
    })
  }

  async getJobsStats(): Promise<JobsStats> {
    return this.request<JobsStats>('/jobs/status')
  }
}

export const api = new ApiClient()
