# GitJobHunter API - Quick Start

🚀 **Complete RSS Job Aggregation API in 1 Hour!**

## ⚡ What's Built

✅ **RSS Feed Processing** - Fetch & parse job feeds  
✅ **Job Deduplication** - Avoid duplicate notifications  
✅ **Discord Notifications** - Rich embed alerts with API management  
✅ **REST API** - Full CRUD for feeds and Discord config  
✅ **Cloudflare KV Storage** - Serverless persistence  
✅ **Required Discord Setup** - App won't work without Discord webhook  

## 🚀 Quick Deploy (3 minutes)

### 1. Create KV Namespaces
```bash
# Create production KV namespace
wrangler kv:namespace create "KV"

# Create preview KV namespace  
wrangler kv:namespace create "KV" --preview
```

### 2. Update wrangler.jsonc
Replace the placeholder IDs with your actual KV namespace IDs from step 1:
```jsonc
"kv_namespaces": [
  {
    "binding": "KV",
    "preview_id": "YOUR_PREVIEW_ID_HERE",
    "id": "YOUR_PRODUCTION_ID_HERE"
  }
]
```

### 3. Deploy
```bash
npm run deploy
```

## 🔗 API Endpoints

**Base URL:** `https://git-job-hunter-api.YOUR_SUBDOMAIN.workers.dev`

### 🎯 Setup Required (Do This First!)
- `POST /config` - **REQUIRED**: Configure Discord webhook
- `GET /config` - Check Discord configuration  
- `POST /test` - Test Discord notifications

### Core Operations
- `GET /health` - Health check (shows Discord status)
- `GET /feeds` - List all feeds  
- `POST /feeds` - Add new feed
- `POST /process` - Process all feeds (requires Discord setup)
- `GET /jobs` - Job statistics

## 📋 Usage Examples

### ⚠️ STEP 1: Configure Discord (REQUIRED)
```bash
# Set up your Discord webhook
curl -X POST https://your-api.workers.dev/config \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL",
    "enabled": true,
    "maxJobsPerMessage": 10
  }'

# Test Discord notifications
curl -X POST https://your-api.workers.dev/test
```

### STEP 2: Add Job Feeds
```bash
curl -X POST https://your-api.workers.dev/feeds \
  -H "Content-Type: application/json" \
  -d '{"name": "AngelList Jobs", "url": "https://angel.co/jobs.rss"}'
```

### STEP 3: Process Feeds
```bash
curl -X POST https://your-api.workers.dev/process
```

### Check Status
```bash
curl https://your-api.workers.dev/health
curl https://your-api.workers.dev/jobs
curl https://your-api.workers.dev/config
```

## 🛠️ Discord Webhook Setup

### Get Discord Webhook URL:
1. Go to your Discord server
2. Right-click on a channel → **Edit Channel**  
3. Go to **Integrations** → **Webhooks** → **New Webhook**
4. Copy the **Webhook URL**
5. Use it in the Discord config API call above

### Update Discord Settings:
```bash
# Enable/disable notifications
curl -X POST https://your-api.workers.dev/config \
  -H "Content-Type: application/json" \
  -d '{"enabled": false, "webhookUrl": "YOUR_WEBHOOK_URL"}'

# Change max jobs per message (1-10)
curl -X POST https://your-api.workers.dev/config \
  -H "Content-Type: application/json" \
  -d '{"maxJobsPerMessage": 5, "webhookUrl": "YOUR_WEBHOOK_URL"}'
```

## 🔄 Automation (Optional)

Add to `wrangler.jsonc` for automatic processing:
```jsonc
{
  "triggers": {
    "crons": ["0 */2 * * *"]
  }
}
```

## 🎯 Popular Job Feed URLs

```json
[
  {"name": "AngelList", "url": "https://angel.co/company/jobs.rss"},
  {"name": "Indeed Remote", "url": "https://rss.indeed.com/rss?q=remote+developer&l="},
  {"name": "Stack Overflow", "url": "https://stackoverflow.com/jobs/feed"},
  {"name": "GitHub Jobs", "url": "https://jobs.github.com/positions.rss"}
]
```

## ⚡ Features

- **Global CDN**: Sub-100ms response times worldwide
- **Auto-scaling**: Handle traffic spikes automatically  
- **Cost-effective**: FREE tier covers most usage
- **Zero maintenance**: Serverless infrastructure
- **Rich notifications**: Beautiful Discord embeds

Your job aggregation API is ready! 🎉
