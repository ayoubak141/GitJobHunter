# GitJobHunter API

🚀 **Automated RSS Job Aggregation API with Cron Triggers**

## ⚡ Quick Start

```bash
# Install dependencies (including new Swagger UI)
npm install

# Run locally
npm run dev

# Deploy to Cloudflare Workers
npm run deploy
```

## ⏰ Automatic Processing

**🎯 NEW: Cron Trigger Integration**
- **Automated Processing:** Jobs are automatically processed **every 2 hours**
- **Zero Maintenance:** No manual intervention needed once configured
- **Cloudflare Cron:** Leverages Cloudflare Workers cron triggers
- **Smart Scheduling:** Runs at: 12:00 AM, 2:00 AM, 4:00 AM, 6:00 AM, etc.

## 📁 Simplified Structure

```
src/
├── feeds.ts    # RSS processing & notifications
├── types.ts    # Shared TypeScript interfaces
├── swagger.ts  # OpenAPI specification
└── index.ts    # Entry point with cron handler
wrangler.jsonc  # Cloudflare config with cron triggers
```

## 📖 API Documentation

**Swagger UI:** `https://your-worker.workers.dev/docs`  
**OpenAPI Spec:** `https://your-worker.workers.dev/openapi.json`

## 🔗 API Endpoints

**Base URL:** `https://your-worker.workers.dev`

### Core Routes (7 endpoints)
- `GET /health` - Health check
- `GET /docs` - **Swagger UI documentation** 📖
- `GET /openapi.json` - OpenAPI specification
- `GET /config` - Get Discord configuration  
- `POST /config` - Set Discord webhook
- `GET /feeds` - List RSS feeds
- `POST /feeds` - Add RSS feed
- `POST /process` - Process all feeds
- `GET /jobs` - Job statistics

### Setup Process
1. **Configure Discord:** `POST /config` with webhook URL
2. **Add Feeds:** `POST /feeds` with RSS URLs  
3. **Deploy & Relax:** Jobs are automatically processed every 2 hours! 🎉
4. **Manual Processing:** Optional `POST /process` for immediate runs

## 🕐 Cron Configuration

**Current Schedule:** `"0 */2 * * *"` (Every 2 hours)

```jsonc
// wrangler.jsonc
{
  "triggers": {
    "crons": ["0 */2 * * *"]  // Modify this to change schedule
  }
}
```

**Common Schedule Examples:**
- `"0 9-17 * * 1-5"` - Every hour during business hours (9 AM - 5 PM, Mon-Fri)
- `"0 */4 * * *"` - Every 4 hours
- `"0 8,20 * * *"` - Twice daily at 8 AM and 8 PM
- `"0 */30 * * * *"` - Every 30 minutes (for high-frequency checking)

✅ **NEW: Automated cron processing**
✅ **Simplified from 9 endpoints to 7**
✅ **Removed Docker complexity**
✅ **Consolidated Discord & feed logic**
✅ **Interactive API documentation with Swagger UI**
✅ **50% less code to maintain**
