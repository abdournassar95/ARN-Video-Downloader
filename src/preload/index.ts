import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire ipcRenderer object
contextBridge.exposeInMainWorld('api', {
  // Video operations
  analyzeVideo: (url: string) => ipcRenderer.invoke('video:analyze', url),
  getVideoInfo: (url: string) => ipcRenderer.invoke('video:info', url),
  searchYouTube: (query: string, type?: 'video' | 'playlist') => ipcRenderer.invoke('video:search', query, type),
  getPlaylistInfo: (url: string) => ipcRenderer.invoke('playlist:info', url),

  // Download operations
  startDownload: (params: {
    url: string
    outputPath: string
    format: string
    audioOnly: boolean
    title?: string
    thumbnail?: string
  }) => ipcRenderer.invoke('download:start', params),
  startBatchDownload: (
    items: Array<{
      url: string
      outputPath: string
      format: string
      audioOnly: boolean
      title?: string
      thumbnail?: string
    }>
  ) => ipcRenderer.invoke('download:startBatch', items),
  pauseDownload: (id: string) => ipcRenderer.invoke('download:pause', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('download:resume', id),
  cancelDownload: (id: string) => ipcRenderer.invoke('download:cancel', id),
  retryDownload: (id: string) => ipcRenderer.invoke('download:retry', id),
  clearCompleted: () => ipcRenderer.invoke('download:clearCompleted'),
  getAllDownloads: () => ipcRenderer.invoke('download:getAll'),

  // Dialog operations
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),

  // Shell operations
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItem', filePath),
  openPath: (folderPath: string) => ipcRenderer.invoke('shell:openPath', folderPath),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: unknown) => ipcRenderer.invoke('settings:set', settings),

  // Event listeners for download progress
  onDownloadCreated: (callback: (task: unknown) => void) => {
    ipcRenderer.removeAllListeners('download:created')
    ipcRenderer.on('download:created', (_event, task) => callback(task))
  },
  onDownloadProgress: (callback: (data: unknown) => void) => {
    ipcRenderer.removeAllListeners('download:progress')
    ipcRenderer.on('download:progress', (_event, data) => callback(data))
  },
  onDownloadCompleted: (callback: (data: unknown) => void) => {
    ipcRenderer.removeAllListeners('download:completed')
    ipcRenderer.on('download:completed', (_event, data) => callback(data))
  },

  // Event listener for stopping active preview on window minimize or hide
  onStopPreview: (callback: () => void) => {
    ipcRenderer.removeAllListeners('preview:stop')
    ipcRenderer.on('preview:stop', () => callback())
  },

  // Event listener for settings changes triggered from tray menu
  onSettingsChanged: (callback: (settings: unknown) => void) => {
    ipcRenderer.removeAllListeners('settings:changed')
    ipcRenderer.on('settings:changed', (_event, settings) => callback(settings))
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// Type definitions for the exposed API
declare global {
  interface Window {
    api: {
      analyzeVideo: (url: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      getVideoInfo: (url: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      searchYouTube: (query: string, type?: 'video' | 'playlist') => Promise<{ success: boolean; data?: unknown; error?: string }>
      getPlaylistInfo: (url: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      startDownload: (params: {
        url: string
        outputPath: string
        format: string
        audioOnly: boolean
        title?: string
        thumbnail?: string
      }) => Promise<{ success: boolean; data?: unknown; error?: string }>
      startBatchDownload: (
        items: Array<{
          url: string
          outputPath: string
          format: string
          audioOnly: boolean
          title?: string
          thumbnail?: string
        }>
      ) => Promise<{ success: boolean; data?: unknown; error?: string }>
      pauseDownload: (id: string) => Promise<{ success: boolean }>
      resumeDownload: (id: string) => Promise<{ success: boolean }>
      cancelDownload: (id: string) => Promise<{ success: boolean }>
      retryDownload: (id: string) => Promise<{ success: boolean; data?: unknown }>
      clearCompleted: () => Promise<{ success: boolean }>
      getAllDownloads: () => Promise<{ success: boolean; data?: unknown }>
      selectFolder: () => Promise<{ success: boolean; data?: string }>
      showItemInFolder: (filePath: string) => Promise<{ success: boolean }>
      openPath: (folderPath: string) => Promise<{ success: boolean }>
      openExternal: (url: string) => Promise<{ success: boolean }>
      getSettings: () => Promise<{ success: boolean; data?: unknown }>
      setSettings: (settings: unknown) => Promise<{ success: boolean }>
      onDownloadCreated: (callback: (task: unknown) => void) => void
      onDownloadProgress: (callback: (data: unknown) => void) => void
      onDownloadCompleted: (callback: (data: unknown) => void) => void
      onStopPreview: (callback: () => void) => void
      onSettingsChanged: (callback: (settings: unknown) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}
