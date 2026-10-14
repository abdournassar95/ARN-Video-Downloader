import { useState, useRef } from 'react'
import { useSearchStore, type VideoInfo } from '../store/searchStore'
import { useDownloadStore } from '../store/downloadStore'

export default function PlaylistView() {
  const { currentPlaylist, playlistVideos, closePlaylist, selectVideo } = useSearchStore()
  const { startDownload, startBatchDownload } = useDownloadStore()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(playlistVideos.map((v) => v.id)))
  const [downloadFormat, setDownloadFormat] = useState<'video' | 'audio'>('video')
  const [selectedQuality, setSelectedQuality] = useState('best')
  const [isStartingBatch, setIsStartingBatch] = useState(false)

  if (!currentPlaylist) return null

  const isAllSelected = playlistVideos.length > 0 && selectedIds.size === playlistVideos.length
  const isNoneSelected = selectedIds.size === 0

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(playlistVideos.map((v) => v.id)))
    }
  }

  const toggleSelectVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDownloadSelected = async () => {
    const selectedVideos = playlistVideos.filter((v) => selectedIds.has(v.id))
    if (selectedVideos.length === 0) return

    setIsStartingBatch(true)
    try {
      await startBatchDownload(
        selectedVideos.map((v) => ({
          url: v.webpageUrl,
          title: v.title,
          thumbnail: v.thumbnail
        })),
        selectedQuality,
        downloadFormat === 'audio'
      )
    } finally {
      setIsStartingBatch(false)
    }
  }

  const handleDownloadSingle = (video: VideoInfo, e: React.MouseEvent) => {
    e.stopPropagation()
    startDownload(
      video.webpageUrl,
      video.title,
      video.thumbnail,
      selectedQuality,
      downloadFormat === 'audio'
    )
  }

  return (
    <div className="p-4 flex flex-col h-full">
      {/* Back button */}
      <button
        onClick={closePlaylist}
        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mb-3 transition-colors self-start font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
        العودة لنتائج البحث
      </button>

      {/* Playlist Header Card */}
      <div className="bg-slate-100 dark:bg-slate-700/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-600/60 mb-3 transition-colors">
        <div className="flex gap-3">
          {currentPlaylist.thumbnail && (
            <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800">
              <img src={currentPlaylist.thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-600/30 border border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-[10px] rounded font-medium">
                قائمة تشغيل
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentPlaylist.playlistCount || playlistVideos.length} فيديو
              </span>
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2" dir="auto">
              {currentPlaylist.title}
            </h3>
            {currentPlaylist.uploader && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{currentPlaylist.uploader}</p>
            )}
          </div>
        </div>

        {/* Format Selector & Batch Download Bar */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600/40 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            {/* Format & Quality choice */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-600/60 transition-colors">
                <button
                  type="button"
                  onClick={() => setDownloadFormat('video')}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${downloadFormat === 'video'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  🎬 فيديو (MP4)
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadFormat('audio')}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${downloadFormat === 'audio'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  🎵 صوت (MP3)
                </button>
              </div>

              {downloadFormat === 'video' && (
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value)}
                  className="px-2 py-1 text-[11px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600/60 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
                >
                  <option value="best">أفضل جودة</option>
                  <option value="bestvideo[height<=1080]+bestaudio/best">1080p</option>
                  <option value="bestvideo[height<=720]+bestaudio/best">720p</option>
                  <option value="bestvideo[height<=480]+bestaudio/best">480p</option>
                  <option value="bestvideo[height<=360]+bestaudio/best">360p</option>
                </select>
              )}
            </div>

            {/* Selection info */}
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              محدد: <strong className="text-blue-600 dark:text-blue-400">{selectedIds.size}</strong> من {playlistVideos.length}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadSelected}
              disabled={isNoneSelected || isStartingBatch}
              className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isStartingBatch ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>جاري الإضافة...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>تنزيل المحدد ({selectedIds.size})</span>
                </>
              )}
            </button>

            <button
              onClick={toggleSelectAll}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors border border-slate-600/60"
            >
              {isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
            </button>
          </div>
        </div>
      </div>

      {/* Videos List */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
        {playlistVideos.map((video, index) => (
          <PlaylistItemRow
            key={video.id}
            video={video}
            index={index}
            isSelected={selectedIds.has(video.id)}
            selectVideo={selectVideo}
            toggleSelectVideo={toggleSelectVideo}
            handleDownloadSingle={handleDownloadSingle}
          />
        ))}
      </div>
    </div>
  )
}

interface PlaylistItemRowProps {
  video: VideoInfo
  index: number
  isSelected: boolean
  selectVideo: (video: VideoInfo) => void
  toggleSelectVideo: (id: string, e: React.MouseEvent) => void
  handleDownloadSingle: (video: VideoInfo, e: React.MouseEvent) => void
}

function PlaylistItemRow({ video, index, isSelected, selectVideo, toggleSelectVideo, handleDownloadSingle }: PlaylistItemRowProps) {
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
      <div
        onClick={() => selectVideo(video)}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer group ${isSelected
            ? 'bg-blue-50 dark:bg-slate-700/70 border-blue-500/40 shadow-sm'
            : 'bg-white dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => toggleSelectVideo(video.id, e)}
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors border ${isSelected
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'border-slate-300 dark:border-slate-500 hover:border-blue-400 bg-white dark:bg-slate-800'
            }`}
        >
          {isSelected && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        {/* Index */}
        <span className="text-xs text-slate-400 dark:text-slate-500 w-4 flex-shrink-0 text-center font-mono">
          {index + 1}
        </span>

        {/* Thumbnail */}
        <div className="relative w-20 h-12 flex-shrink-0 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800">
          {video.thumbnail ? (
            <img src={video.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}
          {video.durationString && (
            <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 bg-black/80 text-white text-[9px] rounded font-mono">
              {video.durationString}
            </span>
          )}
        </div>

        {/* Title & info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" dir="auto">
            {video.title}
          </h4>
          {video.uploader && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{video.uploader}</p>
          )}
        </div>

        {/* Download single button */}
        <button
          type="button"
          onClick={(e) => handleDownloadSingle(video, e)}
          title="تنزيل هذا الفيديو فقط"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-600 text-slate-600 dark:text-slate-400 hover:text-white transition-colors flex-shrink-0 border border-slate-200 dark:border-slate-600/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* Floating Tooltip */}
      {showTooltip && (
        <div
          className="fixed z-[9999] w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden pointer-events-none animate-in fade-in"
          style={{
            top: Math.min(coords.y + 15, window.innerHeight - 260) + 'px',
            left: Math.max(20, coords.x - 300) + 'px'
          }}
        >
          {video.thumbnail ? (
            <img src={video.thumbnail} className="w-full aspect-video object-cover bg-slate-900" />
          ) : (
            <div className="w-full aspect-video bg-slate-900 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}
          <div className="p-3">
            <h4 className="font-semibold text-sm text-slate-100 line-clamp-2" dir="auto">{video.title}</h4>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-400 truncate ml-2">{video.uploader}</p>
              {video.durationString && (
                <span className="text-xs text-slate-300 bg-slate-700/60 px-1.5 py-0.5 rounded-md flex-shrink-0">
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
