import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers, store } from './ipc-handlers'
import { initAdBlocker } from './ad-blocker'
import { getAllDownloads, initDownloadManager, cleanupOnExit } from './download-manager'
import {
  setupSystemTray,
  setIsAppQuitting,
  getIsAppQuitting,
  showMainWindow,
  notifyTrayMinimized,
  destroyTray
} from './tray'
import { startLocalServer, stopLocalServer } from './local-server'

let mainWindow: BrowserWindow | null = null

// Request single instance lock to prevent duplicate app instances
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      showMainWindow(mainWindow)
    }
  })
}

function getPreloadPath(): string {
  const mjsPath = join(__dirname, '../preload/index.mjs')
  const jsPath = join(__dirname, '../preload/index.js')
  const cjsPath = join(__dirname, '../preload/index.cjs')
  if (existsSync(mjsPath)) return mjsPath
  if (existsSync(jsPath)) return jsPath
  if (existsSync(cjsPath)) return cjsPath
  return mjsPath
}

function getWindowIcon(): string | undefined {
  const iconPath = join(__dirname, '../../resources/icon.ico')
  if (existsSync(iconPath)) return iconPath
  const devIconPath = join(app.getAppPath(), 'resources/icon.ico')
  if (existsSync(devIconPath)) return devIconPath
  return undefined
}

function createWindow(): void {
  const savedBounds = store.get('windowBounds')

  mainWindow = new BrowserWindow({
    width: savedBounds?.width && savedBounds.width >= 1024 ? savedBounds.width : 1400,
    height: savedBounds?.height && savedBounds.height >= 700 ? savedBounds.height : 900,
    x: savedBounds?.x,
    y: savedBounds?.y,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'ARN Video Downloader',
    icon: getWindowIcon(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: getPreloadPath(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  if (savedBounds?.isMaximized) {
    mainWindow.maximize()
  }

  // Save window bounds when moved or resized (debounced)
  let boundsTimer: NodeJS.Timeout | null = null
  const saveWindowBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (boundsTimer) clearTimeout(boundsTimer)
    boundsTimer = setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return
      const isMaximized = mainWindow.isMaximized()
      if (!isMaximized) {
        const bounds = mainWindow.getBounds()
        store.set('windowBounds', {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          isMaximized: false
        })
      } else {
        const current = store.get('windowBounds') || { width: 1400, height: 900 }
        store.set('windowBounds', {
          ...current,
          isMaximized: true
        })
      }
    }, 1000)
  }

  mainWindow.on('resize', saveWindowBounds)
  mainWindow.on('move', saveWindowBounds)

  const isHiddenArg = process.argv.includes('--hidden') || process.argv.includes('--minimized')
  const isAutoStarted = app.getLoginItemSettings?.()?.wasOpenedAtLogin || false
  const shouldStartMinimized = isHiddenArg || (isAutoStarted && (store.get('startMinimizedToTray') !== false))

  mainWindow.on('ready-to-show', () => {
    if (shouldStartMinimized) {
      notifyTrayMinimized('تم تشغيل ARN Video Downloader وتصغيره في صينية النظام لمتابعة التنزيلات.')
    } else {
      mainWindow?.show()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (/^https?:\/\//i.test(details.url)) {
      shell.openExternal(details.url)
    }
    return { action: 'deny' }
  })

  // Initialize ad blocker for this window
  initAdBlocker(mainWindow)

  // Initialize System Tray
  setupSystemTray(mainWindow)

  // Intercept window close: minimize to tray if any downloads exist in the list
  mainWindow.on('close', (event) => {
    if (boundsTimer) {
      clearTimeout(boundsTimer)
      boundsTimer = null
    }
    if (!getIsAppQuitting()) {
      const downloads = getAllDownloads()
      // If there are any downloads in the list, keep running in system tray
      if (downloads.length > 0) {
        event.preventDefault()
        // Stop any active video preview & mute audio immediately
        mainWindow?.webContents.setAudioMuted(true)
        mainWindow?.webContents.send('preview:stop')
        mainWindow?.hide()
        notifyTrayMinimized('تم تصغير التطبيق إلى صينية النظام لمتابعة التنزيلات في الخلفية.')
      }
    }
  })

  // When window is minimized, stop preview and mute audio
  mainWindow.on('minimize', () => {
    mainWindow?.webContents.setAudioMuted(true)
    mainWindow?.webContents.send('preview:stop')
  })

  // When window is restored or shown, restore audio capability
  mainWindow.on('restore', () => {
    mainWindow?.webContents.setAudioMuted(false)
  })

  mainWindow.on('show', () => {
    mainWindow?.webContents.setAudioMuted(false)
  })

  // HMR for renderer base on electron-vite cli in development,
  // or lightweight local HTTP server in production to provide real HTTP origin
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    const rendererPath = join(__dirname, '../renderer')
    startLocalServer(rendererPath)
      .then((url) => {
        mainWindow?.loadURL(url)
      })
      .catch((err) => {
        console.error('Failed to start local server, falling back to loadFile:', err)
        mainWindow?.loadFile(join(rendererPath, 'index.html'))
      })
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.arntechnology.videodownloader')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register IPC handlers
  registerIpcHandlers()

  // Initialize download manager state and auto-resume if configured
  initDownloadManager()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Prevent app from terminating silently when closed to tray
app.on('before-quit', () => {
  setIsAppQuitting(true)
  cleanupOnExit()
  destroyTray()
  stopLocalServer()
})

// Quit when all windows are closed, except when running in tray
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && getIsAppQuitting()) {
    app.quit()
  }
})

export { mainWindow }
