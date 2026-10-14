import { ipcMain, dialog, app } from 'electron'
import {
  fetchVideoInfo,
  fetchPlaylistInfo,
  searchYouTube,
  startDownload,
  startBatchDownload,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  retryDownload,
  clearCompletedDownloads,
  getAllDownloads,
  checkAndStartNextQueued
} from './download-manager'
import Store from 'electron-store'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import { refreshTrayMenu } from './tray'

// ---------- Store for settings ----------
export interface AppSettings {
  downloadPath: string
  preferredQuality: string
  audioOnly: boolean
  browserCookies: string
  maxConcurrentDownloads?: number
  autoResumeOnStart?: boolean
  autoStartOnBoot?: boolean
  startMinimizedToTray?: boolean
  theme?: 'dark' | 'light'
  windowBounds?: {
    x?: number
    y?: number
    width: number
    height: number
    isMaximized?: boolean
  }
}

export const store = new Store<AppSettings>({
  defaults: {
    downloadPath: join(app.getPath('downloads'), 'VideoDownloader'),
    preferredQuality: 'best',
    audioOnly: false,
    browserCookies: 'none',
    maxConcurrentDownloads: 3,
    autoResumeOnStart: true,
    autoStartOnBoot: false,
    startMinimizedToTray: true,
    theme: 'dark'
  },
  deserialize: (value: string) => JSON.parse(value.replace(/^\uFEFF/, ''))
})

// Configure Windows login items (auto-start)
export function setAutoStartOnBoot(enable: boolean, startMinimized = true): void {
  try {
    const args = startMinimized ? ['--hidden'] : []
    if (app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: enable,
        openAsHidden: startMinimized,
        args
      })
    } else {
      app.setLoginItemSettings({
        openAtLogin: enable,
        openAsHidden: startMinimized,
        path: process.execPath,
        args: [app.getAppPath(), ...args]
      })
    }
  } catch (err) {
    console.error('Failed to set login item settings:', err)
  }
}

// Ensure download directory exists
try {
  let defaultPath = store.get('downloadPath')
  if (!defaultPath || typeof defaultPath !== 'string') {
    defaultPath = app.getPath('downloads')
    store.set('downloadPath', defaultPath)
  }
  if (!existsSync(defaultPath)) {
    mkdirSync(defaultPath, { recursive: true })
  }
} catch (err) {
  console.error('Failed to create configured download directory, falling back to default:', err)
  try {
    const fallbackPath = app.getPath('downloads')
    store.set('downloadPath', fallbackPath)
    if (!existsSync(fallbackPath)) {
      mkdirSync(fallbackPath, { recursive: true })
    }
  } catch (fallbackErr) {
    console.error('Failed to create fallback downloads directory:', fallbackErr)
  }
}

// ---------- Register IPC Handlers ----------
export function registerIpcHandlers(): void {
  // Analyze URL (detect if video or playlist)
  ipcMain.handle('video:analyze', async (_event, url: string) => {
    try {
      // Detect if URL is a playlist
      const isPlaylistUrl = /\/playlist/i.test(url) || /[?&]list=/i.test(url)

      if (isPlaylistUrl) {
        const info = await fetchPlaylistInfo(url)
        return { success: true, data: info }
      } else {
        const info = await fetchVideoInfo(url)
        return { success: true, data: info }
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: errMsg }
    }
  })

  // Fetch single video info
  ipcMain.handle('video:info', async (_event, url: string) => {
    try {
      const info = await fetchVideoInfo(url)
      return { success: true, data: info }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: errMsg }
    }
  })

  // Search YouTube
  ipcMain.handle('video:search', async (_event, query: string, type?: 'video' | 'playlist') => {
    try {
      const results = await searchYouTube(query, type || 'video')
      return { success: true, data: results }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: errMsg }
    }
  })

  // Fetch playlist info
  ipcMain.handle('playlist:info', async (_event, url: string) => {
    try {
      const info = await fetchPlaylistInfo(url)
      return { success: true, data: info }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: errMsg }
    }
  })

  // Start download
  ipcMain.handle('download:start', async (_event, params: {
    url: string
    outputPath: string
    format: string
    audioOnly: boolean
    title?: string
    thumbnail?: string
  }) => {
    try {
      const task = await startDownload(
        params.url,
        params.outputPath,
        params.format,
        params.audioOnly,
        params.title,
        params.thumbnail
      )
      return { success: true, data: task }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: errMsg }
    }
  })

  // Start batch download
  ipcMain.handle('download:startBatch', async (_event, items: Array<{
    url: string
    outputPath: string
    format: string
    audioOnly: boolean
    title?: string
    thumbnail?: string
  }>) => {
    try {
      const tasks = await startBatchDownload(items)
      return { success: true, data: tasks }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: errMsg }
    }
  })

  // Pause download
  ipcMain.handle('download:pause', (_event, id: string) => {
    pauseDownload(id)
    return { success: true }
  })

  // Resume download
  ipcMain.handle('download:resume', (_event, id: string) => {
    resumeDownload(id)
    return { success: true }
  })

  // Cancel download
  ipcMain.handle('download:cancel', (_event, id: string) => {
    cancelDownload(id)
    return { success: true }
  })

  // Retry download
  ipcMain.handle('download:retry', (_event, id: string) => {
    const task = retryDownload(id)
    return { success: !!task, data: task }
  })

  // Clear completed downloads
  ipcMain.handle('download:clearCompleted', () => {
    clearCompletedDownloads()
    return { success: true }
  })

  // Get all downloads
  ipcMain.handle('download:getAll', () => {
    return { success: true, data: getAllDownloads() }
  })

  // Choose download path
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'اختر مجلد الحفظ'
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const path = result.filePaths[0]
      store.set('downloadPath', path)
      return { success: true, data: path }
    }

    return { success: false }
  })

  // Open file in file manager
  ipcMain.handle('shell:showItem', async (_event, filePath: string) => {
    const { shell } = await import('electron')
    shell.showItemInFolder(filePath)
    return { success: true }
  })

  // Open folder
  ipcMain.handle('shell:openPath', async (_event, folderPath: string) => {
    if (folderPath && typeof folderPath === 'string' && existsSync(folderPath)) {
      const { shell } = await import('electron')
      await shell.openPath(folderPath)
      return { success: true }
    }
    return { success: false, error: 'Path does not exist' }
  })

  // Open external URL in default browser
  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    if (url && typeof url === 'string' && /^https?:\/\//i.test(url.trim())) {
      const { shell } = await import('electron')
      await shell.openExternal(url.trim())
      return { success: true }
    }
    return { success: false, error: 'Invalid URL protocol' }
  })

  // Settings
  ipcMain.handle('settings:get', () => {
    return {
      success: true,
      data: {
        downloadPath: store.get('downloadPath'),
        preferredQuality: store.get('preferredQuality') || 'best',
        audioOnly: store.get('audioOnly') ?? false,
        browserCookies: store.get('browserCookies') || 'none',
        maxConcurrentDownloads: store.get('maxConcurrentDownloads') || 3,
        autoResumeOnStart: store.get('autoResumeOnStart') ?? true,
        autoStartOnBoot: store.get('autoStartOnBoot') ?? false,
        startMinimizedToTray: store.get('startMinimizedToTray') ?? true,
        theme: store.get('theme') || 'dark',
        windowBounds: store.get('windowBounds')
      }
    }
  })

  ipcMain.handle('settings:set', (_event, settings: Partial<AppSettings>) => {
    if (settings.downloadPath !== undefined) store.set('downloadPath', settings.downloadPath)
    if (settings.preferredQuality !== undefined) store.set('preferredQuality', settings.preferredQuality)
    if (settings.audioOnly !== undefined) store.set('audioOnly', settings.audioOnly)
    if (settings.browserCookies !== undefined) store.set('browserCookies', settings.browserCookies)
    if (settings.maxConcurrentDownloads !== undefined) {
      store.set('maxConcurrentDownloads', settings.maxConcurrentDownloads)
      checkAndStartNextQueued()
    }
    if (settings.autoResumeOnStart !== undefined) store.set('autoResumeOnStart', settings.autoResumeOnStart)
    if (settings.autoStartOnBoot !== undefined || settings.startMinimizedToTray !== undefined) {
      const autoStart = settings.autoStartOnBoot !== undefined ? settings.autoStartOnBoot : (store.get('autoStartOnBoot') ?? false)
      const startMinimized = settings.startMinimizedToTray !== undefined ? settings.startMinimizedToTray : (store.get('startMinimizedToTray') ?? true)
      store.set('autoStartOnBoot', autoStart)
      store.set('startMinimizedToTray', startMinimized)
      setAutoStartOnBoot(autoStart, startMinimized)
    }
    if (settings.theme !== undefined) store.set('theme', settings.theme)
    if (settings.windowBounds !== undefined) store.set('windowBounds', settings.windowBounds)
    refreshTrayMenu()
    return { success: true }
  })
}
