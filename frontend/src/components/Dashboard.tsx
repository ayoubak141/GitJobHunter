import { useState, useEffect } from 'react'
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  CheckIcon, 
  XMarkIcon,
  ChartBarIcon,
  SparklesIcon,
  RssIcon,
  ClockIcon 
} from '@heroicons/react/24/outline'
import { api, type JobsStats, type FeedConfig, type ProcessResponse } from '../utils/api'

export default function Dashboard() {
  const [jobsData, setJobsData] = useState<JobsStats | null>(null)
  const [feeds, setFeeds] = useState<FeedConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<ProcessResponse | null>(null)

  useEffect(() => {
    loadJobsData()
  }, [])

  const loadJobsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [jobsData, feedsData] = await Promise.all([
        api.getJobs(),
        api.getFeeds()
      ])
      setJobsData(jobsData)
      setFeeds(feedsData.feeds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessJobs = async () => {
    try {
      setProcessing(true)
      setError(null)
      const result = await api.processJobs()
      setProcessResult(result)
      // Refresh data after processing
      await loadJobsData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process jobs')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading jobs data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert-error">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 mr-3" style={{ color: 'var(--accent-danger)' }} />
          <div>
            <h3 className="font-medium" style={{ color: 'var(--accent-danger)' }}>Error loading data</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--accent-danger)' }}>{error}</p>
          </div>
        </div>
        <button
          onClick={loadJobsData}
          className="button-danger mt-3 px-4 py-2"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Process Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Jobs Dashboard</h2>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Monitor and manage job feed processing</p>
        </div>
        <button
          onClick={handleProcessJobs}
          disabled={processing}
          className={`inline-flex items-center justify-center px-4 sm:px-6 py-3 text-sm sm:text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target w-full sm:w-auto ${
            processing ? 'button-processing' : 'button-primary'
          }`}
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'var(--text-inverse)' }}></div>
              Processing...
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Process Jobs Now</span>
              <span className="sm:hidden">Process Now</span>
            </>
          )}
        </button>
      </div>

      {/* Process Result Alert */}
      {processResult && (
        <div className={processResult.success ? 'alert-success' : 'alert-error'}>
          <div className="flex items-start space-x-3">
            <div className="text-xl">
              {processResult.success ? (
                <CheckIcon className="h-6 w-6" style={{ color: 'var(--accent-success)' }} />
              ) : (
                <XMarkIcon className="h-6 w-6" style={{ color: 'var(--accent-danger)' }} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">
                {processResult.message}
              </h3>
              {processResult.success && (
                <div className="text-sm mt-1">
                  <p>Found {processResult.newJobsFound} new jobs from {processResult.totalJobs} total</p>
                  {processResult.notificationSent && <p><CheckIcon className="h-4 w-4 inline mr-1" /> Discord notification sent successfully</p>}
                  {processResult.notificationError && <p><ExclamationTriangleIcon className="h-4 w-4 inline mr-1" /> Notification error: {processResult.notificationError}</p>}
                  {processResult.failedFeeds && processResult.failedFeeds.length > 0 && (
                    <p><ExclamationTriangleIcon className="h-4 w-4 inline mr-1" /> Failed feeds: {processResult.failedFeeds.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setProcessResult(null)}
              className="hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'var(--spacing-lg)' }}>
        <div className="stats-card overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div style={{ marginLeft: 'var(--spacing-lg)' }} className="w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>Total Jobs</dt>
                <dd className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{jobsData?.totalJobs || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="stats-card overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-8 w-8" style={{ color: 'var(--job-new)' }} />
            </div>
            <div style={{ marginLeft: 'var(--spacing-lg)' }} className="w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>New Jobs (Last Run)</dt>
                <dd className="text-2xl font-semibold" style={{ color: 'var(--job-new)' }}>{processResult?.newJobsFound || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="stats-card overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <RssIcon className="h-8 w-8" style={{ color: 'var(--feed-active)' }} />
            </div>
            <div style={{ marginLeft: 'var(--spacing-lg)' }} className="w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>Active Feeds</dt>
                <dd className="text-2xl font-semibold" style={{ color: 'var(--feed-active)' }}>{feeds.filter(f => f.enabled !== false).length}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Preview */}
      {processResult?.jobs && processResult.jobs.length > 0 && (
        <div style={{ 
          backgroundColor: 'var(--surface)', 
          borderRadius: 'var(--border-radius-lg)', 
          border: '1px solid var(--neutral-200)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ 
            padding: 'var(--spacing-lg)', 
            borderBottom: '1px solid var(--neutral-200)' 
          }}>
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Recent Jobs Found</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Preview of the {processResult.jobs.length} most recent jobs from last processing</p>
          </div>
          <div style={{ borderTop: '1px solid var(--neutral-200)' }}>
            {processResult.jobs.map((job, index) => (
              <div key={job.id} className={`job-card ${index === 0 ? 'new' : ''}`} style={{
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: index === 0 ? 'none' : '1px solid var(--neutral-200)',
                borderBottom: 'none',
                borderRadius: 0
              }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium hover:opacity-80 transition-opacity">
                      <a 
                        href={job.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = 'var(--accent-primary)'}
                        onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = 'var(--text-primary)'}
                      >
                        {job.title}
                      </a>
                    </h4>
                    <p className="text-sm mt-1 overflow-hidden line-clamp-2" style={{
                      color: 'var(--text-secondary)',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2
                    }}>{job.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>Source: {job.source}</span>
                      <span>Published: {new Date(job.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Processed */}
      {jobsData?.lastProcessed && (
        <div style={{ 
          backgroundColor: 'var(--surface)', 
          borderRadius: 'var(--border-radius-lg)', 
          border: '1px solid var(--neutral-200)',
          boxShadow: 'var(--shadow-sm)',
          padding: 'var(--spacing-lg)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-6 w-6" style={{ color: 'var(--text-secondary)' }} />
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Last Processed</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(jobsData.lastProcessed).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {Math.floor((Date.now() - new Date(jobsData.lastProcessed).getTime()) / (1000 * 60))} minutes ago
            </div>
          </div>
        </div>
      )}

      {/* Active Feeds List */}
      {feeds && feeds.length > 0 && (
        <div style={{ 
          backgroundColor: 'var(--surface)', 
          borderRadius: 'var(--border-radius-lg)', 
          border: '1px solid var(--neutral-200)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ 
            padding: 'var(--spacing-lg)', 
            borderBottom: '1px solid var(--neutral-200)' 
          }}>
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>RSS Feeds ({feeds.length})</h3>
          </div>
          <div style={{ borderTop: '1px solid var(--neutral-200)' }}>
            {feeds.map((feed) => (
              <div key={feed.id || feed.name} className={`feed-card ${feed.enabled === false ? 'disabled' : 'active'}`} style={{
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: '1px solid var(--neutral-200)',
                borderBottom: 'none',
                borderRadius: 0
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <RssIcon className="h-5 w-5" style={{ color: feed.enabled === false ? 'var(--feed-inactive)' : 'var(--feed-active)' }} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{feed.name}</h4>
                          {feed.enabled === false && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full" style={{
                              backgroundColor: 'var(--neutral-100)',
                              color: 'var(--text-secondary)'
                            }}>
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Source: {feed.source}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Category: {feed.category}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <a 
                      href={feed.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="transition-colors"
                      style={{ color: 'var(--accent-primary)' }}
                      onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = 'var(--accent-secondary)'}
                      onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = 'var(--accent-primary)'}
                    >
                      View RSS →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!feeds || feeds.length === 0) && (
        <div className="text-center py-12" style={{ 
          backgroundColor: 'var(--surface)', 
          borderRadius: 'var(--border-radius-lg)', 
          border: '1px solid var(--neutral-200)'
        }}>
          <RssIcon className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No RSS feeds configured</h3>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Add some RSS feeds to start aggregating job listings.</p>
          <button className="font-medium transition-colors" style={{ color: 'var(--accent-primary)' }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.color = 'var(--accent-secondary)'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.color = 'var(--accent-primary)'}
          >
            Go to RSS Feeds →
          </button>
        </div>
      )}

      {/* Automatic Processing Info */}
      <div className="alert-info">
        <div className="flex items-start space-x-3">
          <ClockIcon className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h3 className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Automatic Processing</h3>
            <div className="mt-2 text-sm">
              <p>• Jobs are automatically processed every 2 hours via Cloudflare cron triggers</p>
              <p>• Manual processing is available above for immediate updates</p>
              <p>• Discord notifications are sent automatically when configured</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
