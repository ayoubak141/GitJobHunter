import { useState, useEffect } from 'react'
import { 
  CheckIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  XMarkIcon,
  BookmarkIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { api, type DiscordConfig, type TestResponse } from '../utils/api'

export default function Config() {
  const [config, setConfig] = useState<DiscordConfig | null>(null)
  const [testResult, setTestResult] = useState<TestResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [webhookUrl, setWebhookUrl] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [maxJobsPerMessage, setMaxJobsPerMessage] = useState(10)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getConfig()
      setConfig(data)
      
      if (data.configured) {
        setEnabled(data.enabled || false)
        setMaxJobsPerMessage(data.maxJobsPerMessage || 10)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!webhookUrl && !config?.configured) {
      setError('Webhook URL is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const configData: { webhookUrl?: string; enabled: boolean; maxJobsPerMessage: number } = {
        enabled,
        maxJobsPerMessage
      }
      
      if (webhookUrl) {
        configData.webhookUrl = webhookUrl
      }

      const result = await api.setConfig(configData)
      setSuccess(result.message)
      setWebhookUrl('') // Clear webhook URL input for security
      await loadConfig() // Reload to get updated config
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      setError(null)
      setSuccess(null)
      setTestResult(null)
      
      const result = await api.testDiscord()
      setTestResult(result)
      setSuccess(`Test successful! ${result.message}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test Discord webhook')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading configuration...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Discord Configuration</h2>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Configure Discord webhook for job notifications</p>
      </div>

      {/* Status Card */}
      <div style={{ 
        backgroundColor: 'var(--surface)', 
        borderRadius: 'var(--border-radius-lg)', 
        border: '1px solid var(--neutral-200)',
        boxShadow: 'var(--shadow-sm)',
        padding: 'var(--spacing-lg)'
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              {config?.configured ? 
                <CheckIcon className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: 'var(--status-success)' }} /> : 
                <ExclamationTriangleIcon className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: 'var(--status-warning)' }} />
              }
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                {config?.configured ? 'Discord Webhook Configured' : 'Discord Webhook Not Configured'}
              </h3>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {config?.configured 
                  ? `Notifications ${config.enabled ? 'enabled' : 'disabled'} • Max ${config.maxJobsPerMessage} jobs per message`
                  : 'Configure your Discord webhook to receive job notifications'
                }
              </p>
            </div>
          </div>
          {config?.configured && (
            <button
              onClick={handleTest}
              disabled={testing}
              className="button-secondary inline-flex items-center justify-center px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 touch-target w-full sm:w-auto"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'var(--text-muted)' }}></div>
                  Testing...
                </>
              ) : (
                <>
                  <BeakerIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Test Webhook</span>
                  <span className="sm:hidden">Test</span>
                </>
              )}
            </button>
          )}
        </div>
        
        {config?.configured && config.createdAt && (
          <div className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Created: {new Date(config.createdAt).toLocaleString()}
            {config.updatedAt && config.updatedAt !== config.createdAt && 
              ` • Updated: ${new Date(config.updatedAt).toLocaleString()}`
            }
          </div>
        )}
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

      {/* Test Result Details */}
      {testResult && (
        <div className="alert-info">
          <div className="flex items-start space-x-3">
            <BeakerIcon className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
            <div className="flex-1">
              <h3 className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Discord Test Results</h3>
              <div className="mt-2 text-sm space-y-1">
                <p><strong>Status:</strong> {testResult.success ? 'Success' : 'Failed'}</p>
                <p><strong>Webhook URL:</strong> {testResult.webhookUrl}</p>
                <p><strong>Test Time:</strong> {new Date(testResult.timestamp).toLocaleString()}</p>
                <p><strong>Message:</strong> {testResult.message}</p>
              </div>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Configuration Form */}
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
            {config?.configured ? 'Update Configuration' : 'Setup Discord Webhook'}
          </h3>
        </div>
        
        <form onSubmit={handleSave} style={{ padding: 'var(--spacing-lg)' }} className="space-y-6">
          {/* Webhook URL */}
          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Discord Webhook URL {!config?.configured && <span style={{ color: 'var(--accent-danger)' }}>*</span>}
            </label>
            <input
              type="url"
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder={config?.configured ? "Enter new webhook URL to update" : "https://discord.com/api/webhooks/..."}
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
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Get this from your Discord server's webhook settings. Must be a valid Discord webhook URL.
            </p>
          </div>

          {/* Enable/Disable */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded transition-colors"
                style={{ 
                  accentColor: 'var(--accent-primary)',
                  borderColor: 'var(--neutral-300)'
                }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable Discord notifications</span>
            </label>
            <p className="mt-1 text-xs ml-7" style={{ color: 'var(--text-secondary)' }}>
              When enabled, new job listings will be sent to your Discord channel
            </p>
          </div>

          {/* Max Jobs Per Message */}
          <div>
            <label htmlFor="maxJobs" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Max jobs per Discord message
            </label>
            <input
              type="number"
              id="maxJobs"
              min="1"
              max="10"
              value={maxJobsPerMessage}
              onChange={(e) => setMaxJobsPerMessage(parseInt(e.target.value))}
              className="w-20 sm:w-24 px-3 py-3 border focus:outline-none focus:ring-2 focus:border-transparent transition-colors touch-target"
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
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Number of job listings to include in each Discord message (1-10)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-stretch sm:justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center justify-center px-6 py-3 text-sm sm:text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target w-full sm:w-auto ${
                saving ? 'button-processing' : 'button-primary'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'var(--text-inverse)' }}></div>
                  Saving...
                </>
              ) : (
                <>
                  <BookmarkIcon className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">{config?.configured ? 'Update' : 'Save'} Configuration</span>
                  <span className="sm:hidden">{config?.configured ? 'Update' : 'Save'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="alert-info">
        <div className="flex items-start space-x-3">
          <LightBulbIcon className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h3 className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>How to create a Discord webhook</h3>
            <div className="mt-2 text-sm space-y-1">
              <p>1. Go to your Discord server settings</p>
              <p>2. Navigate to "Integrations" → "Webhooks"</p>
              <p>3. Click "New Webhook" or "Create Webhook"</p>
              <p>4. Choose the channel for job notifications</p>
              <p>5. Copy the webhook URL and paste it above</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
