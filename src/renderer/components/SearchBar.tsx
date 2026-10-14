import { useState, useRef } from 'react'
import { useSearchStore } from '../store/searchStore'
import { useDownloadStore } from '../store/downloadStore'

export default function SearchBar() {
  const { query, setQuery, searchType, setSearchType, search, isLoading, isAnalyzing, error, clearError } = useSearchStore()
  const { settings, updateSettings } = useDownloadStore()
  const [showSettings, setShowSettings] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      search(query, searchType)
    }
  }

  const handleTypeChange = (type: 'video' | 'playlist') => {
    setSearchType(type)
    if (query.trim()) {
      search(query, type)
    }
  }

  const handleClear = () => {
    setQuery('')
    clearError()
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-2.5">
      <form onSubmit={handleSubmit} className="flex gap-3 items-center">
        {/* Search Type Selector Tabs */}
        <div className="flex bg-slate-200 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors">
          <button
            type="button"
            onClick={() => handleTypeChange('video')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              searchType === 'video'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            فيديو
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('playlist')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              searchType === 'playlist'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            قائمة تشغيل
          </button>
        </div>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchType === 'playlist'
                ? 'ابحث عن قوائم تشغيل أو ألصق رابط القائمة...'
                : 'ابحث عن فيديوهات أو ألصق رابط الفيديو...'
            }
            className="w-full px-5 py-2.5 pr-12 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base"
            dir="auto"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || isAnalyzing || !query.trim()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-xl text-white font-medium flex items-center gap-2 transition-colors text-sm"
        >
          {isLoading || isAnalyzing ? (
            <>
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>جاري البحث...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span>{searchType === 'playlist' ? 'بحث قوائم' : 'بحث فيديوهات'}</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={`px-3 py-2.5 border rounded-xl transition-colors flex items-center justify-center ${
            showSettings 
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-600 dark:text-blue-400' 
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
          }`}
          title="إعدادات متقدمة (الكوكيز)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </form>

      {showSettings && (
        <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 animate-in fade-in slide-in-from-top-2 transition-colors">
          {/* Max Concurrent Downloads */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              عدد التحميلات المتزامنة:
            </label>
            <select
              value={settings.maxConcurrentDownloads || 3}
              onChange={(e) => updateSettings({ maxConcurrentDownloads: parseInt(e.target.value, 10) || 3 })}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              <option value="1">1 (تحميل واحد بالتناوب)</option>
              <option value="2">2 (تحميلان متزامنان)</option>
              <option value="3">3 (الموصى به - متوازن)</option>
              <option value="4">4 تحميلات</option>
              <option value="5">5 تحميلات (سريع)</option>
              <option value="8">8 تحميلات (أقصى سرعة)</option>
            </select>
          </div>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 hidden sm:block"></div>

          {/* Browser Cookies for 18+ videos */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              كوكيز المتصفح (18+):
            </label>
            <select
              value={settings.browserCookies || 'none'}
              onChange={(e) => updateSettings({ browserCookies: e.target.value })}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="none">تعطيل (بدون كوكيز)</option>
              <option value="chrome">جوجل كروم (Chrome)</option>
              <option value="edge">إيدج (Edge)</option>
              <option value="firefox">فايرفوكس (Firefox)</option>
              <option value="brave">بريف (Brave)</option>
            </select>
          </div>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 hidden sm:block"></div>

          {/* Auto Resume Downloads on Startup */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer" title="استئناف التنزيلات المعلقة أو المنقطعة تلقائياً عند تشغيل البرنامج">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.autoResumeOnStart ?? true}
                  onChange={(e) => updateSettings({ autoResumeOnStart: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 dark:bg-slate-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full peer-checked:translate-x-4 transition-transform"></div>
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                استئناف تلقائي
              </span>
            </label>
          </div>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 hidden sm:block"></div>

          {/* Auto Start with Windows */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer" title="تشغيل التطبيق تلقائياً عند إقلاع نظام التشغيل Windows">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.autoStartOnBoot ?? false}
                  onChange={(e) => updateSettings({ autoStartOnBoot: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 dark:bg-slate-600 rounded-full peer-checked:bg-emerald-600 transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full peer-checked:translate-x-4 transition-transform"></div>
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                بدء مع النظام
              </span>
            </label>
          </div>

          {/* Start Minimized to Tray */}
          {settings.autoStartOnBoot && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer" title="بدء التطبيق مخفياً في صينية النظام عند الإقلاع دون إظهار النافذة">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.startMinimizedToTray ?? true}
                    onChange={(e) => updateSettings({ startMinimizedToTray: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 dark:bg-slate-600 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
                  <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full peer-checked:translate-x-4 transition-transform"></div>
                </div>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 select-none">
                  مصغراً في صينية النظام
                </span>
              </label>
            </div>
          )}

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mr-auto leading-relaxed">
            💡 يتم حفظ كافة الإعدادات والتحميلات تلقائياً واسترجاعها عند إعادة تشغيل التطبيق.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
          <span>{error}</span>
          <button onClick={clearError} className="mr-auto text-red-300 hover:text-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
