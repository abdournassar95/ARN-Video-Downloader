import { Tray, Menu, nativeImage, NativeImage, app, BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import {
  getAllDownloads,
  pauseAllDownloads,
  resumeAllDownloads,
  onDownloadsChange
} from './download-manager'
import { store, setAutoStartOnBoot } from './ipc-handlers'

let tray: Tray | null = null
let isAppQuitting = false
let updateContextMenuRef: (() => void) | null = null

export function refreshTrayMenu(): void {
  if (updateContextMenuRef) {
    updateContextMenuRef()
  }
}

export function setIsAppQuitting(quitting: boolean): void {
  isAppQuitting = quitting
}

export function getIsAppQuitting(): boolean {
  return isAppQuitting
}

function getTrayIcon(): NativeImage {
  const candidatePaths = [
    join(__dirname, '../../resources/icon.ico'),
    join(app.getAppPath(), 'resources/icon.ico'),
    join(process.resourcesPath, 'icon.ico'),
    join(app.getAppPath(), 'icon.ico')
  ]
  for (const p of candidatePaths) {
    if (existsSync(p)) {
      const img = nativeImage.createFromPath(p)
      if (!img.isEmpty()) return img
    }
  }
  return nativeImage.createEmpty()
}

export function setupSystemTray(mainWindow: BrowserWindow): Tray {
  if (tray) return tray

  const icon = getTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('ARN Video Downloader')

  const updateContextMenu = () => {
    if (!tray || tray.isDestroyed()) return

    const downloads = getAllDownloads()
    const downloadingTasks = downloads.filter((d) => d.status === 'downloading')
    const pendingTasks = downloads.filter((d) => d.status === 'pending')
    const pausedTasks = downloads.filter((d) => d.status === 'paused')
    const downloadingCount = downloadingTasks.length
    const pendingCount = pendingTasks.length
    const totalActive = downloadingCount + pendingCount

    // Update Tray Tooltip
    const tooltipText = totalActive > 0
      ? `ARN Video Downloader (${downloadingCount} نشط${pendingCount > 0 ? `، ${pendingCount} في الانتظار` : ''})`
      : 'ARN Video Downloader'
    tray.setToolTip(tooltipText)

    // Build Context Menu Template
    const template: MenuItemConstructorOptions[] = [
      {
        label: 'ARN Video Downloader',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'إظهار التطبيق',
        click: () => {
          showMainWindow(mainWindow)
        }
      },
      { type: 'separator' }
    ]

    // Downloads Status Line
    if (totalActive > 0) {
      template.push({
        label: `التحميلات الجارية (${downloadingCount}) ${pendingCount > 0 ? `• في الانتظار (${pendingCount})` : ''}`,
        enabled: false
      })

      // Show active items (up to 3)
      for (const item of downloadingTasks.slice(0, 3)) {
        const shortTitle = item.title.length > 25 ? item.title.slice(0, 25) + '...' : item.title
        template.push({
          label: `  ⚡ ${shortTitle} [${item.progress.toFixed(0)}%]`,
          click: () => showMainWindow(mainWindow)
        })
      }

      // Show pending items (up to 2)
      for (const item of pendingTasks.slice(0, 2)) {
        const shortTitle = item.title.length > 25 ? item.title.slice(0, 25) + '...' : item.title
        template.push({
          label: `  ⏳ ${shortTitle} (في الانتظار)`,
          click: () => showMainWindow(mainWindow)
        })
      }
    } else {
      template.push({
        label: 'لا توجد تحميلات نشطة',
        enabled: false
      })
    }

    template.push({ type: 'separator' })

    // Bulk actions
    template.push({
      label: 'إيقاف الكل مؤقتاً',
      enabled: totalActive > 0,
      click: () => {
        pauseAllDownloads()
      }
    })

    template.push({
      label: 'استئناف الكل',
      enabled: pausedTasks.length > 0,
      click: () => {
        resumeAllDownloads()
      }
    })

    template.push({ type: 'separator' })

    const autoStart = store.get('autoStartOnBoot') ?? false
    const startMin = store.get('startMinimizedToTray') ?? true
    const autoResume = store.get('autoResumeOnStart') ?? true

    template.push({
      label: 'بدء التشغيل مع إقلاع النظام (Windows)',
      type: 'checkbox',
      checked: autoStart,
      click: (menuItem) => {
        setAutoStartOnBoot(menuItem.checked, startMin)
        updateContextMenu()
        mainWindow.webContents.send('settings:changed', store.store)
      }
    })

    template.push({
      label: 'البدء مصغراً في صينية النظام',
      type: 'checkbox',
      checked: startMin,
      enabled: autoStart,
      click: (menuItem) => {
        setAutoStartOnBoot(autoStart, menuItem.checked)
        updateContextMenu()
        mainWindow.webContents.send('settings:changed', store.store)
      }
    })

    template.push({
      label: 'استئناف التنزيلات تلقائياً عند التشغيل',
      type: 'checkbox',
      checked: autoResume,
      click: (menuItem) => {
        store.set('autoResumeOnStart', menuItem.checked)
        updateContextMenu()
        mainWindow.webContents.send('settings:changed', store.store)
      }
    })

    template.push({ type: 'separator' })

    // Exit option
    template.push({
      label: 'إغلاق التطبيق نهائياً',
      click: () => {
        isAppQuitting = true
        app.quit()
      }
    })

    const contextMenu = Menu.buildFromTemplate(template)
    tray.setContextMenu(contextMenu)
  }

  updateContextMenuRef = updateContextMenu

  // Hook into download changes: whenever tasks are added, start, complete, or pause, update tray menu live!
  onDownloadsChange(() => {
    updateContextMenu()
  })

  tray.on('click', () => {
    showMainWindow(mainWindow)
  })

  tray.on('double-click', () => {
    showMainWindow(mainWindow)
  })

  // Initial menu build
  updateContextMenu()

  return tray
}

export function showMainWindow(mainWindow: BrowserWindow): void {
  mainWindow.webContents.setAudioMuted(false)
  if (mainWindow.isMinimized()) mainWindow.restore()
  if (!mainWindow.isVisible()) mainWindow.show()
  mainWindow.focus()
}

export function notifyTrayMinimized(content?: string): void {
  if (tray && !tray.isDestroyed() && process.platform === 'win32') {
    try {
      tray.displayBalloon({
        title: 'ARN Video Downloader',
        content: content || 'التطبيق مستمر في العمل بصينية النظام لإكمال التحميلات.',
        iconType: 'info'
      })
    } catch {
      // ignore
    }
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
