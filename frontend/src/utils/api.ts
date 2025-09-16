// API configuration
const API_BASE_URL = 'http://localhost:8787' // Your Hono API running locally

// Types matching OpenAPI specification
export interface Job {
  id: string
  title: string
  link: string
  description: string | null
  publishedAt: string
  processedAt: string
  source: string
  hash: string
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

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface JobFilters {
  search?: string | null
  source?: string | null
  category?: string | null
  dateFrom?: string | null
  dateTo?: string | null
}

export interface PaginatedJobsResponse {
  jobs: Job[]
  pagination: PaginationInfo
  filters: JobFilters
}

export interface JobSource {
  name: string
  count: number
}

export interface JobCategory {
  name: string
  count: number
}

export interface JobSourcesResponse {
  sources: JobSource[]
}

export interface JobCategoriesResponse {
  categories: JobCategory[]
}

export interface JobsQueryParams {
  page?: number
  limit?: number
  search?: string
  source?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'publishedAt' | 'processedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
  fields?: string
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
  
  // Job listing and filtering
  async getJobs(params?: JobsQueryParams): Promise<PaginatedJobsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const queryString = searchParams.toString()
    const endpoint = queryString ? `/jobs?${queryString}` : '/jobs'
    
    return this.request<PaginatedJobsResponse>(endpoint)
  }

  async getJobSources(): Promise<JobSourcesResponse> {
    return this.request<JobSourcesResponse>('/jobs/sources')
  }

  async getJobCategories(): Promise<JobCategoriesResponse> {
    return this.request<JobCategoriesResponse>('/jobs/categories')
  }
}

export const api = new ApiClient()
