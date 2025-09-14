import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
      style={{ 
        backgroundColor: 'var(--surface-variant)',
        color: 'var(--text-secondary)',
        boxShadow: 'var(--shadow-sm)'
      }}
      onMouseEnter={(e) => {
        const target = e.target as HTMLElement
        target.style.backgroundColor = 'var(--neutral-300)'
        target.style.color = 'var(--text-primary)'
        target.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={(e) => {
        const target = e.target as HTMLElement
        target.style.backgroundColor = 'var(--surface-variant)'
        target.style.color = 'var(--text-secondary)'
        target.style.boxShadow = 'var(--shadow-sm)'
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        {theme === 'light' ? (
          <MoonIcon 
            className="w-5 h-5 transition-all duration-300 rotate-0 hover:rotate-12" 
            style={{ color: 'inherit' }}
          />
        ) : (
          <SunIcon 
            className="w-5 h-5 transition-all duration-300 rotate-0 hover:rotate-12" 
            style={{ color: 'inherit' }}
          />
        )}
      </div>
    </button>
  )
}
