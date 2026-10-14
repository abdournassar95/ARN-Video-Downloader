import { useState, useEffect } from 'react'
import { useSearchStore } from '../store/searchStore'

export default function VideoPlayer() {
  const { selectedVideo, isLoading } = useSearchStore()
  const [playerSize, setPlayerSize] = useState<'compact' | 'normal' | 'large'>('normal')
  const [isPreviewActive, setIsPreviewActive] = useState(true)

  // Automatically activate preview when user selects a new video
  useEffect(() => {
    if (selectedVideo) {
      setIsPreviewActive(true)
    }
  }, [selectedVideo?.id])

  // Stop preview whenever window is minimized or closed to tray
  useEffect(() => {
    window.api?.onStopPreview?.(() => {
      setIsPreviewActive(false)
    })
  }, [])

  if (isLoading && !selectedVideo) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500 dark:text-slate-400">جاري تحميل معلومات الفيديو...</p>
        </div>
      </div>
    )
  }

  if (!selectedVideo) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" opacity="0.3" />
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-400 mb-1">لا يوجد فيديو محدد</h2>
          <p className="text-xs text-slate-500">ابحث عن فيديو/قائمة أو أدخل رابطاً للمعاينة والتنزيل</p>
        </div>
      </div>
    )
  }

  const handleOpenExternal = () => {
    if (selectedVideo?.webpageUrl) {
      window.api?.openExternal(selectedVideo.webpageUrl)
    }
  }

  // Build embed URL for YouTube
  const embedUrl = getEmbedUrl(selectedVideo.webpageUrl)

  const sizeClasses = {
    compact: 'max-w-md max-h-48',
    normal: 'max-w-xl max-h-72',
    large: 'max-w-3xl max-h-96'
  }

  return (
    <div className="mb-4 bg-white/90 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm transition-colors duration-200">
      {/* Player Top Bar with Controls */}
      <div className="flex items-center justify-between mb-2.5 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isPreviewActive ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></span>
            معاينة الفيديو
          </span>
          {/* Quick preview toggle button */}
          <button
            type="button"
            onClick={() => setIsPreviewActive(!isPreviewActive)}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              isPreviewActive
                ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white'
                : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white'
            }`}
            title={isPreviewActive ? 'إيقاف المعاينة' : 'تشغيل المعاينة'}
          >
            {isPreviewActive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-sm bg-red-500"></span>
                إيقاف المعاينة
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                تشغيل المعاينة
              </>
            )}
          </button>

          {/* Open in YouTube browser button */}
          <button
            type="button"
            onClick={handleOpenExternal}
            className="text-[10px] px-2 py-0.5 rounded transition-colors flex items-center gap-1 bg-red-600/10 dark:bg-red-600/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20"
            title="فتح الفيديو في يوتيوب عبر المتصفح"
          >
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            فتح في YouTube
          </button>
        </div>

        {/* Size Toggles */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-colors">
          <button
            type="button"
            onClick={() => setPlayerSize('compact')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              playerSize === 'compact' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="حجم مدمج"
          >
            مدمج
          </button>
          <button
            type="button"
            onClick={() => setPlayerSize('normal')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              playerSize === 'normal' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="حجم عادي"
          >
            عادي
          </button>
          <button
            type="button"
            onClick={() => setPlayerSize('large')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              playerSize === 'large' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="حجم كبير"
          >
            كبير
          </button>
        </div>
      </div>

      {/* Preview Player Frame */}
      <div className={`relative bg-black rounded-xl overflow-hidden aspect-video ${sizeClasses[playerSize]} w-full mx-auto shadow-2xl border border-slate-700 transition-all duration-300`}>
        {embedUrl && isPreviewActive ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title={selectedVideo.title}
          />
        ) : (
          <div
            className="w-full h-full relative flex items-center justify-center group cursor-pointer"
            onClick={() => setIsPreviewActive(true)}
          >
            <img
              src={selectedVideo.thumbnail}
              alt={selectedVideo.title}
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/35 flex items-center justify-center gap-3 transition-all p-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsPreviewActive(true)
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold transition-transform transform group-hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                تشغيل المعاينة
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenExternal()
                }}
                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl shadow-lg flex items-center gap-1.5 text-xs font-semibold border border-slate-600 transition-transform transform group-hover:scale-105"
              >
                <svg className="w-3.5 h-3.5 fill-red-500" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                فتح في YouTube
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="mt-3 text-center">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 max-w-2xl mx-auto mb-1.5 transition-colors" dir="auto">
          {selectedVideo.title}
        </h2>
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 transition-colors">
          {selectedVideo.uploader && (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {selectedVideo.uploader}
            </span>
          )}
          {selectedVideo.durationString && (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span dir="ltr">{selectedVideo.durationString}</span>
            </span>
          )}
          {selectedVideo.viewCount > 0 && (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span dir="ltr">{formatViews(selectedVideo.viewCount)}</span> مشاهدة
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function getEmbedUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = ''
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1)
      } else {
        videoId = urlObj.searchParams.get('v') || ''
      }
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`
      }
    }

    return null
  } catch {
    return null
  }
}

function formatViews(views: number): string {
  if (views >= 1_000_000_000) return (views / 1_000_000_000).toFixed(1) + 'B'
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1) + 'M'
  if (views >= 1_000) return (views / 1_000).toFixed(1) + 'K'
  return views.toString()
}
