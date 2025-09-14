import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Config from './components/Config'
import Feeds from './components/Feeds'
import Status from './components/Status'

type Tab = 'dashboard' | 'feeds' | 'config' | 'status'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const tabs = [
    { id: 'dashboard' as const, name: 'Dashboard', icon: '📊' },
    { id: 'feeds' as const, name: 'RSS Feeds', icon: '📡' },
    { id: 'config' as const, name: 'Configuration', icon: '⚙️' },
    { id: 'status' as const, name: 'Status', icon: '🔍' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">🔍</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">GitJobHunter</h1>
                <p className="text-sm text-gray-500">Automated Job Aggregation Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'feeds' && <Feeds />}
        {activeTab === 'config' && <Config />}
        {activeTab === 'status' && <Status />}
      </main>
    </div>
  )
}

export default App