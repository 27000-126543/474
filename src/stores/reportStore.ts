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
  id?: string
  weekStart: string
  weekEnd: string
  totalDuration: number
  favoritePodcasts: FavoritePodcast[]
  consecutiveDays: number
  longestStreak: number
  totalEpisodes?: number
  completedEpisodes?: number
  dailyBreakdown: DailyBreakdown[]
}

interface ReportSummary {
  id: string
  weekStart: string
  weekEnd: string
  totalDuration: number
  consecutiveDays: number
  longestStreak: number
  totalEpisodes: number
  completedEpisodes: number
  createdAt: string
}

interface ReportState {
  weeklyReport: WeeklyReport | null
  reportList: ReportSummary[]
  selectedWeekStart: string | null
  loading: boolean
  listLoading: boolean
  fetchReportList: () => Promise<void>
  fetchWeeklyReport: (weekStart?: string) => Promise<void>
  selectWeek: (weekStart: string | null) => Promise<void>
  formatDuration: (seconds: number) => string
}

export const useReportStore = create<ReportState>((set, get) => ({
  weeklyReport: null,
  reportList: [],
  selectedWeekStart: null,
  loading: false,
  listLoading: false,

  fetchReportList: async () => {
    set({ listLoading: true })
    try {
      const res = await fetch('/api/report/list')
      const data = await res.json()
      if (data.success) {
        set({ reportList: data.data })
      }
    } catch (e) {
      console.error('fetchReportList error:', e)
    } finally {
      set({ listLoading: false })
    }
  },

  fetchWeeklyReport: async (weekStart?: string) => {
    set({ loading: true })
    try {
      const url = weekStart
        ? `/api/report/weekly?weekStart=${weekStart}`
        : '/api/report/weekly'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        set({ weeklyReport: data.data, selectedWeekStart: weekStart || data.data.weekStart || null })
      }
    } catch (e) {
      console.error('fetchWeeklyReport error:', e)
    } finally {
      set({ loading: false })
    }
  },

  selectWeek: async (weekStart: string | null) => {
    await get().fetchWeeklyReport(weekStart || undefined)
    get().fetchReportList()
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
