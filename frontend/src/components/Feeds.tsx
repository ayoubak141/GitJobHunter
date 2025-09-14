import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  PlusIcon,
  CheckIcon,
  BookmarkIcon,
  RssIcon,
  BuildingOfficeIcon,
  FolderIcon,
  TagIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { api, type FeedConfig } from '../utils/api'

export default function Feeds() {
  const [feeds, setFeeds] = useState<FeedConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    source: '',
    category: '',
    tags: ''
  })

  useEffect(() => {
    loadFeeds()
  }, [])

  const loadFeeds = async () => {
    try {
      setLoading(true)
      setError(null)
      const feedsData = await api.getFeeds()
      setFeeds(feedsData.feeds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feeds')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.url || !formData.source || !formData.category) {
      setError('Name, URL, Source, and Category are required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const feedData = {
        name: formData.name.trim(),
        url: formData.url.trim(),
        source: formData.source.trim(),
        category: formData.category.trim(),
        params: formData.tags.trim() ? { tags: formData.tags.trim() } : undefined
      }

      const result = await api.addFeed(feedData)
      setSuccess(`RSS feed "${result.feed.name}" added successfully!`)
      
      // Reset form
      setFormData({
        name: '',
        url: '',
        source: '',
        category: '',
        tags: ''
      })
      setShowAddForm(false)
      
      // Reload feeds
      await loadFeeds()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add RSS feed')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading RSS feeds...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RSS Feeds Management</h2>
          <p className="text-gray-600 mt-1">Configure RSS feeds for job aggregation</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {showAddForm ? (
            <><XMarkIcon className="h-5 w-5 mr-2" /> Cancel</>
          ) : (
            <><PlusIcon className="h-5 w-5 mr-2" /> Add RSS Feed</>
          )}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XMarkIcon className="h-6 w-6 text-red-500 mr-3" />
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckIcon className="h-6 w-6 text-green-500 mr-3" />
            <div className="text-green-800">{success}</div>
          </div>
        </div>
      )}

      {/* Add Feed Form */}
      {showAddForm && (
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Add New RSS Feed</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feed Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Feed Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Remote Developer Jobs"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Source */}
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                  Source <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  placeholder="e.g., RemoteOK, Indeed, LinkedIn"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* RSS URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                RSS Feed URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://example.com/jobs.rss"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., remote/developer, frontend, backend"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., javascript, react, remote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <><BookmarkIcon className="h-5 w-5 mr-2" /> Add Feed</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feeds List */}
      {feeds.length > 0 ? (
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              RSS Feeds ({feeds.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {feeds.map((feed) => (
              <div key={feed.id || feed.name} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <RssIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-medium text-gray-900">{feed.name}</h4>
                          {feed.enabled === false && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              Disabled
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="inline-flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                            {feed.source}
                          </span>
                          <span className="inline-flex items-center">
                            <FolderIcon className="h-4 w-4 mr-1" />
                            {feed.category}
                          </span>
                          {feed.params?.tags && (
                            <span className="inline-flex items-center">
                              <TagIcon className="h-4 w-4 mr-1" />
                              {feed.params.tags}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <a 
                        href={feed.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {feed.url}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border">
          <RssIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No RSS feeds configured</h3>
          <p className="text-gray-500 mb-4">Add your first RSS feed to start aggregating job listings.</p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            <PlusIcon className="h-4 w-4 inline mr-1" /> Add RSS Feed
          </button>
        </div>
      )}

      {/* Popular RSS Feeds Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <LightBulbIcon className="h-6 w-6 text-blue-500" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-3">Popular Job RSS Feeds</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <div className="flex justify-between items-center">
                <span>• RemoteOK: https://remoteok.io/remote-jobs.rss</span>
              </div>
              <div className="flex justify-between items-center">
                <span>• We Work Remotely: https://weworkremotely.com/remote-jobs.rss</span>
              </div>
              <div className="flex justify-between items-center">
                <span>• AngelList: https://angel.co/jobs.rss</span>
              </div>
              <div className="flex justify-between items-center">
                <span>• Stack Overflow Jobs: https://stackoverflow.com/jobs/feed</span>
              </div>
              <p className="text-xs text-blue-600 mt-3">
                Note: Verify RSS URLs are still active before adding them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
