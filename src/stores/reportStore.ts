import { create } from 'zustand'

interface FavoritePodcast {
  podcastId: string
  name: string
  duration: number
}

interface DailyBreakdown {
  date: string
  duration: number
}

interface WeeklyReport {
  weekStart: string
  weekEnd: string
  totalDuration: number
  favoritePodcasts: FavoritePodcast[]
  consecutiveDays: number
  longestStreak: number
  dailyBreakdown: DailyBreakdown[]
}

interface ReportState {
  weeklyReport: WeeklyReport | null
  loading: boolean
  fetchWeeklyReport: () => Promise<void>
  formatDuration: (seconds: number) => string
}

export const useReportStore = create<ReportState>((set) => ({
  weeklyReport: null,
  loading: false,

  fetchWeeklyReport: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/report/weekly')
      const data = await res.json()
      if (data.success) {
        set({ weeklyReport: data.data })
      }
    } catch (e) {
      console.error('fetchWeeklyReport error:', e)
    } finally {
      set({ loading: false })
    }
  },

  formatDuration: (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours} 小时 ${Math.round(mins)} 分钟`
    }
    return `${Math.round(seconds / 60)} 分钟`
  }
}))
