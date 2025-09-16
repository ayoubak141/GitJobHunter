import { useState } from 'react'
import { 
  ChartBarIcon, 
  RssIcon, 
  CogIcon, 
  MagnifyingGlassIcon,
  BriefcaseIcon,
  SunIcon,
  MoonIcon 
} from '@heroicons/react/24/outline'
import Dashboard from './components/Dashboard'
import Config from './components/Config'
import Feeds from './components/Feeds'
import Jobs from './components/Jobs'
import Status from './components/Status'
import ThemeToggle from './components/ThemeToggle'
import { useTheme } from './contexts/ThemeContext'

type Tab = 'dashboard' | 'jobs' | 'feeds' | 'config' | 'status'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const { theme, toggleTheme } = useTheme()

  const tabs = [
    { id: 'dashboard' as const, name: 'Dashboard', icon: ChartBarIcon },
    { id: 'jobs' as const, name: 'Jobs', icon: BriefcaseIcon },
    { id: 'feeds' as const, name: 'RSS Feeds', icon: RssIcon },
    { id: 'config' as const, name: 'Configuration', icon: CogIcon },
    { id: 'status' as const, name: 'Status', icon: MagnifyingGlassIcon },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--primary-background)' }}>
      {/* Merged Header & Navigation */}
      <header className="sticky top-0 z-50" style={{ 
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--neutral-200)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div className="layout-container">
          <div className="flex items-center justify-between py-3 sm:py-4">
            {/* Left: Branding */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="brand-logo flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl" style={{ 
                backgroundColor: 'var(--accent-primary)',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}>
                <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: 'white', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
              </div>
              <div className="hidden xl:block">
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  GitJobHunter
                </h1>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Job Aggregation Platform
                </p>
              </div>
              <div className="hidden sm:block xl:hidden">
                <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  GitJobHunter
                </h1>
              </div>
              <div className="sm:hidden">
                <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  GJH
                </h1>
              </div>
            </div>

            {/* Center: Navigation */}
            <nav className="flex items-center justify-center flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-1 sm:mx-2 lg:mx-8">
              <div className="merged-header-nav flex items-center space-x-0.5 sm:space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      nav-pill relative inline-flex items-center justify-center px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium 
                      min-w-[2.5rem] sm:min-w-[2.75rem] md:min-w-0 flex-shrink-0 touch-target transition-all duration-200
                      ${activeTab === tab.id ? 'active' : ''}
                    `}
                    style={{
                      backgroundColor: activeTab === tab.id ? 'var(--surface)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: activeTab === tab.id ? '600' : '500'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        const target = e.target as HTMLElement
                        target.style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        const target = e.target as HTMLElement
                        target.style.color = 'var(--text-secondary)'
                      }
                    }}
                    title={tab.name}
                  >
                    <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:mr-2 flex-shrink-0" />
                    <span className="hidden md:inline text-xs lg:text-sm whitespace-nowrap overflow-hidden">
                      {tab.name}
                    </span>
                    <span className="md:hidden sr-only">{tab.name}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Right: Status & Theme Toggle */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs" style={{
                backgroundColor: 'var(--surface-variant)',
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--status-success)' }}></div>
                <span className="font-medium">Live</span>
              </div>
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <div className="md:hidden">
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-target"
                  style={{ 
                    backgroundColor: 'var(--surface-variant)',
                    color: 'var(--text-secondary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? (
                    <MoonIcon className="w-4 h-4" style={{ color: 'inherit' }} />
                  ) : (
                    <SunIcon className="w-4 h-4" style={{ color: 'inherit' }} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with improved spacing */}
      <main className="layout-container" style={{ 
        paddingTop: 'var(--spacing-2xl)', 
        paddingBottom: 'var(--spacing-2xl)',
        minHeight: 'calc(100vh - 80px)'
      }}>
        <div className="animate-fadeIn">
          {activeTab === 'dashboard' && <Dashboard onTabChange={setActiveTab} />}
          {activeTab === 'jobs' && <Jobs />}
          {activeTab === 'feeds' && <Feeds />}
          {activeTab === 'config' && <Config />}
          {activeTab === 'status' && <Status />}
        </div>
      </main>
    </div>
  )
}

export default App