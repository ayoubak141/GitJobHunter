# GitJobHunter API

🚀 **Automated RSS Job Aggregation API with Discord Notifications & Cloudflare Cron Triggers**

A zero-maintenance job aggregation system that monitors RSS feeds, deduplicates jobs, and sends rich Discord notifications automatically every 2 hours.

## ✨ Key Features

- 🤖 **Fully Automated**: Set it up once, runs forever with Cloudflare cron triggers
- 📢 **Discord Integration**: Rich embed notifications with job details
- 🔄 **Smart Deduplication**: Hash-based job tracking prevents duplicate notifications
- 📊 **RSS Aggregation**: Support for multiple RSS feeds with custom parameters
- 📖 **Interactive Docs**: Built-in Swagger UI documentation
- ⚡ **Serverless**: Runs on Cloudflare Workers with PostgreSQL database
- 🛠 **Zero Maintenance**: No servers to manage, automatic scaling

## ⚡ Quick Start

```bash
# Install dependencies
yarn install

# Run locally for development
yarn dev

# Deploy to Cloudflare Workers
yarn deploy
```

## 🏗 Architecture Overview

```
GitJobHunter API (Cloudflare Worker)
├── 🕐 Cron Triggers (Every 2 hours)
├── 📊 RSS Feed Processing
├── 🔍 Job Deduplication (PostgreSQL)
├── 📢 Discord Notifications
└── 🌐 REST API Endpoints
```

## 📁 Project Structure

```
api/
├── src/
│   ├── index.ts     # Main entry point & HTTP routes (254 lines)
│   ├── feeds.ts     # RSS processing & Discord logic (257 lines)  
│   ├── types.ts     # TypeScript interfaces (36 lines)
│   └── swagger.ts   # OpenAPI documentation (467 lines)
├── wrangler.jsonc   # Cloudflare Workers config with cron
├── package.json     # Dependencies (Hono, fast-xml-parser)
└── tsconfig.json    # TypeScript configuration
```

### Core Files Explained

#### `index.ts` - Main Application
- **Hono framework** setup with typed environment bindings
- **HTTP routes** for configuration, health checks, and manual processing
- **Scheduled handler** for automatic cron-triggered job processing
- **Discord configuration** management with validation
- **Error handling** and comprehensive API responses

#### `feeds.ts` - RSS Processing Engine  
- **RSS parsing** using `fast-xml-parser` with flexible XML structure support
- **Job deduplication** using SHA-based hashing algorithm
- **Discord webhook integration** with rich embeds and configurable limits
- **Feed management** with support for custom URL parameters
- **Batch processing** with error resilience per feed

#### `types.ts` - Type Definitions
- **Environment interfaces** for PostgreSQL database connections
- **Data structures** for jobs, feeds, and Discord configuration
- **Type safety** throughout the application

#### `swagger.ts` - API Documentation
- **Complete OpenAPI 3.0 specification** with 7 documented endpoints
- **Request/response schemas** with validation and examples
- **Interactive documentation** via Swagger UI

## ⏰ Automatic Processing

**🎯 Cron Trigger Integration**
- **Schedule**: Every 2 hours (`"0 */2 * * *"`)
- **Processing**: Automatic RSS feed monitoring and Discord notifications
- **Reliability**: Cloudflare-managed cron with built-in retry logic
- **Zero Maintenance**: Runs indefinitely without manual intervention

## 🔗 API Endpoints

**Base URL**: `https://your-worker.workers.dev`

### 🏥 Health & Documentation
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check with Discord config status |
| `GET` | `/docs` | **Swagger UI Documentation** 📖 |
| `GET` | `/openapi.json` | OpenAPI specification |

### ⚙️ Configuration
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/config` | Get Discord webhook configuration |
| `POST` | `/config` | Configure Discord webhook URL & settings |
| `POST` | `/test` | Test Discord webhook with sample notification |

### 📊 Feed Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/feeds` | List all configured RSS feeds |
| `POST` | `/feeds` | Add new RSS feed with custom parameters |

### 🔄 Processing
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/process` | Manually trigger feed processing |
| `GET` | `/jobs` | Get job statistics and processing history |

## 🚀 Setup Guide

### 1. Configure Discord Webhook

```bash
curl -X POST https://your-worker.workers.dev/config \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL",
    "enabled": true,
    "maxJobsPerMessage": 10
  }'
```

### 2. Add RSS Feeds

```bash
curl -X POST https://your-worker.workers.dev/feeds \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Remote Developer Jobs",
    "url": "https://remoteok.io/remote-jobs.rss",
    "source": "RemoteOK",
    "category": "remote/developer",
    "params": {
      "tags": "developer",
      "location": "remote"
    }
  }'
```

### 3. Test Configuration

```bash
curl -X POST https://your-worker.workers.dev/test
```

### 4. Deploy & Enjoy! 🎉

Once deployed, jobs are automatically processed every 2 hours with zero maintenance required.

## 🕐 Cron Configuration

**Default Schedule**: `"0 */2 * * *"` (Every 2 hours)

```jsonc
// wrangler.jsonc
{
  "triggers": {
    "crons": ["0 */2 * * *"]
  }
}
```

### Schedule Examples
- `"0 9-17 * * 1-5"` - Business hours (9 AM - 5 PM, Mon-Fri)
- `"0 */4 * * *"` - Every 4 hours
- `"0 8,20 * * *"` - Twice daily (8 AM & 8 PM)
- `"0 */30 * * * *"` - Every 30 minutes (high frequency)

## 🔍 How Job Deduplication Works

1. **Hash Generation**: Each job gets a unique hash from `link + title`
2. **Database Storage**: Job data and configurations stored in PostgreSQL
3. **Smart Filtering**: Only new jobs trigger Discord notifications
4. **Persistent Memory**: Job history persists across deployments

## 📊 Data Flow

```mermaid
graph LR
    A[Cron Trigger] --> B[Process Feeds]
    B --> C[Fetch RSS]
    C --> D[Parse XML]
    D --> E[Generate Hashes]
    E --> F[Check Database]
    F --> G[Filter New Jobs]
    G --> H[Send Discord]
    H --> I[Update Database]
```

## 🛠 Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev  # Runs on http://localhost:8787

# Type checking
yarn type-check

# Deploy to production
yarn deploy
```

## 📖 API Documentation

Visit `https://your-worker.workers.dev/docs` for interactive Swagger UI documentation with:
- **Live API testing**
- **Request/response examples** 
- **Schema validation**
- **Complete endpoint documentation**

## 🌟 Features Highlights

✅ **Fully Automated**: Cron-triggered processing every 2 hours  
✅ **Smart Deduplication**: Hash-based job tracking prevents spam  
✅ **Rich Discord Notifications**: Embeds with job details and links  
✅ **Multi-Feed Support**: Aggregate from unlimited RSS sources  
✅ **Interactive Documentation**: Built-in Swagger UI  
✅ **Type-Safe**: Full TypeScript implementation  
✅ **Serverless**: Zero-maintenance Cloudflare Workers deployment  
✅ **Error Resilient**: Individual feed failures don't break processing  
✅ **Configurable**: Customizable notification limits and scheduling
