import { create } from 'zustand'

export interface DownloadItem {
  episodeId: string
  podcastId: string
  status: string
  createdAt: string
}

interface DownloadStore {
  downloads: Map<string, DownloadItem>
  loading: boolean

  fetchDownloads: () => Promise<void>
  isDownloaded: (episodeId: string) => boolean
  downloadEpisode: (episodeId: string) => Promise<boolean>
  removeDownload: (episodeId: string) => Promise<boolean>
  getDownloadedEpisodesForPodcast: (podcastId: string) => string[]
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloads: new Map(),
  loading: false,

  fetchDownloads: async () => {
    try {
      set({ loading: true })
      const res = await fetch('/api/downloads')
      const data = await res.json()
      if (data.success) {
        const map = new Map<string, DownloadItem>()
        for (const item of data.data) {
          map.set(item.episodeId, item)
        }
        set({ downloads: map })
      }
    } catch (error) {
      console.error('获取下载列表失败:', error)
    } finally {
      set({ loading: false })
    }
  },

  isDownloaded: (episodeId: string) => {
    return get().downloads.has(episodeId)
  },

  downloadEpisode: async (episodeId: string) => {
    try {
      const res = await fetch(`/api/downloads/episodes/${episodeId}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        const { downloads } = get()
        const newMap = new Map(downloads)
        newMap.set(episodeId, {
          episodeId: data.data.episodeId,
          podcastId: data.data.podcastId,
          status: data.data.status,
          createdAt: new Date().toISOString(),
        })
        set({ downloads: newMap })
        return true
      }
      return false
    } catch (error) {
      console.error('下载失败:', error)
      return false
    }
  },

  removeDownload: async (episodeId: string) => {
    try {
      const res = await fetch(`/api/downloads/episodes/${episodeId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        const { downloads } = get()
        const newMap = new Map(downloads)
        newMap.delete(episodeId)
        set({ downloads: newMap })
        return true
      }
      return false
    } catch (error) {
      console.error('删除下载失败:', error)
      return false
    }
  },

  getDownloadedEpisodesForPodcast: (podcastId: string) => {
    const result: string[] = []
    for (const [, item] of get().downloads) {
      if (item.podcastId === podcastId) {
        result.push(item.episodeId)
      }
    }
    return result
  },
}))
