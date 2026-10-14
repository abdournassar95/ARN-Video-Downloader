import { useEffect, useState } from 'react'
import SearchBar from './components/SearchBar'
import SearchResults from './components/SearchResults'
import VideoPlayer from './components/VideoPlayer'
import DownloadControls from './components/DownloadControls'
import DownloadQueue from './components/DownloadQueue'
import ThemeToggle from './components/ThemeToggle'
import AboutDialog from './components/AboutDialog'
import { useSearchStore } from './store/searchStore'
import { useDownloadStore } from './store/downloadStore'

function App() {
  const { initializeListeners } = useSearchStore()
  const { initializeListeners: initializeDownloadListeners } = useDownloadStore()
  const [isAboutOpen, setIsAboutOpen] = useState(false)

  useEffect(() => {
    initializeListeners()
    initializeDownloadListeners()
  }, [initializeListeners, initializeDownloadListeners])

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Application Header with ARN Branding */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/80 px-5 py-3 transition-colors duration-200 shadow-sm">
        {/* Brand Bar */}
        <div className="flex items-center justify-between mb-3">
          {/* Right (RTL start): Brand & Developer */}
          <div className="flex items-center gap-3">
            {/* Logo Badge */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-md shadow-blue-500/10 flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <span className="text-xs font-black tracking-wider bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  ARN
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  ARN Video Downloader
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                تطوير وبرمجة: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">عبده رجب نصار</span> &bull; ARN Technology
              </p>
            </div>
          </div>

          {/* Left (RTL end): Actions & Theme Controls */}
          <div className="flex items-center gap-2">
            {/* About Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all shadow-sm"
              title="حول البرنامج وحقوق الملكية"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>حول البرنامج</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Search Bar Row */}
        <SearchBar />
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Download Queue */}
        <aside className="w-80 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-l border-slate-200 dark:border-slate-700/70 overflow-y-auto transition-colors duration-200">
          <DownloadQueue />
        </aside>

        {/* Center Panel - Video Player & Controls */}
        <main className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4 transition-colors duration-200">
          <VideoPlayer />
          <DownloadControls />
        </main>

        {/* Right Panel - Search Results */}
        <aside className="w-96 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700/70 overflow-y-auto transition-colors duration-200">
          <SearchResults />
        </aside>
      </div>

      {/* About Dialog Modal */}
      <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  )
}

export default App
