import { useTheme } from '../hooks/useTheme'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 border ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-700/90 text-amber-300 border-slate-700 shadow-sm shadow-amber-500/5'
          : 'bg-white hover:bg-slate-100 text-indigo-600 border-slate-200 shadow-sm shadow-indigo-500/5'
      } ${className}`}
      title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      aria-label="تبديل مظهر الواجهة"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          // Moon icon with stars
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 transition-transform duration-300 rotate-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            <path d="M19 3v4" strokeWidth="1.5" />
            <path d="M21 5h-4" strokeWidth="1.5" />
          </svg>
        ) : (
          // Sun icon with rays
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 transition-transform duration-300 rotate-90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
      </div>

      {showLabel && (
        <span className="mr-2 text-xs font-medium">
          {isDark ? 'الوضع المظلم' : 'الوضع الفاتح'}
        </span>
      )}
    </button>
  )
}
