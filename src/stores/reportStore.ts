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

interface DailyEpisode {
  id: string
  episodeId: string
  episodeTitle: string
  podcastId: string
  podcastName: string
  duration: number
  position: number
  completed: boolean
  listenedAt: string
}

interface WeeklyBreakdownItem {
  weekStart: string
  weekEnd: string
  duration: number
}

interface MonthlyReport {
  month: string
  monthStart: string
  monthEnd: string
  totalDuration: number
  listenedDays: number
  longestStreak: number
  totalEpisodes: number
  completedEpisodes: number
  favoritePodcasts: FavoritePodcast[]
  weeklyBreakdown: WeeklyBreakdownItem[]
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

type ReportView = 'weekly' | 'monthly'

interface ReportState {
  weeklyReport: WeeklyReport | null
  monthlyReport: MonthlyReport | null
  reportList: ReportSummary[]
  selectedWeekStart: string | null
  selectedMonth: string | null
  selectedDay: string | null
  dailyEpisodes: DailyEpisode[]
  view: ReportView
  loading: boolean
  listLoading: boolean
  dailyLoading: boolean
  monthlyLoading: boolean
  fetchReportList: () => Promise<void>
  fetchWeeklyReport: (weekStart?: string) => Promise<void>
  fetchMonthlyReport: (month?: string) => Promise<void>
  selectWeek: (weekStart: string | null) => Promise<void>
  selectMonth: (month: string | null) => Promise<void>
  selectDay: (date: string | null) => Promise<void>
  setView: (view: ReportView) => void
  formatDuration: (seconds: number) => string
}

export const useReportStore = create<ReportState>((set, get) => ({
  weeklyReport: null,
  monthlyReport: null,
  reportList: [],
  selectedWeekStart: null,
  selectedMonth: null,
  selectedDay: null,
  dailyEpisodes: [],
  view: 'weekly',
  loading: false,
  listLoading: false,
  dailyLoading: false,
  monthlyLoading: false,

  setView: (view) => set({ view }),

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
        set({
          weeklyReport: data.data,
          selectedWeekStart: weekStart || data.data.weekStart || null,
          selectedDay: null,
          dailyEpisodes: [],
        })
      }
    } catch (e) {
      console.error('fetchWeeklyReport error:', e)
    } finally {
      set({ loading: false })
    }
  },

  fetchMonthlyReport: async (month?: string) => {
    set({ monthlyLoading: true })
    try {
      const url = month
        ? `/api/report/monthly?month=${month}`
        : '/api/report/monthly'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        set({
          monthlyReport: data.data,
          selectedMonth: month || data.data.month || null,
        })
      }
    } catch (e) {
      console.error('fetchMonthlyReport error:', e)
    } finally {
      set({ monthlyLoading: false })
    }
  },

  selectWeek: async (weekStart: string | null) => {
    await get().fetchWeeklyReport(weekStart || undefined)
    get().fetchReportList()
  },

  selectMonth: async (month: string | null) => {
    await get().fetchMonthlyReport(month || undefined)
  },

  selectDay: async (date: string | null) => {
    if (!date) {
      set({ selectedDay: null, dailyEpisodes: [] })
      return
    }
    set({ dailyLoading: true, selectedDay: date })
    try {
      const res = await fetch(`/api/report/daily?date=${date}`)
      const data = await res.json()
      if (data.success) {
        set({ dailyEpisodes: data.data })
      }
    } catch (e) {
      console.error('selectDay error:', e)
    } finally {
      set({ dailyLoading: false })
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
