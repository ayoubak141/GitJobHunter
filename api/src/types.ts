// Shared types for GitJobHunter API

export interface Env {
  KV: KVNamespace
  DISCORD_WEBHOOK_URL?: string
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
