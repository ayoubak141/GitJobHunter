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
