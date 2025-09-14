import { useState, useEffect } from 'react'
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading jobs data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-500 text-xl mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Error loading data</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={loadJobsData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Process Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Jobs Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor and manage job feed processing</p>
        </div>
        <button
          onClick={handleProcessJobs}
          disabled={processing}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <span className="mr-2">🔄</span>
              Process Jobs Now
            </>
          )}
        </button>
      </div>

      {/* Process Result Alert */}
      {processResult && (
        <div className={`border rounded-lg p-4 ${
          processResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            <div className={`text-xl ${
              processResult.success ? 'text-green-500' : 'text-red-500'
            }`}>
              {processResult.success ? '✅' : '❌'}
            </div>
            <div className="flex-1">
              <h3 className={`font-medium ${
                processResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {processResult.message}
              </h3>
              {processResult.success && (
                <div className={`text-sm mt-1 ${
                  processResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  <p>Found {processResult.newJobsFound} new jobs from {processResult.totalJobs} total</p>
                  {processResult.notificationSent && <p>✅ Discord notification sent successfully</p>}
                  {processResult.notificationError && <p>⚠️ Notification error: {processResult.notificationError}</p>}
                  {processResult.failedFeeds && processResult.failedFeeds.length > 0 && (
                    <p>⚠️ Failed feeds: {processResult.failedFeeds.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setProcessResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📊</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{jobsData?.totalJobs || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">✨</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">New Jobs (Last Run)</dt>
                  <dd className="text-2xl font-semibold text-green-600">{processResult?.newJobsFound || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📡</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Feeds</dt>
                  <dd className="text-2xl font-semibold text-blue-600">{feeds.filter(f => f.enabled !== false).length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Preview */}
      {processResult?.jobs && processResult.jobs.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Jobs Found</h3>
            <p className="text-sm text-gray-500">Preview of the {processResult.jobs.length} most recent jobs from last processing</p>
          </div>
          <div className="divide-y divide-gray-200">
            {processResult.jobs.map((job) => (
              <div key={job.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 hover:text-blue-600">
                      <a href={job.link} target="_blank" rel="noopener noreferrer">
                        {job.title}
                      </a>
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
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
        <div className="bg-white shadow-sm rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-xl">⏰</div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Last Processed</h3>
                <p className="text-sm text-gray-500">
                  {new Date(jobsData.lastProcessed).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {Math.floor((Date.now() - new Date(jobsData.lastProcessed).getTime()) / (1000 * 60))} minutes ago
            </div>
          </div>
        </div>
      )}

      {/* Active Feeds List */}
      {feeds && feeds.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">RSS Feeds ({feeds.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {feeds.map((feed) => (
              <div key={feed.id || feed.name} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">📡</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">{feed.name}</h4>
                          {feed.enabled === false && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">Source: {feed.source}</p>
                        <p className="text-xs text-gray-400">Category: {feed.category}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    <a 
                      href={feed.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
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
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="text-6xl mb-4">📡</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No RSS feeds configured</h3>
          <p className="text-gray-500 mb-4">Add some RSS feeds to start aggregating job listings.</p>
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            Go to RSS Feeds →
          </button>
        </div>
      )}

      {/* Automatic Processing Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 text-xl">⏰</div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Automatic Processing</h3>
            <div className="mt-2 text-sm text-blue-700">
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
