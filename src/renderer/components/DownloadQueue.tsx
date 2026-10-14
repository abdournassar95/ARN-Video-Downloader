import { useDownloadStore, type DownloadTask } from '../store/downloadStore'
import AnalogSpeedometer from './AnalogSpeedometer'

export default function DownloadQueue() {
  const {
    downloads,
    settings,
    updateSettings,
    globalSpeed,
    globalSpeedBytes,
    totalActive,
    pauseAll,
    resumeAll,
    cancelAll,
    clearCompleted,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload
  } = useDownloadStore()

  const hasActive = totalActive > 0
  const hasPaused = downloads.some((d) => d.status === 'paused')
  const hasCompleted = downloads.some(
    (d) => d.status === 'completed' || d.status === 'cancelled' || d.status === 'error'
  )

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          التنزيلات
        </h3>

        <div className="flex items-center gap-2">
          {/* Quick concurrency limit dropdown */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600 text-[11px]" title="الحد الأقصى للتحميلات المتزامنة">
            <span className="text-slate-500 dark:text-slate-400">تزامن:</span>
            <select
              value={settings.maxConcurrentDownloads || 3}
              onChange={(e) => updateSettings({ maxConcurrentDownloads: parseInt(e.target.value, 10) || 3 })}
              className="bg-transparent text-blue-600 dark:text-blue-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value="1" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">1</option>
              <option value="2" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">2</option>
              <option value="3" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">3</option>
              <option value="4" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">4</option>
              <option value="5" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">5</option>
            </select>
          </div>

          <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 font-semibold px-2 py-0.5 rounded-full">
            {downloads.length}
          </span>
        </div>
      </div>

      {/* Global Speed */}
      {hasActive && (
        <div className="mb-5 p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm transition-colors">
          <AnalogSpeedometer 
            speedBytes={globalSpeedBytes || 0} 
            speedText={globalSpeed} 
          />
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 relative z-10">
            <span className="text-xs text-slate-500 dark:text-slate-400">تنزيلات نشطة</span>
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600" dir="ltr">
              {totalActive}
            </span>
          </div>
        </div>
      )}

      {/* Bulk Controls */}
      {downloads.length > 0 && (
        <div className="flex gap-2 mb-4">
          {hasActive && (
            <button
              onClick={pauseAll}
              className="flex-1 py-2 px-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              إيقاف الكل
            </button>
          )}
          {hasPaused && (
            <button
              onClick={resumeAll}
              className="flex-1 py-2 px-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              استئناف الكل
            </button>
          )}
          {hasActive && (
            <button
              onClick={cancelAll}
              className="flex-1 py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              إلغاء الكل
            </button>
          )}
          {hasCompleted && (
            <button
              onClick={clearCompleted}
              className="flex-1 py-2 px-3 bg-slate-200 dark:bg-slate-600/30 hover:bg-slate-300 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400 text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              مسح المكتملة
            </button>
          )}
        </div>
      )}

      {/* Downloads List */}
      {downloads.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">لا توجد تنزيلات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((task) => (
            <DownloadItem
              key={task.id}
              task={task}
              onPause={() => pauseDownload(task.id)}
              onResume={() => resumeDownload(task.id)}
              onCancel={() => cancelDownload(task.id)}
              onRetry={() => retryDownload(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DownloadItem({
  task,
  onPause,
  onResume,
  onCancel,
  onRetry
}: {
  task: DownloadTask
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  onRetry: () => void
}) {
  const statusColors = {
    pending: 'bg-slate-500',
    downloading: 'bg-blue-500',
    paused: 'bg-yellow-500',
    completed: 'bg-green-500',
    error: 'bg-red-500',
    cancelled: 'bg-slate-500'
  }

  const statusLabels = {
    pending: 'في الانتظار',
    downloading: 'جاري التنزيل',
    paused: 'متوقف مؤقتاً',
    completed: 'مكتمل',
    error: 'خطأ',
    cancelled: 'ملغي'
  }

  const handleOpenFolder = () => {
    window.api.showItemInFolder(task.outputPath)
  }

  return (
    <div className="bg-white dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shadow-sm dark:shadow-none transition-colors">
      {/* Header with thumbnail and title */}
      <div className="flex gap-2 p-2">
        <div className="w-16 h-10 flex-shrink-0 rounded overflow-hidden bg-slate-200 dark:bg-slate-600">
          {task.thumbnail ? (
            <img src={task.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" dir="auto">
            {task.title}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-block w-2 h-2 rounded-full ${statusColors[task.status]}`}></span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{statusLabels[task.status]}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-2 pb-1">
        <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              task.status === 'completed'
                ? 'bg-green-500'
                : task.status === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500 progress-animated'
            }`}
            style={{ width: `${task.progress}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 dark:text-slate-400">
          <span dir="ltr">{task.status === 'completed' ? '100%' : `${task.progress.toFixed(1)}%`}</span>
          {task.status === 'downloading' && (
            <span className="font-mono" dir="ltr">{task.speed}</span>
          )}
          {task.status === 'pending' && (
            <span className="text-amber-500 dark:text-amber-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              في الانتظار...
            </span>
          )}
          {task.status === 'downloading' && task.eta && (
            <span className="flex items-center gap-1">المتبقي: <span dir="ltr">{task.eta}</span></span>
          )}
          {task.status === 'paused' && (
            <span className="text-yellow-500 dark:text-yellow-400 font-medium">
              متوقف مؤقتاً {task.progress > 0 ? `(${task.progress.toFixed(0)}%)` : ''}
            </span>
          )}
          {task.status === 'completed' && (
            <span className="text-green-400 font-medium">✓ مكتمل</span>
          )}
        </div>
      </div>

      {/* Error message */}
      {task.error && (
        <div className="px-2 pb-1">
          <p className="text-[10px] text-red-400 truncate">{task.error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-1 px-2 pb-2">
        {task.status === 'downloading' && (
          <button
            onClick={onPause}
            className="flex-1 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-[10px] rounded transition-colors"
          >
            ⏸ إيقاف مؤقت
          </button>
        )}
        {task.status === 'paused' && (
          <button
            onClick={onResume}
            className="flex-1 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-[10px] rounded transition-colors"
          >
            ▶ استئناف
          </button>
        )}
        {(task.status === 'downloading' || task.status === 'paused' || task.status === 'pending') && (
          <button
            onClick={onCancel}
            className="flex-1 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] rounded transition-colors"
          >
            ❌ إلغاء
          </button>
        )}
        {(task.status === 'error' || task.status === 'cancelled') && (
          <button
            onClick={onRetry}
            className="flex-1 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] rounded transition-colors flex items-center justify-center gap-1"
            title="إعادة محاولة التحميل من جديد"
          >
            <span>🔄</span>
            <span>إعادة المحاولة</span>
          </button>
        )}
        {task.status === 'completed' && (
          <button
            onClick={handleOpenFolder}
            className="flex-1 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] rounded transition-colors"
          >
            📂 فتح الموقع
          </button>
        )}
      </div>
    </div>
  )
}
