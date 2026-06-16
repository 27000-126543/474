import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()
const USER_ID = 'user-1'

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function normalizeWeekStart(dateStr: string): { weekStart: string; weekEnd: string } {
  const monday = getMondayOf(new Date(dateStr))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { weekStart: formatDate(monday), weekEnd: formatDate(sunday) }
}

function mergeReports(existing: any, oldIrregular: any) {
  const keepExisting = existing.totalDuration >= oldIrregular.totalDuration
  const better = keepExisting ? existing : oldIrregular
  return {
    totalDuration: Math.max(existing.totalDuration || 0, oldIrregular.totalDuration || 0),
    consecutiveDays: Math.max(existing.consecutiveDays || 0, oldIrregular.consecutiveDays || 0),
    longestStreak: Math.max(existing.longestStreak || 0, oldIrregular.longestStreak || 0),
    totalEpisodes: Math.max(existing.totalEpisodes || 0, oldIrregular.totalEpisodes || 0),
    completedEpisodes: Math.max(existing.completedEpisodes || 0, oldIrregular.completedEpisodes || 0),
    favoritePodcasts: better.favoritePodcasts || existing.favoritePodcasts,
    dailyBreakdown: better.dailyBreakdown || existing.dailyBreakdown,
  }
}

function sanitizeWeeklyReports() {
  const all = db.prepare(
    'SELECT * FROM weekly_reports WHERE userId = ?'
  ).all(USER_ID) as any[]

  const groups = new Map<string, any[]>()
  for (const row of all) {
    const { weekStart } = normalizeWeekStart(row.weekStart)
    if (!groups.has(weekStart)) groups.set(weekStart, [])
    groups.get(weekStart)!.push(row)
  }

  for (const [canonicalWeek, rows] of groups) {
    const canonicalSunday = formatDate(new Date(new Date(canonicalWeek).getTime() + 6 * 86400000))
    const canonicalRow = rows.find(r => r.weekStart === canonicalWeek)
    const irregularRows = rows.filter(r => r.weekStart !== canonicalWeek)

    if (irregularRows.length === 0) continue

    let merged: any

    if (canonicalRow) {
      const mergedData = mergeReports(canonicalRow, irregularRows[0])
      merged = {
        ...canonicalRow,
        ...mergedData,
        weekStart: canonicalWeek,
        weekEnd: canonicalSunday,
      }
    } else {
      const src = irregularRows[0]
      const srcFavorite = src.favoritePodcasts
        ? (typeof src.favoritePodcasts === 'string' ? JSON.parse(src.favoritePodcasts) : src.favoritePodcasts)
        : []
      const srcDaily = src.dailyBreakdown
        ? (typeof src.dailyBreakdown === 'string' ? JSON.parse(src.dailyBreakdown) : src.dailyBreakdown)
        : []

      const oldStart = new Date(src.weekStart)
      const newStart = new Date(canonicalWeek)
      const dayDiff = Math.round((newStart.getTime() - oldStart.getTime()) / 86400000)

      const shiftedDaily = srcDaily.map((d: any) => {
        const oldDate = new Date(d.date)
        oldDate.setDate(oldDate.getDate() + dayDiff)
        return { ...d, date: formatDate(oldDate) }
      }).filter((d: any) => d.date >= canonicalWeek && d.date <= canonicalSunday)

      while (shiftedDaily.length < 7) {
        const lastDate = shiftedDaily.length > 0
          ? new Date(shiftedDaily[shiftedDaily.length - 1].date)
          : new Date(canonicalWeek)
        lastDate.setDate(lastDate.getDate() + 1)
        const ds = formatDate(lastDate)
        if (ds > canonicalSunday) break
        shiftedDaily.push({ date: ds, duration: 0 })
      }

      merged = {
        id: uuidv4(),
        userId: USER_ID,
        weekStart: canonicalWeek,
        weekEnd: canonicalSunday,
        totalDuration: src.totalDuration || 0,
        consecutiveDays: src.consecutiveDays || 0,
        longestStreak: src.longestStreak || 0,
        totalEpisodes: src.totalEpisodes || 0,
        completedEpisodes: src.completedEpisodes || 0,
        favoritePodcasts: JSON.stringify(srcFavorite),
        dailyBreakdown: JSON.stringify(shiftedDaily),
        createdAt: src.createdAt || new Date().toISOString(),
      }
    }

    for (const row of rows) {
      db.prepare('DELETE FROM weekly_reports WHERE id = ?').run(row.id)
    }

    db.prepare(`
      INSERT INTO weekly_reports
      (id, userId, weekStart, weekEnd, totalDuration, consecutiveDays, longestStreak, totalEpisodes, completedEpisodes, favoritePodcasts, dailyBreakdown, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      merged.id, USER_ID, merged.weekStart, merged.weekEnd,
      merged.totalDuration, merged.consecutiveDays, merged.longestStreak,
      merged.totalEpisodes, merged.completedEpisodes,
      merged.favoritePodcasts,
      merged.dailyBreakdown,
      merged.createdAt
    )
  }
}

function computeWeekReport(weekStart: string, weekEnd: string) {
  const history = db.prepare(
    'SELECT * FROM listen_history WHERE userId = ? AND date(listenedAt) >= ? AND date(listenedAt) <= ?'
  ).all(USER_ID, weekStart, weekEnd) as any[]

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
  let longestStreak = 0
  let currentStreak = 0

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentStreak = 1
    } else {
      const prev = new Date(sortedDates[i - 1])
      const cur = new Date(sortedDates[i])
      const diff = Math.round((cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (diff === 1) {
        currentStreak++
      } else {
        currentStreak = 1
      }
    }
    if (currentStreak > longestStreak) longestStreak = currentStreak
  }

  const startD = new Date(weekStart)
  const dailyBreakdown: Array<{ date: string; duration: number }> = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startD)
    d.setDate(startD.getDate() + i)
    const ds = formatDate(d)
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

  const listenedDays = dateSet.size
  const consecutiveDays = listenedDays > 0 ? longestStreak : 0

  return {
    weekStart,
    weekEnd,
    totalDuration,
    favoritePodcasts,
    consecutiveDays,
    longestStreak,
    totalEpisodes,
    completedEpisodes,
    dailyBreakdown,
    listenedDays,
  }
}

function saveReportToDb(report: ReturnType<typeof computeWeekReport>, reportId?: string) {
  const id = reportId || uuidv4()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT OR REPLACE INTO weekly_reports
    (id, userId, weekStart, weekEnd, totalDuration, consecutiveDays, longestStreak, totalEpisodes, completedEpisodes, favoritePodcasts, dailyBreakdown, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, USER_ID, report.weekStart, report.weekEnd,
    report.totalDuration, report.consecutiveDays, report.longestStreak,
    report.totalEpisodes, report.completedEpisodes,
    JSON.stringify(report.favoritePodcasts),
    JSON.stringify(report.dailyBreakdown),
    now
  )
  return id
}

function ensureLastWeekReport() {
  const today = new Date()
  const lastWeekMonday = getMondayOf(today)
  lastWeekMonday.setDate(lastWeekMonday.getDate() - 7)
  const ws = formatDate(lastWeekMonday)
  const we = formatDate(new Date(lastWeekMonday.getTime() + 6 * 86400000))

  const existing = db.prepare(
    'SELECT id FROM weekly_reports WHERE userId = ? AND weekStart = ?'
  ).get(USER_ID, ws) as any

  if (!existing) {
    const report = computeWeekReport(ws, we)
    const id = saveReportToDb(report)

    const notifExists = db.prepare(
      'SELECT id FROM notifications WHERE userId = ? AND type = ? AND createdAt >= ?'
    ).get(USER_ID, 'report', ws + 'T00:00:00Z') as any

    if (!notifExists && report.totalDuration > 0) {
      const notifId = uuidv4()
      db.prepare(
        'INSERT INTO notifications (id, userId, type, title, content, podcastId, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        notifId, USER_ID, 'report',
        '周报已生成',
        `你 ${ws} ~ ${we} 的收听报告已生成，共 ${Math.floor(report.totalDuration / 60)} 分钟`,
        '', 0, new Date().toISOString()
      )
    }
    return { id, weekStart: ws, weekEnd: we, generated: true }
  }
  return { id: existing.id, weekStart: ws, weekEnd: we, generated: false }
}

router.get('/list', (_req: Request, res: Response): void => {
  try {
    sanitizeWeeklyReports()
    ensureLastWeekReport()

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
    const { weekStart: qs } = req.query

    let targetWeekStart: string
    let targetWeekEnd: string

    if (qs && typeof qs === 'string') {
      const norm = normalizeWeekStart(qs)
      targetWeekStart = norm.weekStart
      targetWeekEnd = norm.weekEnd
    } else {
      const monday = getMondayOf(new Date())
      targetWeekStart = formatDate(monday)
      targetWeekEnd = formatDate(new Date(monday.getTime() + 6 * 86400000))
    }

    const existing = db.prepare(
      'SELECT * FROM weekly_reports WHERE userId = ? AND weekStart = ?'
    ).get(USER_ID, targetWeekStart) as any

    if (existing) {
      const favoritePodcasts = existing.favoritePodcasts ? JSON.parse(existing.favoritePodcasts) : []
      const dailyBreakdown = existing.dailyBreakdown ? JSON.parse(existing.dailyBreakdown) : []

      res.json({
        success: true,
        data: {
          id: existing.id,
          weekStart: existing.weekStart,
          weekEnd: existing.weekEnd,
          totalDuration: existing.totalDuration,
          favoritePodcasts,
          consecutiveDays: existing.consecutiveDays,
          longestStreak: existing.longestStreak,
          totalEpisodes: existing.totalEpisodes,
          completedEpisodes: existing.completedEpisodes,
          dailyBreakdown,
          createdAt: existing.createdAt,
        },
      })
      return
    }

    const report = computeWeekReport(targetWeekStart, targetWeekEnd)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekEndDate = new Date(targetWeekEnd + 'T23:59:59')
    const isWeekComplete = today > weekEndDate

    let reportId: string | undefined
    if (isWeekComplete || report.totalDuration > 0) {
      reportId = saveReportToDb(report)
    }

    res.json({
      success: true,
      data: {
        id: reportId,
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        totalDuration: report.totalDuration,
        favoritePodcasts: report.favoritePodcasts,
        consecutiveDays: report.consecutiveDays,
        longestStreak: report.longestStreak,
        totalEpisodes: report.totalEpisodes,
        completedEpisodes: report.completedEpisodes,
        dailyBreakdown: report.dailyBreakdown,
      },
    })
  } catch (error) {
    console.error('获取周报失败:', error)
    res.status(500).json({ success: false, error: '获取周报失败' })
  }
})

router.get('/daily', (req: Request, res: Response): void => {
  try {
    const { date } = req.query
    if (!date || typeof date !== 'string') {
      res.status(400).json({ success: false, error: '缺少日期参数' })
      return
    }

    const history = db.prepare(`
      SELECT h.*, e.title, e.podcastId, p.name as podcastName
      FROM listen_history h
      INNER JOIN episodes e ON h.episodeId = e.id
      INNER JOIN podcasts p ON e.podcastId = p.id
      WHERE h.userId = ? AND date(h.listenedAt) = ?
      ORDER BY h.listenedAt DESC
    `).all(USER_ID, date) as any[]

    const result = history.map((h) => ({
      id: h.id,
      episodeId: h.episodeId,
      episodeTitle: h.title,
      podcastId: h.podcastId,
      podcastName: h.podcastName,
      duration: h.duration,
      position: h.position,
      completed: !!h.completed,
      listenedAt: h.listenedAt,
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('获取日明细失败:', error)
    res.status(500).json({ success: false, error: '获取日明细失败' })
  }
})

router.get('/monthly', (req: Request, res: Response): void => {
  try {
    const { month } = req.query
    let targetMonth: string

    if (month && typeof month === 'string') {
      targetMonth = month
    } else {
      const now = new Date()
      targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }

    const [yearStr, monthStr] = targetMonth.split('-')
    const year = parseInt(yearStr)
    const m = parseInt(monthStr) - 1
    const monthStart = formatDate(new Date(year, m, 1))
    const monthEnd = formatDate(new Date(year, m + 1, 0))

    const history = db.prepare(
      'SELECT * FROM listen_history WHERE userId = ? AND date(listenedAt) >= ? AND date(listenedAt) <= ?'
    ).all(USER_ID, monthStart, monthEnd) as any[]

    let totalDuration = 0
    let totalEpisodes = 0
    let completedEpisodes = 0
    const dateSet = new Set<string>()
    const podcastDuration = new Map<string, number>()
    const weekMap = new Map<string, number>()

    for (const h of history) {
      const date = h.listenedAt.split('T')[0]
      dateSet.add(date)
      totalDuration += h.duration
      totalEpisodes++
      if (h.completed) completedEpisodes++

      const curPod = podcastDuration.get(h.podcastId) || 0
      podcastDuration.set(h.podcastId, curPod + h.duration)

      const monday = getMondayOf(new Date(date))
      const ws = formatDate(monday)
      const curWeek = weekMap.get(ws) || 0
      weekMap.set(ws, curWeek + h.duration)
    }

    const firstMonday = getMondayOf(new Date(year, m, 1))
    const lastDay = new Date(year, m + 1, 0)
    const weeks: Array<{ weekStart: string; weekEnd: string; duration: number }> = []
    let cur = new Date(firstMonday)
    while (cur <= lastDay) {
      const ws = formatDate(cur)
      const we = formatDate(new Date(cur.getTime() + 6 * 86400000))
      weeks.push({
        weekStart: ws,
        weekEnd: we,
        duration: weekMap.get(ws) || 0,
      })
      cur.setDate(cur.getDate() + 7)
    }

    const favoritePodcasts: Array<{ podcastId: string; name: string; duration: number }> = []
    const sortedPodcasts = [...podcastDuration.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    for (const [podcastId, duration] of sortedPodcasts) {
      const p = db.prepare('SELECT name FROM podcasts WHERE id = ?').get(podcastId) as any
      if (p) {
        favoritePodcasts.push({ podcastId, name: p.name, duration })
      }
    }

    const listenedDays = dateSet.size

    const sortedDates = [...dateSet].sort()
    let longestStreak = 0
    let currentStreak = 0
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1
      } else {
        const prev = new Date(sortedDates[i - 1])
        const curDate = new Date(sortedDates[i])
        const diff = Math.round((curDate.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
        if (diff === 1) {
          currentStreak++
        } else {
          currentStreak = 1
        }
      }
      if (currentStreak > longestStreak) longestStreak = currentStreak
    }

    res.json({
      success: true,
      data: {
        month: targetMonth,
        monthStart,
        monthEnd,
        totalDuration,
        listenedDays,
        longestStreak,
        totalEpisodes,
        completedEpisodes,
        favoritePodcasts,
        weeklyBreakdown: weeks,
      },
    })
  } catch (error) {
    console.error('获取月报失败:', error)
    res.status(500).json({ success: false, error: '获取月报失败' })
  }
})

router.post('/generate', (_req: Request, res: Response): void => {
  try {
    const result = ensureLastWeekReport()
    const existing = db.prepare(
      'SELECT * FROM weekly_reports WHERE userId = ? AND weekStart = ?'
    ).get(USER_ID, result.weekStart) as any
    res.json({
      success: true,
      data: {
        id: existing?.id,
        weekStart: result.weekStart,
        weekEnd: result.weekEnd,
        alreadyExists: !result.generated,
      },
    })
  } catch (error) {
    console.error('生成周报失败:', error)
    res.status(500).json({ success: false, error: '生成周报失败' })
  }
})

export default router
