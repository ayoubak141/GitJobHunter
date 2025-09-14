import { useState, useEffect } from 'react'
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading configuration...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Discord Configuration</h2>
        <p className="text-gray-600 mt-1">Configure Discord webhook for job notifications</p>
      </div>

      {/* Status Card */}
      <div className="bg-white shadow-sm rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`text-2xl ${config?.configured ? '✅' : '⚠️'}`}>
              {config?.configured ? '✅' : '⚠️'}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {config?.configured ? 'Discord Webhook Configured' : 'Discord Webhook Not Configured'}
              </h3>
              <p className="text-sm text-gray-500">
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                  Testing...
                </>
              ) : (
                <>
                  🧪 Test Webhook
                </>
              )}
            </button>
          )}
        </div>
        
        {config?.configured && config.createdAt && (
          <div className="mt-4 text-xs text-gray-400">
            Created: {new Date(config.createdAt).toLocaleString()}
            {config.updatedAt && config.updatedAt !== config.createdAt && 
              ` • Updated: ${new Date(config.updatedAt).toLocaleString()}`
            }
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 text-xl mr-3">❌</div>
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-500 text-xl mr-3">✅</div>
            <div className="text-green-800">{success}</div>
          </div>
        </div>
      )}

      {/* Test Result Details */}
      {testResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-500 text-xl">🧪</div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">Discord Test Results</h3>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p><strong>Status:</strong> {testResult.success ? 'Success' : 'Failed'}</p>
                <p><strong>Webhook URL:</strong> {testResult.webhookUrl}</p>
                <p><strong>Test Time:</strong> {new Date(testResult.timestamp).toLocaleString()}</p>
                <p><strong>Message:</strong> {testResult.message}</p>
              </div>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {config?.configured ? 'Update Configuration' : 'Setup Discord Webhook'}
          </h3>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Webhook URL */}
          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Discord Webhook URL {!config?.configured && <span className="text-red-500">*</span>}
            </label>
            <input
              type="url"
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder={config?.configured ? "Enter new webhook URL to update (leave empty to keep current)" : "https://discord.com/api/webhooks/..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Enable Discord notifications</span>
            </label>
            <p className="mt-1 text-xs text-gray-500 ml-7">
              When enabled, new job listings will be sent to your Discord channel
            </p>
          </div>

          {/* Max Jobs Per Message */}
          <div>
            <label htmlFor="maxJobs" className="block text-sm font-medium text-gray-700 mb-2">
              Max jobs per Discord message
            </label>
            <input
              type="number"
              id="maxJobs"
              min="1"
              max="10"
              value={maxJobsPerMessage}
              onChange={(e) => setMaxJobsPerMessage(parseInt(e.target.value))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of job listings to include in each Discord message (1-10)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  💾 {config?.configured ? 'Update' : 'Save'} Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 text-xl">💡</div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">How to create a Discord webhook</h3>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
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
