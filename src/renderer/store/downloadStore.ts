import { create } from 'zustand'

declare global {
  interface Window {
    api: any
  }
}

// ---------- Types ----------
export interface DownloadTask {
  id: string
  url: string
  title: string
  thumbnail: string
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled'
  progress: number
  speed: string
  eta: string
  totalSize: string
  outputPath: string
  format: string
  audioOnly?: boolean
  error?: string
  createdAt?: number
}

export interface AppSettings {
  downloadPath: string
  preferredQuality: string
  audioOnly: boolean
  browserCookies?: string
  maxConcurrentDownloads?: number
  autoResumeOnStart?: boolean
  autoStartOnBoot?: boolean
  startMinimizedToTray?: boolean
  theme?: 'dark' | 'light'
}

// ---------- Store Interface ----------
interface DownloadState {
  // State
  downloads: DownloadTask[]
  settings: AppSettings
  globalSpeed: string
  globalSpeedBytes: number
  totalActive: number

  // Actions
  startDownload: (url: string, title: string, thumbnail: string, format: string, audioOnly: boolean) => Promise<void>
  startBatchDownload: (videos: { url: string; title: string; thumbnail: string }[], format: string, audioOnly: boolean) => Promise<void>
  pauseDownload: (id: string) => Promise<void>
  resumeDownload: (id: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  retryDownload: (id: string) => Promise<void>
  pauseAll: () => void
  resumeAll: () => void
  cancelAll: () => void
  clearCompleted: () => void
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>
  loadSettings: () => Promise<void>
  loadDownloads: () => Promise<void>
  selectFolder: () => Promise<void>
  initializeListeners: () => void
}

// ---------- Store ----------
let isListenersRegistered = false

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: [],
  settings: {
    downloadPath: '',
    preferredQuality: 'best',
    audioOnly: false,
    maxConcurrentDownloads: 3,
    autoResumeOnStart: true,
    autoStartOnBoot: false,
    startMinimizedToTray: true
  },
  globalSpeed: '0 B/s',
  globalSpeedBytes: 0,
  totalActive: 0,

  startDownload: async (url, title, thumbnail, format, audioOnly) => {
    const { settings } = get()
    try {
      const result = await window.api.startDownload({
        url,
        outputPath: settings.downloadPath,
        format,
        audioOnly,
        title,
        thumbnail
      })

      if (result.success && result.data) {
        const task = result.data as DownloadTask
        set((state) => {
          if (state.downloads.some((d) => d.id === task.id)) {
            return state
          }
          return {
            downloads: [task, ...state.downloads],
            totalActive: state.totalActive + 1
          }
        })
      }
    } catch (err) {
      console.error('Failed to start download:', err)
    }
  },

  startBatchDownload: async (videos, format, audioOnly) => {
    const { settings } = get()
    const items = videos.map((v) => ({
      url: v.url,
      outputPath: settings.downloadPath,
      format,
      audioOnly,
      title: v.title,
      thumbnail: v.thumbnail
    }))

    try {
      if (window.api.startBatchDownload) {
        const result = await window.api.startBatchDownload(items)
        if (result.success && Array.isArray(result.data)) {
          const tasks = result.data as DownloadTask[]
          set((state) => {
            const existingIds = new Set(state.downloads.map((d) => d.id))
            const newTasks = tasks.filter((t) => !existingIds.has(t.id))
            return {
              downloads: [...newTasks, ...state.downloads],
              totalActive:
                state.totalActive + newTasks.filter((t) => t.status === 'downloading').length
            }
          })
        }
      } else {
        await Promise.all(
          videos.map((v) =>
            get().startDownload(v.url, v.title, v.thumbnail, format, audioOnly)
          )
        )
      }
    } catch (err) {
      console.error('Failed to start batch download:', err)
    }
  },

  pauseDownload: async (id) => {
    await window.api.pauseDownload(id)
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, status: 'paused' as const } : d
      )
    }))
  },

  resumeDownload: async (id) => {
    await window.api.resumeDownload(id)
  },

  cancelDownload: async (id) => {
    await window.api.cancelDownload(id)
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, status: 'cancelled' as const } : d
      ),
      totalActive: Math.max(0, state.totalActive - 1)
    }))
  },

  retryDownload: async (id: string) => {
    try {
      const res = await window.api.retryDownload(id)
      if (res?.success && res.data) {
        const task = res.data as DownloadTask
        set((state) => ({
          downloads: state.downloads.map((d) => (d.id === id ? task : d))
        }))
      }
    } catch (err) {
      console.error('Failed to retry download:', err)
    }
  },

  pauseAll: () => {
    const { downloads, pauseDownload } = get()
    downloads
      .filter((d) => d.status === 'downloading')
      .forEach((d) => pauseDownload(d.id))
  },

  resumeAll: () => {
    const { downloads, resumeDownload } = get()
    downloads
      .filter((d) => d.status === 'paused')
      .forEach((d) => resumeDownload(d.id))
  },

  cancelAll: () => {
    const { downloads, cancelDownload } = get()
    downloads
      .filter((d) => d.status === 'downloading' || d.status === 'paused')
      .forEach((d) => cancelDownload(d.id))
  },

  clearCompleted: async () => {
    try {
      await window.api.clearCompleted?.()
    } catch (err) {
      console.error('Failed to clear completed downloads on main process:', err)
    }
    set((state) => ({
      downloads: state.downloads.filter(
        (d) => d.status !== 'completed' && d.status !== 'cancelled' && d.status !== 'error'
      )
    }))
  },

  updateSettings: async (settings) => {
    set((state) => ({
      settings: { ...state.settings, ...settings }
    }))
    await window.api.setSettings(get().settings)
  },

  loadSettings: async () => {
    try {
      const result = await window.api.getSettings()
      if (result.success && result.data) {
        set({ settings: result.data as AppSettings })
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  },

  loadDownloads: async () => {
    try {
      const result = await window.api.getAllDownloads()
      if (result?.success && Array.isArray(result.data)) {
        const downloads = result.data as DownloadTask[]
        const activeCount = downloads.filter((d) => d.status === 'downloading').length
        set({
          downloads,
          totalActive: activeCount
        })
      }
    } catch (err) {
      console.error('Failed to load downloads from main process:', err)
    }
  },

  selectFolder: async () => {
    try {
      const result = await window.api.selectFolder()
      if (result.success && result.data) {
        set((state) => ({
          settings: { ...state.settings, downloadPath: result.data! }
        }))
      }
    } catch (err) {
      console.error('Failed to select folder:', err)
    }
  },

  initializeListeners: () => {
    // Load settings and restore persisted downloads on init
    if (!window.api) return
    get().loadSettings()
    get().loadDownloads()

    if (isListenersRegistered) return
    isListenersRegistered = true

    // Listen for download events
    window.api.onDownloadCreated?.((task) => {
      const downloadTask = task as DownloadTask
      set((state) => {
        // Only add if not already in the list
        if (state.downloads.some((d) => d.id === downloadTask.id)) return state
        return {
          downloads: [downloadTask, ...state.downloads],
          totalActive: state.totalActive + 1
        }
      })
    })

    window.api.onDownloadProgress?.((data) => {
      const update = data as Partial<DownloadTask> & { id: string }
      set((state) => ({
        downloads: state.downloads.map((d) =>
          d.id === update.id ? { ...d, ...update } : d
        )
      }))

      // Calculate global speed
      const { downloads } = get()
      const activeDownloads = downloads.filter((d) => d.status === 'downloading')
      const totalSpeedBytes = activeDownloads.reduce((sum, d) => {
        return sum + parseSpeed(d.speed)
      }, 0)
      set({ globalSpeed: formatBytes(totalSpeedBytes) + '/s', globalSpeedBytes: totalSpeedBytes, totalActive: activeDownloads.length })
    })

    window.api.onDownloadCompleted?.((data) => {
      const update = data as { id: string; status: string; progress?: number; error?: string }
      set((state) => ({
        downloads: state.downloads.map((d) =>
          d.id === update.id
            ? {
                ...d,
                status: update.status as DownloadTask['status'],
                progress: update.status === 'completed' ? 100 : (update.progress ?? d.progress),
                speed: update.status === 'completed' ? '' : d.speed,
                eta: update.status === 'completed' ? '' : d.eta,
                error: update.error
              }
            : d
        ),
        totalActive: Math.max(0, state.totalActive - 1)
      }))
    })

    window.api.onSettingsChanged?.((newSettings) => {
      set((state) => ({
        settings: { ...state.settings, ...(newSettings as Partial<AppSettings>) }
      }))
    })
  }
}))

// ---------- Helpers ----------
function parseSpeed(speedStr: string): number {
  if (!speedStr || speedStr === 'Merging...' || speedStr.includes('الدمج') || speedStr.includes('Merging')) return 0

  const match = speedStr.match(/([\d.]+)\s*([a-zA-Z/]+)/)
  if (!match) return 0

  const value = parseFloat(match[1])
  const unit = match[2].toLowerCase()

  switch (unit) {
    case 'b/s':
    case 'bib/s':
      return value
    case 'kib/s':
    case 'kb/s':
      return value * 1024
    case 'mib/s':
    case 'mb/s':
      return value * 1024 * 1024
    case 'gib/s':
    case 'gb/s':
      return value * 1024 * 1024 * 1024
    default:
      return value
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
