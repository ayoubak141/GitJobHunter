// Shared types for GitJobHunter API
import { PrismaClient } from '@prisma/client'

export interface Env {
  DATABASE_URL: string
  db?: PrismaClient // Prisma client instance
}

export interface JobEntry {
  id: string
  title: string
  link: string
  description?: string
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
  params: Record<string, string> | null
  enabled?: boolean
}

export interface DiscordConfig {
  webhookUrl: string
  enabled: boolean
  maxJobsPerMessage: number
  createdAt: string
  updatedAt: string
}

export interface JobsQueryParams {
  page?: string
  limit?: string
  search?: string
  source?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: string
  fields?: string // Comma-separated list of fields to include
}

export interface PaginatedJobsResponse {
  jobs: JobEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    search?: string
    source?: string
    category?: string
    dateFrom?: string
    dateTo?: string
  }
}

export interface JobSourcesResponse {
  sources: Array<{
    name: string
    count: number
  }>
}

export interface JobCategoriesResponse {
  categories: Array<{
    name: string
    count: number
  }>
}
