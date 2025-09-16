# Database Configuration Guide

This project supports both development and production database configurations with automatic detection.

## Quick Start

### Development (Direct PostgreSQL)
```bash
# Set your direct PostgreSQL URL
npx wrangler secret put DATABASE_URL
# Enter: postgresql://username:password@localhost:5432/database_name

# Run development server
npm run dev
```

### Production (Prisma Accelerate)
```bash
# Set your Prisma Accelerate URL
npx wrangler secret put DATABASE_URL
# Enter: prisma://accelerate.prisma-data.net/?api_key=your_api_key

# Test production configuration locally
npm run dev:prod

# Deploy to production
npm run deploy
```

## How it Works

The `getPrismaClient()` function automatically detects the environment and database type:

1. **Accelerate Detection**: 
   - URLs containing `prisma://accelerate.prisma-data.net` or `prisma://`
   - When `ENV=production`
   - Uses Prisma Accelerate (no adapter)

2. **Direct Connection**: 
   - All other PostgreSQL URLs
   - When `ENV=development`
   - Uses PostgreSQL adapter for Cloudflare Workers

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (direct PostgreSQL) |
| `npm run dev:prod` | Test production config locally (Accelerate) |
| `npm run deploy` | Deploy to production (uses Accelerate config) |
| `npm run deploy:dev` | Deploy with development config |

## Configuration Files

- `wrangler.jsonc` - Development configuration (`ENV=development`)
- `wrangler.prod.jsonc` - Production configuration (`ENV=production`)

## Environment Variables

The system requires only one environment variable:

### DATABASE_URL
Set this using wrangler secrets:

```bash
# For development (direct PostgreSQL)
npx wrangler secret put DATABASE_URL
# Enter: postgresql://user:pass@host:port/database

# For production (Prisma Accelerate)  
npx wrangler secret put DATABASE_URL
# Enter: prisma://accelerate.prisma-data.net/?api_key=your_key
```

The `ENV` is automatically set by the wrangler configuration files.

## Troubleshooting

- **"Driver adapters cannot connect to Accelerate"**: You're using an Accelerate URL with development config
- **Connection errors**: Check your DATABASE_URL format matches the environment
- **Build errors**: Ensure you have the correct packages installed (`@prisma/adapter-pg-worker`, `@prisma/pg-worker`)
