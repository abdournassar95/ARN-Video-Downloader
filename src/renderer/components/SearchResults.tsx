import { useState, useRef } from 'react'
import { useSearchStore, type VideoInfo } from '../store/searchStore'
import PlaylistView from './PlaylistView'

export default function SearchResults() {
  const { searchResults, isLoading, currentPlaylist, selectVideo, analyzeUrl } = useSearchStore()

  if (currentPlaylist) {
    return <PlaylistView />
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-300 transition-colors">نتائج البحث</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg transition-colors">
              <div className="w-32 h-20 bg-slate-200 dark:bg-slate-600 rounded-lg flex-shrink-0 transition-colors"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-3/4 transition-colors"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2 transition-colors"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/4 transition-colors"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (searchResults.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400 dark:text-slate-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-400 mb-1 transition-colors">نتائج البحث</h3>
        <p className="text-sm text-slate-500">ابحث عن فيديوهات أو قوائم تشغيل</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-300 flex items-center gap-2 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        نتائج البحث
        <span className="text-sm text-slate-500 font-normal">({searchResults.length})</span>
      </h3>
      <div className="space-y-3">
        {searchResults.map((item) => (
          <VideoCard
            key={item.id}
            video={item}
            onClick={() => {
              if (item.isPlaylist) {
                analyzeUrl(item.webpageUrl)
              } else {
                selectVideo(item)
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}

function VideoCard({ video, onClick }: { video: VideoInfo; onClick: () => void }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (e: React.MouseEvent) => {
    setCoords({ x: e.clientX, y: e.clientY })
    hoverTimeout.current = setTimeout(() => setShowTooltip(true), 400)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setCoords({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setShowTooltip(false)
  }

  return (
    <>
      <button
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`w-full flex gap-3 p-2.5 rounded-xl transition-all text-right group border ${
          video.isPlaylist
            ? 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800/40'
            : 'bg-white dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600/30 shadow-sm dark:shadow-none'
        }`}
      >
        {/* Thumbnail */}
        <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-600 transition-colors">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}
          {video.isPlaylist ? (
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-purple-700/90 text-white text-[10px] font-medium rounded flex items-center gap-1 shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
              </svg>
              قائمة تشغيل
            </span>
          ) : video.durationString ? (
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
              {video.durationString}
            </span>
          ) : null}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" dir="auto">
            {video.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate transition-colors">{video.uploader}</p>
          {video.viewCount > 0 && (
            <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5 transition-colors">
              {formatViews(video.viewCount)} مشاهدة
            </p>
          )}
        </div>
      </button>

      {/* Floating Tooltip */}
      {showTooltip && (
        <div 
          className="fixed z-[9999] w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden pointer-events-none animate-in fade-in transition-colors"
          style={{ 
            top: Math.min(coords.y + 15, window.innerHeight - 260) + 'px', 
            // Position tooltip to the left of the cursor to avoid clipping by screen edges
            left: Math.max(20, coords.x - 300) + 'px' 
          }}
        >
          {video.thumbnail ? (
            <img src={video.thumbnail} className="w-full aspect-video object-cover bg-slate-100 dark:bg-slate-900" />
          ) : (
            <div className="w-full aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-300 dark:text-slate-700" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}
          <div className="p-3">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 transition-colors" dir="auto">{video.title}</h4>
            <div className="flex justify-between items-center mt-2">
               <p className="text-xs text-slate-500 dark:text-slate-400 truncate ml-2 transition-colors">{video.uploader}</p>
               {video.durationString && (
                 <span className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded-md flex-shrink-0 transition-colors">
                   {video.durationString}
                 </span>
               )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function formatViews(views: number): string {
  if (views >= 1_000_000_000) return (views / 1_000_000_000).toFixed(1) + 'B'
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1) + 'M'
  if (views >= 1_000) return (views / 1_000).toFixed(1) + 'K'
  return views.toString()
}
