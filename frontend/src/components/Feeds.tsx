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
        params: formData.tags.trim() ? { tags: formData.tags.trim() } : null
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading RSS feeds...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>RSS Feeds Management</h2>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Configure RSS feeds for job aggregation</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`inline-flex items-center justify-center px-4 sm:px-6 py-3 text-sm sm:text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors touch-target w-full sm:w-auto ${
            showAddForm ? 'button-secondary' : 'button-primary'
          }`}
        >
          {showAddForm ? (
            <><XMarkIcon className="h-5 w-5 mr-2" /> Cancel</>
          ) : (
            <>
              <PlusIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Add RSS Feed</span>
              <span className="sm:hidden">Add Feed</span>
            </>
          )}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="alert-error">
          <div className="flex items-center">
            <XMarkIcon className="h-6 w-6 mr-3" style={{ color: 'var(--accent-danger)' }} />
            <div>{error}</div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="alert-success">
          <div className="flex items-center">
            <CheckIcon className="h-6 w-6 mr-3" style={{ color: 'var(--accent-success)' }} />
            <div>{success}</div>
          </div>
        </div>
      )}

      {/* Add Feed Form */}
      {showAddForm && (
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
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Add New RSS Feed</h3>
          </div>
          
          <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 mobile-form-grid" style={{ gap: 'var(--spacing-md) var(--spacing-lg)' }}>
              {/* Feed Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Feed Name <span style={{ color: 'var(--accent-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Remote Developer Jobs"
                  className="w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:border-transparent transition-colors touch-target"
                  style={{ 
                    borderColor: 'var(--neutral-300)',
                    borderRadius: 'var(--border-radius-lg)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '16px', // Prevents zoom on iOS
                    minHeight: '48px' // Better touch target
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'transparent'
                    e.target.style.boxShadow = '0 0 0 2px var(--accent-primary)'
                    e.target.style.backgroundColor = 'var(--surface)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--neutral-300)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Source */}
              <div>
                <label htmlFor="source" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Source <span style={{ color: 'var(--accent-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  placeholder="e.g., RemoteOK, Indeed, LinkedIn"
                  className="w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:border-transparent transition-colors touch-target"
                  style={{ 
                    borderColor: 'var(--neutral-300)',
                    borderRadius: 'var(--border-radius-lg)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '16px', // Prevents zoom on iOS
                    minHeight: '48px' // Better touch target
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'transparent'
                    e.target.style.boxShadow = '0 0 0 2px var(--accent-primary)'
                    e.target.style.backgroundColor = 'var(--surface)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--neutral-300)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* RSS URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                RSS Feed URL <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://example.com/jobs.rss"
                className="w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:border-transparent transition-colors touch-target"
                style={{ 
                  borderColor: 'var(--neutral-300)',
                  borderRadius: 'var(--border-radius-lg)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '16px', // Prevents zoom on iOS
                  minHeight: '48px' // Better touch target
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'transparent'
                  e.target.style.boxShadow = '0 0 0 2px var(--accent-primary)'
                  e.target.style.backgroundColor = 'var(--surface)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--neutral-300)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--spacing-lg)' }}>
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Category <span style={{ color: 'var(--accent-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., remote/developer, frontend, backend"
                  className="w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:border-transparent transition-colors touch-target"
                  style={{ 
                    borderColor: 'var(--neutral-300)',
                    borderRadius: 'var(--border-radius-lg)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '16px', // Prevents zoom on iOS
                    minHeight: '48px' // Better touch target
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'transparent'
                    e.target.style.boxShadow = '0 0 0 2px var(--accent-primary)'
                    e.target.style.backgroundColor = 'var(--surface)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--neutral-300)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., javascript, react, remote"
                  className="w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:border-transparent transition-colors touch-target"
                  style={{ 
                    borderColor: 'var(--neutral-300)',
                    borderRadius: 'var(--border-radius-lg)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '16px', // Prevents zoom on iOS
                    minHeight: '48px' // Better touch target
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'transparent'
                    e.target.style.boxShadow = '0 0 0 2px var(--accent-primary)'
                    e.target.style.backgroundColor = 'var(--surface)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--neutral-300)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 mobile-button-stack">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="button-secondary px-4 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-target"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center justify-center px-6 py-3 sm:py-2 text-sm sm:text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target ${
                  saving ? 'button-processing' : 'button-success'
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'var(--text-inverse)' }}></div>
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
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              RSS Feeds ({feeds.length})
            </h3>
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <RssIcon className="h-5 w-5" style={{ color: feed.enabled === false ? 'var(--feed-inactive)' : 'var(--feed-active)' }} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{feed.name}</h4>
                          {feed.enabled === false && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full" style={{
                              backgroundColor: 'var(--neutral-100)',
                              color: 'var(--text-secondary)'
                            }}>
                              Disabled
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                        className="break-all transition-colors"
                        style={{ color: 'var(--accent-primary)' }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--accent-secondary)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--accent-primary)'}
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
        <div className="text-center py-12" style={{ 
          backgroundColor: 'var(--surface)', 
          borderRadius: 'var(--border-radius-lg)', 
          border: '1px solid var(--neutral-200)'
        }}>
          <RssIcon className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No RSS feeds configured</h3>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Add your first RSS feed to start aggregating job listings.</p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="font-medium transition-colors inline-flex items-center"
            style={{ color: 'var(--accent-primary)' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent-secondary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--accent-primary)'}
          >
            <PlusIcon className="h-4 w-4 inline mr-1" /> Add RSS Feed
          </button>
        </div>
      )}

      {/* Popular RSS Feeds Section */}
      <div className="alert-info">
        <div className="flex items-start space-x-3">
          <LightBulbIcon className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--accent-primary)' }}>Popular Job RSS Feeds</h3>
            <div className="text-sm space-y-2">
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
              <p className="text-xs mt-3" style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>
                Note: Verify RSS URLs are still active before adding them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
