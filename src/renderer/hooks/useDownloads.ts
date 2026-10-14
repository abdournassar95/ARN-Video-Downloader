import { useEffect } from 'react'
import { useDownloadStore } from '../store/downloadStore'

export function useDownloads() {
  const store = useDownloadStore()

  useEffect(() => {
    // Load settings on mount
    store.loadSettings()
  }, [])

  return {
    downloads: store.downloads,
    globalSpeed: store.globalSpeed,
    totalActive: store.totalActive,
    settings: store.settings,
    startDownload: store.startDownload,
    pauseDownload: store.pauseDownload,
    resumeDownload: store.resumeDownload,
    cancelDownload: store.cancelDownload,
    retryDownload: store.retryDownload,
    loadDownloads: store.loadDownloads,
    pauseAll: store.pauseAll,
    resumeAll: store.resumeAll,
    cancelAll: store.cancelAll,
    clearCompleted: store.clearCompleted,
    updateSettings: store.updateSettings,
    selectFolder: store.selectFolder
  }
}
