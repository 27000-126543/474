import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()
const USER_ID = 'user-1'

router.get('/list', (_req: Request, res: Response): void => {
  try {
    const reports = db.prepare(
      'SELECT id, weekStart, weekEnd, totalDuration, consecutiveDays, longestStreak, totalEpisodes, completedEpisodes, createdAt FROM weekly_reports WHERE userId = ? ORDER BY weekStart DESC'
    ).all(USER_ID) as any[]

    const result = reports.map((r) => ({
      id: r.id,
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      totalDuration: r.totalDuration,
      consecutiveDays: r.consecutiveDays,
      longestStreak: r.longestStreak,
      totalEpisodes: r.totalEpisodes,
      completedEpisodes: r.completedEpisodes,
      createdAt: r.createdAt,
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('获取报告列表失败:', error)
    res.status(500).json({ success: false, error: '获取报告列表失败' })
  }
})

router.get('/weekly', (req: Request, res: Response): void => {
  try {
    const { weekStart } = req.query

    if (weekStart) {
      const report = db.prepare(
        'SELECT * FROM weekly_reports WHERE userId = ? AND weekStart = ?'
      ).get(USER_ID, weekStart) as any

      if (!report) {
        res.status(404).json({ success: false, error: '报告不存在' })
        return
      }

      const favoritePodcasts = report.favoritePodcasts
        ? JSON.parse(report.favoritePodcasts)
        : []
      const dailyBreakdown = report.dailyBreakdown
        ? JSON.parse(report.dailyBreakdown)
        : []

      res.json({
        success: true,
        data: {
          id: report.id,
          weekStart: report.weekStart,
          weekEnd: report.weekEnd,
          totalDuration: report.totalDuration,
          favoritePodcasts,
          consecutiveDays: report.consecutiveDays,
          longestStreak: report.longestStreak,
          totalEpisodes: report.totalEpisodes,
          completedEpisodes: report.completedEpisodes,
          dailyBreakdown,
          createdAt: report.createdAt,
        },
      })
      return
    }

    const today = new Date()
    const dayOfWeek = today.getDay() || 7
    const currentWeekStart = new Date(today)
    currentWeekStart.setDate(today.getDate() - dayOfWeek + 1)
    const ws = currentWeekStart.toISOString().split('T')[0]
    const we = new Date(currentWeekStart)
    we.setDate(currentWeekStart.getDate() + 6)
    const weekEnd = we.toISOString().split('T')[0]

    const existingReport = db.prepare(
      'SELECT * FROM weekly_reports WHERE userId = ? AND weekStart = ?'
    ).get(USER_ID, ws) as any

    if (existingReport) {
      const favoritePodcasts = existingReport.favoritePodcasts
        ? JSON.parse(existingReport.favoritePodcasts)
        : []
      const dailyBreakdown = existingReport.dailyBreakdown
        ? JSON.parse(existingReport.dailyBreakdown)
        : []
      res.json({
        success: true,
        data: {
          id: existingReport.id,
          weekStart: existingReport.weekStart,
          weekEnd: existingReport.weekEnd,
          totalDuration: existingReport.totalDuration,
          favoritePodcasts,
          consecutiveDays: existingReport.consecutiveDays,
          longestStreak: existingReport.longestStreak,
          totalEpisodes: existingReport.totalEpisodes,
          completedEpisodes: existingReport.completedEpisodes,
          dailyBreakdown,
          createdAt: existingReport.createdAt,
        },
      })
      return
    }

    const history = db.prepare(
      'SELECT * FROM listen_history WHERE userId = ?'
    ).all(USER_ID) as any[]

    const dateToDuration = new Map<string, number>()
    const podcastDuration = new Map<string, number>()
    const dateSet = new Set<string>()
    let totalDuration = 0
    let totalEpisodes = 0
    let completedEpisodes = 0

    for (const h of history) {
      const date = h.listenedAt.split('T')[0]
      dateSet.add(date)
      const curDur = dateToDuration.get(date) || 0
      dateToDuration.set(date, curDur + h.duration)
      totalDuration += h.duration
      totalEpisodes++
      if (h.completed) completedEpisodes++

      const curPod = podcastDuration.get(h.podcastId) || 0
      podcastDuration.set(h.podcastId, curPod + h.duration)
    }

    const sortedDates = [...dateSet].sort()
    let consecutiveDays = 1
    let longestStreak = 1
    let currentStreak = 1

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1])
      const cur = new Date(sortedDates[i])
      const diff = Math.round((cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (diff === 1) {
        currentStreak++
        if (currentStreak > longestStreak) longestStreak = currentStreak
      } else {
        currentStreak = 1
      }
    }
    consecutiveDays = currentStreak

    const startD = new Date(ws)
    const dailyBreakdown: Array<{ date: string; duration: number }> = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startD)
      d.setDate(startD.getDate() + i)
      const ds = d.toISOString().split('T')[0]
      dailyBreakdown.push({ date: ds, duration: dateToDuration.get(ds) || 0 })
    }

    const favoritePodcasts: Array<{ podcastId: string; name: string; duration: number }> = []
    const sortedPodcasts = [...podcastDuration.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    for (const [podcastId, duration] of sortedPodcasts) {
      const p = db.prepare('SELECT name FROM podcasts WHERE id = ?').get(podcastId) as any
      if (p) {
        favoritePodcasts.push({ podcastId, name: p.name, duration })
      }
    }

    res.json({
      success: true,
      data: {
        weekStart: ws,
        weekEnd,
        totalDuration,
        favoritePodcasts,
        consecutiveDays,
        longestStreak,
        totalEpisodes,
        completedEpisodes,
        dailyBreakdown,
      },
    })
  } catch (error) {
    console.error('获取周报失败:', error)
    res.status(500).json({ success: false, error: '获取周报失败' })
  }
})

export default router
