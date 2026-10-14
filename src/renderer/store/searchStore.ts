import { create } from 'zustand'

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

// ---------- Store Interface ----------
interface SearchState {
  // State
  query: string
  searchType: 'video' | 'playlist'
  isLoading: boolean
  error: string | null
  searchResults: VideoInfo[]
  selectedVideo: VideoInfo | null
  currentPlaylist: VideoInfo | null
  playlistVideos: VideoInfo[]
  isAnalyzing: boolean

  // Actions
  setQuery: (query: string) => void
  setSearchType: (type: 'video' | 'playlist') => void
  search: (query: string, searchType?: 'video' | 'playlist') => Promise<void>
  analyzeUrl: (url: string) => Promise<void>
  selectVideo: (video: VideoInfo) => void
  openPlaylist: (playlist: VideoInfo) => void
  closePlaylist: () => void
  clearResults: () => void
  clearError: () => void
  initializeListeners: () => void
}

// ---------- URL Detection ----------
function isUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// ---------- Store ----------
export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  searchType: 'video',
  isLoading: false,
  error: null,
  searchResults: [],
  selectedVideo: null,
  currentPlaylist: null,
  playlistVideos: [],
  isAnalyzing: false,

  setQuery: (query) => set({ query }),
  setSearchType: (searchType) => set({ searchType }),

  search: async (query: string, searchType?: 'video' | 'playlist') => {
    if (!query.trim()) return

    const type = searchType || get().searchType
    set({ isLoading: true, error: null, query, searchType: type })

    try {
      if (isUrl(query)) {
        // Analyze the URL
        await get().analyzeUrl(query)
      } else {
        // Search YouTube
        const result = await window.api.searchYouTube(query, type)
        if (result.success) {
          set({ searchResults: (result.data as VideoInfo[]) || [], isLoading: false })
        } else {
          set({ error: result.error || 'فشل البحث', isLoading: false })
        }
      }
    } catch {
      set({ error: 'حدث خطأ غير متوقع', isLoading: false })
    }
  },

  analyzeUrl: async (url: string) => {
    set({ isAnalyzing: true, error: null })

    try {
      const result = await window.api.analyzeVideo(url)
      if (result.success) {
        const data = result.data as VideoInfo
        if (data.isPlaylist) {
          set({
            currentPlaylist: data,
            playlistVideos: data.entries || [],
            isAnalyzing: false,
            isLoading: false
          })
        } else {
          set({
            selectedVideo: data,
            isAnalyzing: false,
            isLoading: false
          })
        }
      } else {
        set({ error: result.error || 'فشل تحليل الرابط', isAnalyzing: false, isLoading: false })
      }
    } catch (err) {
      set({ error: 'حدث خطأ أثناء تحليل الرابط', isAnalyzing: false, isLoading: false })
    }
  },

  selectVideo: async (video: VideoInfo) => {
    set({ selectedVideo: video, isLoading: true })

    // Fetch full video info including formats
    try {
      const result = await window.api.getVideoInfo(video.webpageUrl)
      if (result.success) {
        set({ selectedVideo: result.data as VideoInfo, isLoading: false })
      } else {
        set({ isLoading: false, error: result.error || 'فشل جلب معلومات الفيديو' })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  openPlaylist: (playlist: VideoInfo) => {
    set({
      currentPlaylist: playlist,
      playlistVideos: playlist.entries || []
    })
  },

  closePlaylist: () => {
    set({
      currentPlaylist: null,
      playlistVideos: []
    })
  },

  clearResults: () => {
    set({
      searchResults: [],
      selectedVideo: null,
      currentPlaylist: null,
      playlistVideos: [],
      error: null
    })
  },

  clearError: () => set({ error: null }),

  initializeListeners: () => {
    // No persistent listeners needed for search
  }
}))
