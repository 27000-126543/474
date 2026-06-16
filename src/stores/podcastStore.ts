import { create } from 'zustand'

export interface Podcast {
  id: string
  name: string
  author: string
  coverUrl: string
  description: string
  tags: string[]
  subscribeCount: number
  createdAt: string
}

export interface Episode {
  id: string
  podcastId: string
  title: string
  audioUrl: string
  duration: number
  size: number
  publishDate: string
  description: string
}

interface PodcastState {
  podcasts: Podcast[]
  recommendations: Podcast[]
  subscriptions: Podcast[]
  loading: boolean
  searchQuery: string
  selectedTag: string
  fetchPodcasts: (q?: string, tag?: string) => Promise<void>
  fetchRecommendations: () => Promise<void>
  fetchSubscriptions: () => Promise<void>
  subscribe: (podcastId: string) => Promise<boolean>
  unsubscribe: (podcastId: string) => Promise<boolean>
  toggleAutoDownload: (podcastId: string, autoDownload: boolean) => Promise<boolean>
  isSubscribed: (podcastId: string) => boolean
}

export const usePodcastStore = create<PodcastState>((set, get) => ({
  podcasts: [],
  recommendations: [],
  subscriptions: [],
  loading: false,
  searchQuery: '',
  selectedTag: '',

  fetchPodcasts: async (q?: string, tag?: string) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (tag) params.set('tag', tag)
      const res = await fetch(`/api/podcasts?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        set({ podcasts: data.data, searchQuery: q || '', selectedTag: tag || '' })
      }
    } catch (e) {
      console.error('fetchPodcasts error:', e)
    } finally {
      set({ loading: false })
    }
  },

  fetchRecommendations: async () => {
    try {
      const res = await fetch('/api/recommendations')
      const data = await res.json()
      if (data.success) {
        set({ recommendations: data.data })
      }
    } catch (e) {
      console.error('fetchRecommendations error:', e)
    }
  },

  fetchSubscriptions: async () => {
    try {
      const res = await fetch('/api/subscriptions')
      const data = await res.json()
      if (data.success) {
        set({ subscriptions: data.data })
      }
    } catch (e) {
      console.error('fetchSubscriptions error:', e)
    }
  },

  subscribe: async (podcastId: string) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId })
      })
      const data = await res.json()
      if (data.success) {
        await get().fetchSubscriptions()
        return true
      }
      return false
    } catch (e) {
      console.error('subscribe error:', e)
      return false
    }
  },

  unsubscribe: async (podcastId: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${podcastId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        await get().fetchSubscriptions()
        return true
      }
      return false
    } catch (e) {
      console.error('unsubscribe error:', e)
      return false
    }
  },

  toggleAutoDownload: async (podcastId: string, autoDownload: boolean) => {
    try {
      const res = await fetch(`/api/subscriptions/${podcastId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoDownload })
      })
      const data = await res.json()
      if (data.success) {
        const { subscriptions } = get()
        set({
          subscriptions: subscriptions.map((s) =>
            s.id === podcastId ? { ...s, autoDownload } : s
          ) as any
        })
        return true
      }
      return false
    } catch (e) {
      console.error('toggleAutoDownload error:', e)
      return false
    }
  },

  isSubscribed: (podcastId: string) => {
    return get().subscriptions.some(s => s.id === podcastId)
  }
}))
