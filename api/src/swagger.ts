// OpenAPI specification for GitJobHunter API
export const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'GitJobHunter API',
    description: 'Automated RSS Job Aggregation API with Discord notifications and Cloudflare cron triggers. Jobs are automatically processed every 2 hours with zero maintenance required.',
    version: '2.0.0',
    contact: {
      name: 'GitJobHunter API Support'
    }
  },
  servers: [
    {
      url: 'http://localhost:8787',
      description: 'Dev server'
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        description: 'Check API health, Discord configuration status, and automatic processing status',
        tags: ['Health'],
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '2.0.0' },
                    discord: {
                      type: 'object',
                      properties: {
                        configured: { type: 'boolean' },
                        enabled: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/config': {
      get: {
        summary: 'Get Discord Configuration',
        description: 'Retrieve current Discord webhook configuration',
        tags: ['Configuration'],
        responses: {
          '200': {
            description: 'Discord configuration retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    configured: { type: 'boolean' },
                    enabled: { type: 'boolean' },
                    maxJobsPerMessage: { type: 'integer', minimum: 1, maximum: 10 },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Configure Discord Webhook',
        description: 'Set up Discord webhook for job notifications',
        tags: ['Configuration'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['webhookUrl'],
                properties: {
                  webhookUrl: {
                    type: 'string',
                    format: 'uri',
                    description: 'Discord webhook URL',
                    example: 'https://discord.com/api/webhooks/123456789/abcdefghijklmnop'
                  },
                  enabled: {
                    type: 'boolean',
                    default: true,
                    description: 'Enable/disable notifications'
                  },
                  maxJobsPerMessage: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 10,
                    default: 10,
                    description: 'Maximum jobs per Discord message'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Discord webhook configured successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    config: {
                      type: 'object',
                      properties: {
                        enabled: { type: 'boolean' },
                        maxJobsPerMessage: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/config/test': {
      post: {
        summary: 'Test Discord Webhook',
        description: 'Send a test notification to verify Discord webhook is working correctly',
        tags: ['Configuration'],
        responses: {
          '200': {
            description: 'Discord test notification sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    webhookUrl: { type: 'string', description: 'Webhook URL with token hidden' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Discord webhook not configured or test failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'string', description: 'Additional error details' }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/feeds': {
      get: {
        summary: 'List RSS Feeds',
        description: 'Get all configured RSS job feeds',
        tags: ['Feeds'],
        responses: {
          '200': {
            description: 'List of RSS feeds',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    feeds: {
                      type: 'array',
                      items: {
                        '$ref': '#/components/schemas/FeedConfig'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Add RSS Feed',
        description: 'Add a new RSS job feed to monitor',
        tags: ['Feeds'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'url', 'source', 'category'],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Human-readable name for the feed',
                    example: 'AngelList Jobs'
                  },
                  url: {
                    type: 'string',
                    format: 'uri',
                    description: 'RSS feed URL',
                    example: 'https://angel.co/company/jobs.rss'
                  },
                  source: {
                    type: 'string',
                    description: 'Source platform name',
                    example: 'AngelList'
                  },
                  category: {
                    type: 'string',
                    description: 'Feed category',
                    example: 'tech/startups'
                  },
                  params: {
                    type: 'object',
                    nullable: true,
                    additionalProperties: { type: 'string' },
                    description: 'Optional query parameters for the feed URL',
                    example: { "q": "developer", "location": "remote" }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Feed added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    feed: {
                      '$ref': '#/components/schemas/FeedConfig'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request data - missing required fields',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/jobs/status': {
      get: {
        summary: 'Job Statistics',
        description: 'Get statistics about processed jobs',
        tags: ['Jobs'],
        responses: {
          '200': {
            description: 'Job statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalJobs: {
                      type: 'integer',
                      description: 'Total number of unique jobs processed'
                    },
                    lastProcessed: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true,
                      description: 'Timestamp of last job processed'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/jobs/process': {
      post: {
        summary: 'Process Jobs',
        description: 'Process all feeds and find new jobs (same as /process endpoint)',
        tags: ['Jobs'],
        responses: {
          '200': {
            description: 'Feeds processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    newJobsFound: { type: 'integer' },
                    notificationSent: { type: 'boolean' },
                    notificationError: { type: 'string', nullable: true },
                    failedFeeds: { 
                      type: 'array', 
                      items: { type: 'string' },
                      nullable: true 
                    },
                    jobs: {
                      type: 'array',
                      description: 'Preview of first 5 new jobs found',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          title: { type: 'string' },
                          link: { type: 'string' },
                          description: { type: 'string' },
                          publishedAt: { type: 'string', format: 'date-time' },
                          source: { type: 'string' }
                        }
                      }
                    },
                    totalJobs: { type: 'integer' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Processing failed - check Discord configuration and feeds'
          }
        }
      }
    }
  },
  components: {
    schemas: {
      FeedConfig: {
        type: 'object',
        required: ['name', 'url', 'source', 'category'],
        properties: {
          id: { 
            type: 'string',
            description: 'Unique identifier for the feed'
          },
          name: { 
            type: 'string',
            description: 'Human-readable name for the feed',
            example: 'AngelList Jobs'
          },
          url: { 
            type: 'string', 
            format: 'uri',
            description: 'RSS feed URL',
            example: 'https://angel.co/company/jobs.rss'
          },
          source: { 
            type: 'string',
            description: 'Source platform name',
            example: 'AngelList'
          },
          category: { 
            type: 'string',
            description: 'Feed category for organization',
            example: 'remote/general'
          },
          params: { 
            type: 'object', 
            nullable: true,
            additionalProperties: { type: 'string' },
            description: 'Optional query parameters to append to feed URL',
            example: { "q": "developer", "location": "remote" }
          },
          enabled: { 
            type: 'boolean',
            description: 'Whether this feed is enabled for processing',
            default: true
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  tags: [
    {
      name: 'Health',
      description: 'API health and status endpoints'
    },
    {
      name: 'Configuration', 
      description: 'Discord webhook configuration and testing'
    },
    {
      name: 'Feeds',
      description: 'RSS feed management and configuration'
    },
    {
      name: 'Processing',
      description: 'Manual job processing and aggregation (automatic processing runs every 2 hours via cron)'
    },
    {
      name: 'Jobs',
      description: 'Job statistics and historical data'
    }
  ]
}
