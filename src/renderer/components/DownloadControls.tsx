import { useState, useEffect, useMemo } from 'react'
import { useSearchStore } from '../store/searchStore'
import { useDownloadStore } from '../store/downloadStore'

export default function DownloadControls() {
  const { selectedVideo } = useSearchStore()
  const { settings, startDownload, selectFolder, updateSettings } = useDownloadStore()
  const [selectedFormat, setSelectedFormat] = useState(settings.preferredQuality || 'best')
  const [audioOnly, setAudioOnly] = useState(settings.audioOnly || false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Get unique quality options from video formats
  const qualityOptions = useMemo(() => {
    if (!selectedVideo?.formats || selectedVideo.formats.length === 0) {
      return [
        { value: 'best', label: 'أفضل جودة' },
        { value: 'bestvideo[height<=1080]+bestaudio/best', label: '1080p' },
        { value: 'bestvideo[height<=720]+bestaudio/best', label: '720p' },
        { value: 'bestvideo[height<=480]+bestaudio/best', label: '480p' },
        { value: 'bestvideo[height<=360]+bestaudio/best', label: '360p' },
      ]
    }

    const options = [{ value: 'best', label: 'أفضل جودة' }]
    const seen = new Set<string>()

    selectedVideo.formats.forEach((f) => {
      if (f.resolution && f.vcodec && f.vcodec !== 'none') {
        const height = f.resolution.split('x')[1] || f.resolution
        if (height && !seen.has(height)) {
          seen.add(height)
          options.push({
            value: `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`,
            label: `${height}p${f.fps && f.fps > 30 ? ` ${f.fps}fps` : ''}`
          })
        }
      }
    })

    const sorted = options.sort((a, b) => {
      if (a.value === 'best') return -1
      if (b.value === 'best') return 1
      const aH = parseInt(a.label) || 0
      const bH = parseInt(b.label) || 0
      return bH - aH
    })

    if (selectedFormat && !sorted.some((o) => o.value === selectedFormat)) {
      sorted.push({
        value: selectedFormat,
        label: selectedFormat === 'best' ? 'أفضل جودة' : 'الجودة المحفوظة'
      })
    }

    return sorted
  }, [selectedVideo?.formats, selectedFormat])

  useEffect(() => {
    if (settings.preferredQuality) {
      setSelectedFormat(settings.preferredQuality)
    }
  }, [settings.preferredQuality])

  useEffect(() => {
    setAudioOnly(!!settings.audioOnly)
  }, [settings.audioOnly])

  const handleDownload = async () => {
    if (!selectedVideo) return

    setIsDownloading(true)
    try {
      await startDownload(
        selectedVideo.webpageUrl,
        selectedVideo.title,
        selectedVideo.thumbnail,
        selectedFormat,
        audioOnly
      )
    } finally {
      setIsDownloading(false)
    }
  }

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format)
    updateSettings({ preferredQuality: format })
  }

  const handleAudioOnlyToggle = (checked: boolean) => {
    setAudioOnly(checked)
    updateSettings({ audioOnly: checked })
  }

  if (!selectedVideo) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 transition-colors">
        <p className="text-slate-500 text-center">حدد فيديو لعرض خيارات التنزيل</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 transition-colors">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        إعدادات التنزيل
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Download Path */}
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">مسار الحفظ</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.downloadPath}
              readOnly
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 truncate"
              dir="ltr"
            />
            <button
              onClick={selectFolder}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-lg text-sm text-slate-700 dark:text-slate-200 transition-colors"
            >
              اختر
            </button>
          </div>
        </div>

        {/* Quality */}
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">الجودة</label>
          <select
            value={selectedFormat}
            onChange={(e) => handleFormatChange(e.target.value)}
            disabled={audioOnly}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 disabled:opacity-50"
          >
            {qualityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audio Only Toggle */}
      <div className="mt-4 flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={audioOnly}
              onChange={(e) => handleAudioOnlyToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-300 dark:bg-slate-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
          </div>
          <span className="text-sm text-slate-700 dark:text-slate-300">تنزيل صوت فقط (MP3)</span>
        </label>
      </div>

      {/* Download Button */}
      <div className="mt-6">
        <button
          onClick={handleDownload}
          disabled={isDownloading || !settings.downloadPath}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          {isDownloading ? (
            <>
              <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>جاري بدء التنزيل...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>تنزيل</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
