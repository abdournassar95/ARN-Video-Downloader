import { spawn, ChildProcess, exec } from 'child_process'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readdirSync, unlinkSync } from 'fs'
import { BrowserWindow } from 'electron'
import Store from 'electron-store'
import { store } from './ipc-handlers'

// ---------- Types ----------
export interface VideoInfo {
  id: string
  title: string
  thumbnail: string
  duration: number
  durationString: string
  uploader: string
  uploaderId: string
  viewCount: number
  description: string
  formats: VideoFormat[]
  webpageUrl: string
  // For playlists
  isPlaylist: boolean
  playlistCount?: number
  entries?: VideoInfo[]
}

export interface VideoFormat {
  formatId: string
  ext: string
  resolution: string
  fps?: number
  filesize?: number
  filesizeApprox?: number
  vcodec?: string
  acodec?: string
  abr?: number
  tbr?: number
  formatNote?: string
}

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

interface PersistentTasksData {
  tasks: DownloadTask[]
}

// Dedicated store for persisting download tasks history
const tasksStore = new Store<PersistentTasksData>({
  name: 'arn-downloads-history',
  defaults: {
    tasks: []
  },
  deserialize: (value: string) => JSON.parse(value.replace(/^\uFEFF/, ''))
})

let saveTasksTimeout: NodeJS.Timeout | null = null

export function saveTasksToDisk(immediate = false): void {
  const doSave = () => {
    try {
      const tasksArray = Array.from(downloadTasks.values())
      tasksStore.set('tasks', tasksArray)
    } catch (err) {
      console.error('Failed to save download tasks to disk:', err)
    }
  }

  if (immediate) {
    if (saveTasksTimeout) {
      clearTimeout(saveTasksTimeout)
      saveTasksTimeout = null
    }
    doSave()
  } else {
    if (!saveTasksTimeout) {
      saveTasksTimeout = setTimeout(() => {
        saveTasksTimeout = null
        doSave()
      }, 2000)
    }
  }
}

// ---------- State ----------
const activeProcesses: Map<string, ChildProcess> = new Map()
const downloadTasks: Map<string, DownloadTask> = new Map()
interface PhaseData {
  currentStream: number
  lastRawProgress: number
  isAudioOnly: boolean
  isMultiStream: boolean
}
const downloadPhases: Map<string, PhaseData> = new Map()

// ---------- Listeners ----------
type DownloadChangeListener = () => void
const changeListeners: DownloadChangeListener[] = []

export function onDownloadsChange(listener: DownloadChangeListener): void {
  changeListeners.push(listener)
}

function notifyDownloadsChange(): void {
  for (const listener of changeListeners) {
    try {
      listener()
    } catch (e) {
      console.error('Error in download change listener:', e)
    }
  }
}

// ---------- Helpers ----------
function getYtDlpPath(): string {
  const resourcesPath = app.isPackaged
    ? join(process.resourcesPath, 'bin')
    : join(app.getAppPath(), 'resources', 'bin')

  const platform = process.platform
  let binary = 'yt-dlp'

  if (platform === 'win32') {
    binary = 'yt-dlp.exe'
  }

  const fullPath = join(resourcesPath, binary)

  // Fallback to system yt-dlp if not found in resources
  if (!existsSync(fullPath)) {
    return 'yt-dlp'
  }

  return fullPath
}

function getFfmpegPath(): string {
  const resourcesPath = app.isPackaged
    ? join(process.resourcesPath, 'bin')
    : join(app.getAppPath(), 'resources', 'bin')

  let binary = 'ffmpeg'
  if (process.platform === 'win32') {
    binary = 'ffmpeg.exe'
  }

  const fullPath = join(resourcesPath, binary)
  if (!existsSync(fullPath)) {
    return 'ffmpeg'
  }
  return fullPath
}

function generateId(): string {
  return `dl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function sendToRenderer(channel: string, ...args: unknown[]): void {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args)
    }
  })
}

// ---------- Fetch Video Info ----------
export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  const ytDlpPath = getYtDlpPath()

  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-warnings',
      '--no-playlist',
      '--ffmpeg-location', getFfmpegPath(),
      url
    ]

    const browserCookies = store.get('browserCookies')
    if (browserCookies && browserCookies !== 'none') {
      args.unshift('--cookies-from-browser', browserCookies)
    }

    const proc = spawn(ytDlpPath, args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(parseYtDlpError(stderr, code)))
        return
      }

      try {
        const info = JSON.parse(stdout)
        const formats: VideoFormat[] = (info.formats || []).map((f: Record<string, unknown>) => ({
          formatId: f.format_id as string,
          ext: f.ext as string,
          resolution: (f.resolution as string) || `${f.width || '?'}x${f.height || '?'}`,
          fps: f.fps as number | undefined,
          filesize: f.filesize as number | undefined,
          filesizeApprox: f.filesize_approx as number | undefined,
          vcodec: f.vcodec as string | undefined,
          acodec: f.acodec as string | undefined,
          abr: f.abr as number | undefined,
          tbr: f.tbr as number | undefined,
          formatNote: f.format_note as string | undefined
        }))

        resolve({
          id: info.id,
          title: info.title,
          thumbnail: info.thumbnail || '',
          duration: info.duration || 0,
          durationString: info.duration_string || formatDuration(info.duration || 0),
          uploader: info.uploader || info.channel || '',
          uploaderId: info.uploader_id || '',
          viewCount: info.view_count || 0,
          description: (info.description || '').substring(0, 500),
          formats,
          webpageUrl: info.webpage_url || url,
          isPlaylist: false
        })
      } catch (e) {
        reject(new Error(`Failed to parse video info: ${e}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`))
    })
  })
}

// ---------- Fetch Playlist Info ----------
export async function fetchPlaylistInfo(url: string): Promise<VideoInfo> {
  const ytDlpPath = getYtDlpPath()

  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--flat-playlist',
      '--no-warnings',
      '--yes-playlist',
      url
    ]

    const browserCookies = store.get('browserCookies')
    if (browserCookies && browserCookies !== 'none') {
      args.unshift('--cookies-from-browser', browserCookies)
    }

    const proc = spawn(ytDlpPath, args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(parseYtDlpError(stderr, code)))
        return
      }

      try {
        const lines = stdout.trim().split('\n').filter(Boolean)
        const firstInfo = lines.length > 0 ? JSON.parse(lines[0]) : {}
        const realTitle =
          firstInfo.playlist_title ||
          firstInfo.playlist ||
          (firstInfo._type === 'playlist' ? firstInfo.title : null) ||
          `قائمة تشغيل (${lines.length} فيديو)`

        const entries: VideoInfo[] = lines.map((line) => {
          const info = JSON.parse(line)
          return {
            id: info.id || `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: info.title || 'Untitled',
            thumbnail:
              info.thumbnail ||
              info.thumbnails?.[info.thumbnails.length - 1]?.url ||
              info.thumbnails?.[0]?.url ||
              '',
            duration: info.duration || 0,
            durationString: info.duration_string || formatDuration(info.duration || 0),
            uploader: info.uploader || info.channel || firstInfo.channel || '',
            uploaderId: info.uploader_id || '',
            viewCount: info.view_count || 0,
            description: '',
            formats: [],
            webpageUrl: info.webpage_url || info.url || `https://www.youtube.com/watch?v=${info.id}`,
            isPlaylist: false
          }
        })

        resolve({
          id: `playlist_${Date.now()}`,
          title: realTitle,
          thumbnail: entries[0]?.thumbnail || firstInfo.thumbnails?.[0]?.url || '',
          duration: entries.reduce((sum, e) => sum + e.duration, 0),
          durationString: formatDuration(entries.reduce((sum, e) => sum + e.duration, 0)),
          uploader: firstInfo.uploader || firstInfo.channel || '',
          uploaderId: firstInfo.uploader_id || '',
          viewCount: 0,
          description: '',
          formats: [],
          webpageUrl: url,
          isPlaylist: true,
          playlistCount: entries.length,
          entries
        })
      } catch (e) {
        reject(new Error(`Failed to parse playlist info: ${e}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`))
    })
  })
}

// ---------- Search YouTube ----------
export async function searchYouTube(
  query: string,
  type: 'video' | 'playlist' = 'video'
): Promise<VideoInfo[]> {
  const ytDlpPath = getYtDlpPath()

  return new Promise((resolve, reject) => {
    let searchUrl: string
    let args: string[]

    if (type === 'playlist') {
      searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAw%253D%253D`
      args = [
        '--dump-json',
        '--flat-playlist',
        '--no-warnings',
        '--playlist-end',
        '15',
        searchUrl
      ]
    } else {
      searchUrl = `ytsearch12:${query}`
      args = [
        '--dump-json',
        '--flat-playlist',
        '--no-warnings',
        searchUrl
      ]
    }

    const browserCookies = store.get('browserCookies')
    if (browserCookies && browserCookies !== 'none') {
      args.unshift('--cookies-from-browser', browserCookies)
    }

    const proc = spawn(ytDlpPath, args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(parseYtDlpError(stderr, code)))
        return
      }

      try {
        const lines = stdout.trim().split('\n').filter(Boolean)
        const results: VideoInfo[] = lines.map((line) => {
          const info = JSON.parse(line)
          const isPl =
            type === 'playlist' ||
            info._type === 'playlist' ||
            info.ie_key === 'YoutubeTab' ||
            String(info.id).startsWith('PL')
          const thumb =
            info.thumbnail ||
            info.thumbnails?.[info.thumbnails.length - 1]?.url ||
            info.thumbnails?.[0]?.url ||
            ''
          const url =
            info.url ||
            info.webpage_url ||
            (isPl
              ? `https://www.youtube.com/playlist?list=${info.id}`
              : `https://www.youtube.com/watch?v=${info.id}`)

          return {
            id: info.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: info.title || 'Untitled',
            thumbnail: thumb,
            duration: info.duration || 0,
            durationString: isPl
              ? 'قائمة تشغيل'
              : info.duration_string || formatDuration(info.duration || 0),
            uploader: info.uploader || info.channel || '',
            uploaderId: info.uploader_id || '',
            viewCount: info.view_count || 0,
            description: '',
            formats: [],
            webpageUrl: url,
            isPlaylist: isPl,
            playlistCount: info.playlist_count || info.n_entries
          }
        })

        resolve(results)
      } catch (e) {
        reject(new Error(`Failed to parse search results: ${e}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`))
    })
  })
}

const downloadArgsMap: Map<string, string[]> = new Map()

// ---------- Build Download Arguments ----------
export function buildDownloadArgs(task: DownloadTask): string[] {
  const args = [
    '--newline',
    '--no-warnings',
    '--continue',
    '--ffmpeg-location', getFfmpegPath(),
    '-o', join(task.outputPath, '%(title)s.%(ext)s')
  ]

  const browserCookies = store.get('browserCookies')
  if (browserCookies && browserCookies !== 'none') {
    args.unshift('--cookies-from-browser', browserCookies)
  }

  if (task.audioOnly) {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0')
  } else {
    // Force mp4 output container for all video downloads
    args.push('--merge-output-format', 'mp4')
    
    if (task.format && task.format !== 'best') {
      const mp4Format = task.format.replace('bestvideo', 'bestvideo[ext=mp4]').replace('bestaudio', 'bestaudio[ext=m4a]')
      args.push('-f', `${mp4Format}/${task.format}`)
    } else {
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best')
    }
  }

  args.push(task.url)
  return args
}

// ---------- Concurrency Management ----------
export function getMaxConcurrent(): number {
  const max = store.get('maxConcurrentDownloads')
  return typeof max === 'number' && max > 0 ? max : 3
}

export function checkAndStartNextQueued(): void {
  const maxConcurrent = getMaxConcurrent()
  while (activeProcesses.size < maxConcurrent) {
    const pendingTask = Array.from(downloadTasks.values()).find((t) => t.status === 'pending')
    if (!pendingTask) break
    let args = downloadArgsMap.get(pendingTask.id)
    if (!args) {
      args = buildDownloadArgs(pendingTask)
      downloadArgsMap.set(pendingTask.id, args)
    }

    pendingTask.status = 'downloading'
    pendingTask.speed = '0 B/s'
    pendingTask.eta = 'جاري البدء...'
    sendToRenderer('download:progress', {
      id: pendingTask.id,
      status: 'downloading',
      speed: '0 B/s',
      eta: 'جاري البدء...'
    })
    saveTasksToDisk(true)
    spawnDownloadProcess(pendingTask.id, pendingTask, args)
    notifyDownloadsChange()
  }
}

const rangeRetriedTasks: Set<string> = new Set()

// ---------- Clean Stale/Corrupted Partial Files ----------
export function cleanPartialFiles(task: DownloadTask): void {
  try {
    if (!task.outputPath || !existsSync(task.outputPath)) return

    const files = readdirSync(task.outputPath)
    const cleanTitle = task.title
      .replace(/[\/\\:*?"<>|]/g, '')
      .trim()
      .slice(0, 15)

    let urlId = ''
    if (task.url && task.url.includes('v=')) {
      urlId = task.url.split('v=')[1]?.slice(0, 11) || ''
    }

    for (const file of files) {
      const isPartial =
        file.endsWith('.part') ||
        file.endsWith('.ytdl') ||
        /\.(f\d+|temp)\.(mp4|m4a|webm|part)$/i.test(file)

      if (isPartial) {
        const matchesTitle = cleanTitle.length >= 4 && file.includes(cleanTitle)
        const matchesId = urlId.length >= 6 && file.includes(urlId)
        if (matchesTitle || matchesId) {
          try {
            unlinkSync(join(task.outputPath, file))
            console.log(`[Auto-clean] Removed conflicting partial file: ${file}`)
          } catch (e) {
            console.error(`[Auto-clean] Could not remove ${file}:`, e)
          }
        }
      }
    }
  } catch (err) {
    console.error('[Auto-clean] Error scanning output directory for partial files:', err)
  }
}

// ---------- Spawn Download Worker ----------
function spawnDownloadProcess(id: string, task: DownloadTask, args: string[]): void {
  // Ensure phase tracking is initialized (for resumed tasks across app restarts)
  if (!downloadPhases.has(id)) {
    const isMultiStream = !task.audioOnly && args.some((a) => a.includes('+'))
    downloadPhases.set(id, {
      currentStream: 1,
      lastRawProgress: 0,
      isAudioOnly: !!task.audioOnly,
      isMultiStream
    })
  }

  const ytDlpPath = getYtDlpPath()
  const proc = spawn(ytDlpPath, args)
  activeProcesses.set(id, proc)
  notifyDownloadsChange()

  let stderrOutput = ''
  let lastTrayNotify = 0

  proc.stdout.on('data', (data) => {
    if (task.status === 'paused' || task.status === 'cancelled') return
    const text = data.toString()
    const lines = text.split(/[\r\n]+/)
    for (const line of lines) {
      if (line.trim()) {
        parseProgressLine(line.trim(), task)
      }
    }
    sendToRenderer('download:progress', {
      id: task.id,
      progress: task.progress,
      speed: task.speed,
      eta: task.eta,
      totalSize: task.totalSize,
      status: task.status
    })

    // Debounced task persistence during download
    saveTasksToDisk(false)

    // Update tray tooltip and items at most once per second while downloading
    const now = Date.now()
    if (now - lastTrayNotify > 1000) {
      lastTrayNotify = now
      notifyDownloadsChange()
    }
  })

  proc.stderr.on('data', (data) => {
    const msg = data.toString()
    stderrOutput += msg
    if (msg.trim()) {
      console.error(`[yt-dlp stderr] ${msg.trim()}`)
    }
  })

  proc.on('close', (code, signal) => {
    activeProcesses.delete(id)

    // If task was paused or cancelled by user, ignore close event
    if (task.status === 'paused' || task.status === 'cancelled') {
      saveTasksToDisk(true)
      notifyDownloadsChange()
      checkAndStartNextQueued()
      return
    }

    // Auto-recover from HTTP 416 (Requested range not satisfiable) by removing stuck partial files
    const isRange416 =
      stderrOutput.includes('416') ||
      stderrOutput.toLowerCase().includes('requested range not satisfiable')

    if (isRange416 && !rangeRetriedTasks.has(id)) {
      rangeRetriedTasks.add(id)
      console.log(`[Auto-recovery] HTTP 416 detected for ${task.title}. Cleaning partial files and restarting download...`)
      cleanPartialFiles(task)
      task.status = 'downloading'
      task.progress = 0
      task.speed = '0 B/s'
      task.eta = 'إعادة البدء...'
      sendToRenderer('download:progress', {
        id: task.id,
        status: 'downloading',
        progress: 0,
        speed: '0 B/s',
        eta: 'إعادة البدء...'
      })
      saveTasksToDisk(true)
      const freshArgs = buildDownloadArgs(task)
      spawnDownloadProcess(id, task, freshArgs)
      notifyDownloadsChange()
      return
    }

    if (code === 0 || task.progress >= 99.5) {
      task.status = 'completed'
      task.progress = 100
      task.speed = ''
      task.eta = ''
      task.error = undefined
      rangeRetriedTasks.delete(id)
    } else {
      task.status = 'error'
      task.error = parseYtDlpError(stderrOutput, code ?? signal)
    }

    sendToRenderer('download:completed', {
      id: task.id,
      status: task.status,
      progress: task.progress,
      error: task.error
    })
    saveTasksToDisk(true)
    notifyDownloadsChange()
    checkAndStartNextQueued()
  })

  proc.on('error', (err) => {
    activeProcesses.delete(id)
    if (task.status === 'paused' || task.status === 'cancelled') {
      saveTasksToDisk(true)
      notifyDownloadsChange()
      checkAndStartNextQueued()
      return
    }

    const isRange416 =
      err.message.includes('416') ||
      err.message.toLowerCase().includes('requested range not satisfiable')

    if (isRange416 && !rangeRetriedTasks.has(id)) {
      rangeRetriedTasks.add(id)
      cleanPartialFiles(task)
      task.status = 'downloading'
      task.progress = 0
      task.speed = '0 B/s'
      task.eta = 'إعادة البدء...'
      sendToRenderer('download:progress', {
        id: task.id,
        status: 'downloading',
        progress: 0,
        speed: '0 B/s',
        eta: 'إعادة البدء...'
      })
      saveTasksToDisk(true)
      const freshArgs = buildDownloadArgs(task)
      spawnDownloadProcess(id, task, freshArgs)
      notifyDownloadsChange()
      return
    }

    task.status = 'error'
    task.error = err.message
    sendToRenderer('download:completed', {
      id: task.id,
      status: 'error',
      progress: task.progress,
      error: err.message
    })
    saveTasksToDisk(true)
    notifyDownloadsChange()
    checkAndStartNextQueued()
  })
}

// ---------- Start Download ----------
export async function startDownload(
  url: string,
  outputPath: string,
  format: string,
  audioOnly: boolean,
  initialTitle?: string,
  initialThumbnail?: string
): Promise<DownloadTask> {
  const id = generateId()

  let videoTitle = initialTitle?.trim()
  let videoThumb = initialThumbnail?.trim()

  // First fetch info for metadata only if title was not provided
  if (!videoTitle) {
    try {
      const info = await fetchVideoInfo(url)
      videoTitle = info.title
      videoThumb = info.thumbnail
    } catch {
      videoTitle = 'Downloading...'
      videoThumb = ''
    }
  }

  const maxConcurrent = getMaxConcurrent()
  const isQueueFull = activeProcesses.size >= maxConcurrent

  const task: DownloadTask = {
    id,
    url,
    title: videoTitle || 'Downloading...',
    thumbnail: videoThumb || '',
    status: isQueueFull ? 'pending' : 'downloading',
    progress: 0,
    speed: isQueueFull ? 'في الانتظار...' : '0 B/s',
    eta: isQueueFull ? 'في الانتظار' : 'جاري التحضير...',
    totalSize: 'Unknown',
    outputPath,
    format: audioOnly ? 'audio' : format,
    audioOnly: !!audioOnly,
    createdAt: Date.now()
  }

  downloadTasks.set(id, task)

  const args = buildDownloadArgs(task)
  const isMultiStream = !audioOnly && args.some((a) => a.includes('+'))
  downloadPhases.set(id, { currentStream: 1, lastRawProgress: 0, isAudioOnly: audioOnly, isMultiStream })

  downloadArgsMap.set(id, args)
  sendToRenderer('download:created', task)
  saveTasksToDisk(true)
  notifyDownloadsChange()

  if (!isQueueFull) {
    spawnDownloadProcess(id, task, args)
  }

  return task
}

// ---------- Start Batch Download ----------
export async function startBatchDownload(
  items: Array<{
    url: string
    outputPath: string
    format: string
    audioOnly: boolean
    title?: string
    thumbnail?: string
  }>
): Promise<DownloadTask[]> {
  const tasks: DownloadTask[] = []
  const maxConcurrent = getMaxConcurrent()

  for (const item of items) {
    const id = generateId()
    const isQueueFull = activeProcesses.size >= maxConcurrent

    const task: DownloadTask = {
      id,
      url: item.url,
      title: item.title?.trim() || 'Downloading...',
      thumbnail: item.thumbnail?.trim() || '',
      status: isQueueFull ? 'pending' : 'downloading',
      progress: 0,
      speed: isQueueFull ? 'في الانتظار...' : '0 B/s',
      eta: isQueueFull ? 'في الانتظار' : 'جاري التحضير...',
      totalSize: 'Unknown',
      outputPath: item.outputPath,
      format: item.audioOnly ? 'audio' : item.format,
      audioOnly: !!item.audioOnly,
      createdAt: Date.now()
    }

    downloadTasks.set(id, task)

    const args = buildDownloadArgs(task)
    const isMultiStream = !item.audioOnly && args.some((a) => a.includes('+'))
    downloadPhases.set(id, { currentStream: 1, lastRawProgress: 0, isAudioOnly: item.audioOnly, isMultiStream })

    downloadArgsMap.set(id, args)
    tasks.push(task)
    sendToRenderer('download:created', task)

    if (!isQueueFull) {
      spawnDownloadProcess(id, task, args)
    }
  }

  saveTasksToDisk(true)
  notifyDownloadsChange()
  return tasks
}

// ---------- Parse Progress ----------
function parseProgressLine(line: string, task: DownloadTask): void {
  const phaseData = downloadPhases.get(task.id) || {
    currentStream: 1,
    lastRawProgress: 0,
    isAudioOnly: false,
    isMultiStream: true
  }

  if (line.includes('[download] Destination:') || line.includes('Destination:')) {
    if (task.progress > 0 && phaseData.isMultiStream) {
      phaseData.currentStream = 2 // Moving to the second stream (usually audio)
      phaseData.lastRawProgress = 0
    }
  }

  // 100% download line
  if (line.includes('[download] 100%') || line.includes('100.0% of') || line.includes('100% of')) {
    if (phaseData.isAudioOnly || !phaseData.isMultiStream || phaseData.currentStream === 2) {
      task.progress = 100
    } else {
      task.progress = 80
    }
    task.status = 'downloading'
    return
  }

  // Merging progress
  if (line.includes('[Merger]') || line.includes('[Muxing]') || line.includes('[ExtractAudio]')) {
    task.progress = 99
    task.speed = 'جاري الدمج...'
    task.eta = ''
    return
  }

  // Already downloaded
  if (line.includes('[download]') && line.includes('has already been downloaded')) {
    task.progress = 100
    task.status = 'completed'
    return
  }

  // 1. Independent Percentage Extraction
  const percentMatch = line.match(/(?:\[download\]\s+)?([\d.]+)%/i)
  if (percentMatch) {
    const rawProgress = parseFloat(percentMatch[1])
    if (!isNaN(rawProgress)) {
      if (phaseData.isMultiStream && rawProgress < phaseData.lastRawProgress - 40) {
        phaseData.currentStream = 2
      }
      phaseData.lastRawProgress = rawProgress

      if (phaseData.isAudioOnly || !phaseData.isMultiStream) {
        task.progress = Math.min(rawProgress, 100)
      } else {
        if (phaseData.currentStream === 1) {
          task.progress = Math.min(rawProgress * 0.8, 80)
        } else {
          task.progress = Math.min(80 + (rawProgress * 0.2), 99.5)
        }
      }

      downloadPhases.set(task.id, phaseData)
      task.status = 'downloading'
    }
  }

  // 2. Independent Size Extraction
  const sizeMatch = line.match(/of\s+~?\s*([\d.]+\s*[a-zA-Z]+)/i)
  if (sizeMatch) {
    task.totalSize = sizeMatch[1].trim()
  }

  // 3. Independent Speed Extraction
  const speedMatch = line.match(/at\s+([^\s]+(?:B\/s|iB\/s|b\/s|ib\/s))/i)
  if (speedMatch) {
    task.speed = speedMatch[1].trim()
  }

  // 4. Independent ETA Extraction
  const etaMatch = line.match(/ETA\s+([\d:]+|\w+)/i)
  if (etaMatch) {
    const etaVal = etaMatch[1].trim()
    task.eta = etaVal.toLowerCase() === 'unknown' ? '--' : etaVal
  }
}

// ---------- Pause Download ----------
export function pauseDownload(id: string): void {
  const task = downloadTasks.get(id)
  if (task) {
    if (task.status === 'downloading') {
      task.status = 'paused'
      task.speed = '0 B/s'
      task.eta = ''
      const proc = activeProcesses.get(id)
      if (proc) {
        activeProcesses.delete(id)
        killProcessTree(proc)
      }
      sendToRenderer('download:progress', { id, status: 'paused', speed: '0 B/s', eta: '' })
      saveTasksToDisk(true)
      notifyDownloadsChange()
      checkAndStartNextQueued()
    } else if (task.status === 'pending') {
      task.status = 'paused'
      task.speed = '0 B/s'
      task.eta = ''
      sendToRenderer('download:progress', { id, status: 'paused', speed: '0 B/s', eta: '' })
      saveTasksToDisk(true)
      notifyDownloadsChange()
    }
  }
}

// ---------- Resume Download ----------
export function resumeDownload(id: string): void {
  const task = downloadTasks.get(id)
  if (!task || task.status !== 'paused') return

  let args = downloadArgsMap.get(id)
  if (!args) {
    args = buildDownloadArgs(task)
    downloadArgsMap.set(id, args)
  }

  const maxConcurrent = getMaxConcurrent()
  if (activeProcesses.size < maxConcurrent) {
    task.status = 'downloading'
    task.speed = '0 B/s'
    task.eta = 'جاري البدء...'
    sendToRenderer('download:progress', { id, status: 'downloading', speed: '0 B/s', eta: 'جاري البدء...' })
    saveTasksToDisk(true)
    spawnDownloadProcess(id, task, args)
    notifyDownloadsChange()
  } else {
    task.status = 'pending'
    task.speed = 'في الانتظار...'
    task.eta = 'في الانتظار'
    sendToRenderer('download:progress', { id, status: 'pending', speed: 'في الانتظار...', eta: 'في الانتظار' })
    saveTasksToDisk(true)
    notifyDownloadsChange()
  }
}

// ---------- Cancel Download ----------
export function cancelDownload(id: string): void {
  const task = downloadTasks.get(id)
  if (task) {
    task.status = 'cancelled'
    task.speed = ''
    task.eta = ''
    const proc = activeProcesses.get(id)
    if (proc) {
      activeProcesses.delete(id)
      killProcessTree(proc)
    }
    sendToRenderer('download:completed', { id, status: 'cancelled' })
    saveTasksToDisk(true)
    notifyDownloadsChange()
    checkAndStartNextQueued()
  }
}

// ---------- Retry Download ----------
export function retryDownload(id: string): DownloadTask | null {
  const task = downloadTasks.get(id)
  if (!task) return null

  // Clean any stale/corrupted partial files so the retry starts with a clean slate
  cleanPartialFiles(task)
  rangeRetriedTasks.delete(id)

  task.status = 'pending'
  task.progress = 0
  task.speed = 'في الانتظار...'
  task.eta = 'في الانتظار'
  task.error = undefined

  const args = buildDownloadArgs(task)
  downloadArgsMap.set(id, args)

  sendToRenderer('download:progress', {
    id: task.id,
    status: 'pending',
    progress: 0,
    speed: 'في الانتظار...',
    eta: 'في الانتظار',
    error: undefined
  })

  saveTasksToDisk(true)
  notifyDownloadsChange()
  checkAndStartNextQueued()
  return task
}

// ---------- Bulk Controls ----------
export function pauseAllDownloads(): void {
  for (const [id, task] of downloadTasks.entries()) {
    if (task.status === 'downloading' || task.status === 'pending') {
      pauseDownload(id)
    }
  }
  saveTasksToDisk(true)
}

export function resumeAllDownloads(): void {
  for (const [id, task] of downloadTasks.entries()) {
    if (task.status === 'paused') {
      resumeDownload(id)
    }
  }
  saveTasksToDisk(true)
}

// ---------- Clear Completed Downloads ----------
export function clearCompletedDownloads(): void {
  for (const [id, task] of downloadTasks.entries()) {
    if (task.status === 'completed' || task.status === 'cancelled' || task.status === 'error') {
      downloadTasks.delete(id)
      downloadArgsMap.delete(id)
    }
  }
  saveTasksToDisk(true)
  notifyDownloadsChange()
}

// ---------- Get All Downloads ----------
export function getAllDownloads(): DownloadTask[] {
  return Array.from(downloadTasks.values())
}

// ---------- Initialize Download Manager (Restore and Auto-Resume) ----------
export function initDownloadManager(): void {
  try {
    const savedTasks = tasksStore.get('tasks') || []
    const autoResume = store.get('autoResumeOnStart') ?? true

    for (const task of savedTasks) {
      if (!task || !task.id) continue

      // If task was downloading, pending, or paused when app was previously terminated
      if (task.status === 'downloading' || task.status === 'pending' || task.status === 'paused') {
        task.speed = ''
        task.eta = ''
        if (autoResume) {
          task.status = 'pending'
          task.speed = 'في الانتظار...'
          task.eta = 'في الانتظار'
        } else {
          task.status = 'paused'
        }
      }

      downloadTasks.set(task.id, task)
      const args = buildDownloadArgs(task)
      downloadArgsMap.set(task.id, args)
    }

    saveTasksToDisk(true)
    notifyDownloadsChange()

    if (autoResume) {
      setTimeout(() => {
        checkAndStartNextQueued()
      }, 800)
    }
  } catch (err) {
    console.error('Failed to restore download tasks from storage:', err)
  }
}

// ---------- Cleanup on Application Exit ----------
export function cleanupOnExit(): void {
  if (saveTasksTimeout) {
    clearTimeout(saveTasksTimeout)
    saveTasksTimeout = null
  }

  for (const [id, proc] of activeProcesses.entries()) {
    killProcessTree(proc)
    const task = downloadTasks.get(id)
    if (task && task.status === 'downloading') {
      task.status = 'paused'
      task.speed = ''
      task.eta = ''
    }
  }
  activeProcesses.clear()

  try {
    const tasksArray = Array.from(downloadTasks.values())
    tasksStore.set('tasks', tasksArray)
  } catch (err) {
    console.error('Failed to save tasks on exit:', err)
  }
}

// ---------- Helpers ----------
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

function killProcessTree(proc: ChildProcess): void {
  if (!proc || !proc.pid) return

  if (process.platform === 'win32') {
    exec(`taskkill /pid ${proc.pid} /T /F`, (err) => {
      if (err) {
        try { proc.kill('SIGTERM') } catch {}
      }
    })
  } else {
    try {
      proc.kill('SIGTERM')
    } catch {}
  }
}

function parseYtDlpError(stderr: string, code: number | string | null): string {
  const errLower = stderr.toLowerCase()
  
  if (errLower.includes('http error 416') || errLower.includes('requested range not satisfiable')) {
    return 'الملف المؤقت السابق غير متطابق مع الخادم. تم تنظيفه تلقائياً، يمكنك النقر على "إعادة المحاولة" للبدء من جديد.'
  }
  if (errLower.includes('sign in to confirm your age') || errLower.includes('viewer discretion is advised')) {
    return 'هذا الفيديو محظور لسن معين (18+). يرجى اختيار متصفحك من إعدادات الكوكيز (أيقونة ⚙️) وتجربة البحث مرة أخرى بعد إغلاقه.'
  }
  if (errLower.includes('could not copy chrome cookie database')) {
    return 'فشل استخراج الكوكيز: المتصفح قيد التشغيل! يرجى إغلاق المتصفح تماماً (حتى من إدارة المهام Task Manager) ثم حاول مجدداً.'
  }
  if (errLower.includes('video unavailable') || errLower.includes('private video')) {
    return 'هذا الفيديو غير متوفر أو خاص.'
  }
  if (errLower.includes('no video formats found')) {
    return 'لم يتم العثور على صيغ قابلة للتنزيل لهذا الرابط.'
  }
  
  const cleanError = stderr
    .split('\n')
    .filter((l) => l.toLowerCase().includes('error:') || l.toLowerCase().includes('warning:'))
    .pop()
    ?.replace(/ERROR:\s*(?:\[[^\]]+\])?\s*/i, '')
    
  if (cleanError) return cleanError
  
  return stderr.trim() || `حدث خطأ غير معروف (رمز ${code ?? 'غير متوفر'})`
}
