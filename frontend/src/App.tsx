import { useState } from 'react'
import { 
  ChartBarIcon, 
  RssIcon, 
  CogIcon, 
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import Dashboard from './components/Dashboard'
import Config from './components/Config'
import Feeds from './components/Feeds'
import Status from './components/Status'

type Tab = 'dashboard' | 'feeds' | 'config' | 'status'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const tabs = [
    { id: 'dashboard' as const, name: 'Dashboard', icon: ChartBarIcon },
    { id: 'feeds' as const, name: 'RSS Feeds', icon: RssIcon },
    { id: 'config' as const, name: 'Configuration', icon: CogIcon },
    { id: 'status' as const, name: 'Status', icon: MagnifyingGlassIcon },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--primary-background)' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'var(--surface)', 
        borderBottom: '1px solid var(--neutral-200)',
        padding: 'var(--spacing-lg)'
      }}>
        <div className="layout-container">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <MagnifyingGlassIcon className="h-8 w-8" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>GitJobHunter</h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Automated Job Aggregation Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ 
        backgroundColor: 'var(--surface)', 
        borderBottom: '1px solid var(--neutral-200)' 
      }}>
        <div className="layout-container">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-base ${
                  activeTab === tab.id ? 'tab-active' : 'tab-hover'
                } inline-flex items-center`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="layout-container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'feeds' && <Feeds />}
        {activeTab === 'config' && <Config />}
        {activeTab === 'status' && <Status />}
      </main>
    </div>
  )
}

export default App