import { useSearchStore } from '../store/searchStore'

export function useSearch() {
  const store = useSearchStore()

  return {
    query: store.query,
    isLoading: store.isLoading,
    error: store.error,
    searchResults: store.searchResults,
    selectedVideo: store.selectedVideo,
    currentPlaylist: store.currentPlaylist,
    setQuery: store.setQuery,
    search: store.search,
    analyzeUrl: store.analyzeUrl,
    selectVideo: store.selectVideo,
    openPlaylist: store.openPlaylist,
    closePlaylist: store.closePlaylist,
    clearResults: store.clearResults,
    clearError: store.clearError
  }
}
