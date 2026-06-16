import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Clock,
  Calendar,
  Flame,
  Trophy,
  Download,
  TrendingUp,
  ChevronRight,
  History,
  Sparkles,
  CalendarDays,
  Play,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useReportStore } from '@/stores/reportStore'

export default function Report() {
  const navigate = useNavigate()
  const {
    weeklyReport,
    monthlyReport,
    reportList,
    selectedWeekStart,
    view,
    loading,
    listLoading,
    dailyLoading,
    monthlyLoading,
    fetchReportList,
    fetchWeeklyReport,
    fetchMonthlyReport,
    selectWeek,
    selectDay,
    selectedDay,
    dailyEpisodes,
    setView,
    formatDuration
  } = useReportStore()

  const reportRef = useRef<HTMLDivElement>(null)
  const [listOpen, setListOpen] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (view === 'weekly') {
        await fetchWeeklyReport()
        fetchReportList()
      } else {
        await fetchMonthlyReport()
      }
    }
    init()
  }, [view, fetchReportList, fetchWeeklyReport, fetchMonthlyReport])

  const handleExportPDF = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF } = await import('jspdf')

      if (!reportRef.current) return

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#1A1A2E',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const gradientElements = clonedDoc.querySelectorAll('[class*="gradient"]')
          gradientElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            const bg = htmlEl.style.backgroundImage
            if (bg && bg.includes('gradient')) {
              htmlEl.style.backgroundImage = 'none'
              htmlEl.style.backgroundColor = '#E8A838'
            }
          })

          const allEls = clonedDoc.querySelectorAll('*')
          allEls.forEach((el) => {
            const htmlEl = el as HTMLElement
            const compStyle = window.getComputedStyle(el as Element)
            const bgImage = compStyle.backgroundImage
            if (bgImage && bgImage.includes('gradient')) {
              htmlEl.style.backgroundImage = 'none'
              const bgColor = compStyle.backgroundColor
              if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
                htmlEl.style.backgroundColor = '#E8A838'
              }
            }
          })
        }
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      let label = '收听报告'
      if (view === 'weekly' && weeklyReport?.weekStart) {
        label = `周报_${weeklyReport.weekStart}_${weeklyReport.weekEnd}`
      } else if (view === 'monthly' && monthlyReport?.month) {
        label = `月报_${monthlyReport.month}`
      }
      pdf.save(`${label}.pdf`)
    } catch (e) {
      console.error('PDF export error:', e)
    }
  }

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  const monthOptions = useMemo(() => {
    const months: string[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return months
  }, [])

  const handleDayClick = (date: string, duration: number) => {
    if (duration === 0) return
    if (selectedDay === date) {
      selectDay(null)
    } else {
      selectDay(date)
    }
  }

  const handleWeekClick = (weekStart: string) => {
    setView('weekly')
    selectWeek(weekStart)
  }

  const isLoading = view === 'weekly' ? loading : monthlyLoading

  if (isLoading && !weeklyReport && !monthlyReport) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setView('weekly')}
                className={`text-sm font-medium transition-colors ${
                  view === 'weekly'
                    ? 'text-amber-400'
                    : 'text-warmgray-500 hover:text-warmgray-300'
                }`}
              >
                周报
              </button>
              <span className="text-warmgray-600">|</span>
              <button
                onClick={() => setView('monthly')}
                className={`text-sm font-medium transition-colors ${
                  view === 'monthly'
                    ? 'text-amber-400'
                    : 'text-warmgray-500 hover:text-warmgray-300'
                }`}
              >
                月报
              </button>
            </div>
            <p className="text-sm text-warmgray-500">
              {view === 'weekly'
                ? `${weeklyReport?.weekStart || ''} ~ ${weeklyReport?.weekEnd || ''}`
                : `${monthlyReport?.monthStart || ''} ~ ${monthlyReport?.monthEnd || ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {view === 'weekly' && (
            <div className="relative">
              <button
                onClick={() => setListOpen(!listOpen)}
                className="btn-secondary flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                历史周报
                {reportList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                    {reportList.length}
                  </span>
                )}
              </button>

              {listOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 card overflow-hidden animate-slide-up z-30">
                  <div className="p-3 border-b border-warmgray-700/30">
                    <p className="text-sm font-medium text-warmgray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      选择报告日期
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {listLoading && reportList.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    ) : reportList.length === 0 ? (
                      <div className="p-6 text-center text-warmgray-500 text-sm">
                        暂无历史报告
                      </div>
                    ) : (
                      <div className="divide-y divide-warmgray-700/20">
                        <button
                          onClick={() => {
                            selectWeek(null)
                            setListOpen(false)
                          }}
                          className={`w-full p-3 flex items-center justify-between text-left transition-colors hover:bg-warmgray-700/10 ${
                            !selectedWeekStart ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-warmgray-100 flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              本周（最新）
                            </p>
                            <p className="text-xs text-warmgray-500 mt-0.5">
                              {weeklyReport?.weekStart || ''} ~ {weeklyReport?.weekEnd || ''}
                            </p>
                          </div>
                          {!selectedWeekStart && (
                            <ChevronRight className="w-4 h-4 text-amber-400" />
                          )}
                        </button>
                        {reportList.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              selectWeek(r.weekStart)
                              setListOpen(false)
                            }}
                            className={`w-full p-3 flex items-center justify-between text-left transition-colors hover:bg-warmgray-700/10 ${
                              selectedWeekStart === r.weekStart ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-warmgray-100">
                                {r.weekStart} ~ {r.weekEnd}
                              </p>
                              <p className="text-xs text-warmgray-500 mt-0.5 flex items-center gap-3">
                                <span>时长 {formatDuration(r.totalDuration)}</span>
                                <span className="text-green-400">{r.consecutiveDays}天连续</span>
                              </p>
                            </div>
                            {selectedWeekStart === r.weekStart && (
                              <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'monthly' && (
            <div className="relative">
              <button
                onClick={() => setMonthPickerOpen(!monthPickerOpen)}
                className="btn-secondary flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                {monthlyReport?.month || '选择月份'}
                <ChevronDown className="w-4 h-4" />
              </button>

              {monthPickerOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 card overflow-hidden animate-slide-up z-30">
                  <div className="max-h-64 overflow-y-auto">
                    {monthOptions.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          fetchMonthlyReport(m)
                          setMonthPickerOpen(false)
                        }}
                        className={`w-full p-3 text-left text-sm transition-colors hover:bg-warmgray-700/10 ${
                          monthlyReport?.month === m
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'text-warmgray-300'
                        }`}
                      >
                        {m.replace('-', '年')}月
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出 PDF
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        {view === 'weekly' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-sm text-warmgray-400 mb-1">总收听时长</p>
                <p className="font-serif text-3xl font-bold text-warmgray-100">
                  {weeklyReport ? formatDuration(weeklyReport.totalDuration) : '--'}
                </p>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center mb-4">
                  <Flame className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-sm text-warmgray-400 mb-1">连续收听</p>
                <p className="font-serif text-3xl font-bold text-warmgray-100">
                  {weeklyReport?.consecutiveDays || 0}
                  <span className="text-base font-normal text-warmgray-500 ml-1">天</span>
                </p>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm text-warmgray-400 mb-1">最长连续</p>
                <p className="font-serif text-3xl font-bold text-warmgray-100">
                  {weeklyReport?.longestStreak || 0}
                  <span className="text-base font-normal text-warmgray-500 ml-1">天</span>
                </p>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-sm text-warmgray-400 mb-1">已收听天数</p>
                <p className="font-serif text-3xl font-bold text-warmgray-100">
                  {weeklyReport?.dailyBreakdown?.filter(d => d.duration > 0).length || 0}
                  <span className="text-base font-normal text-warmgray-500 ml-1">天</span>
                </p>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-serif text-lg font-semibold text-warmgray-100 mb-6">
                每日收听时长
                <span className="text-xs text-warmgray-500 font-normal ml-2">
                  点击柱状图查看当日详情
                </span>
              </h3>
              <div className="h-56 flex items-end gap-3">
                {weeklyReport?.dailyBreakdown?.map((day, idx) => {
                  const maxDuration = Math.max(
                    ...(weeklyReport?.dailyBreakdown?.map(d => d.duration) || [1])
                  )
                  const height = maxDuration > 0 ? (day.duration / maxDuration) * 100 : 0
                  const isSelected = selectedDay === day.date
                  const hasData = day.duration > 0
                  return (
                    <div
                      key={idx}
                      className={`flex-1 flex flex-col items-center gap-2 ${hasData ? 'cursor-pointer' : ''}`}
                      onClick={() => handleDayClick(day.date, day.duration)}
                    >
                      <span className="text-xs text-warmgray-500">
                        {hasData ? formatDuration(Math.round(day.duration / 60) * 60) : ''}
                      </span>
                      <div className="w-full h-full flex items-end">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            isSelected
                              ? 'bg-gradient-to-t from-amber-600 to-amber-400 ring-2 ring-amber-400/50'
                              : hasData
                              ? 'bg-gradient-to-t from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300'
                              : 'bg-warmgray-700/30'
                          }`}
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                      </div>
                      <span className={`text-xs ${isSelected ? 'text-amber-400' : 'text-warmgray-600'}`}>
                        {weekDays[idx] || day.date.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {selectedDay && (
              <div className="card p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg font-semibold text-warmgray-100 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-amber-500" />
                    {selectedDay} 收听详情
                  </h3>
                  <button
                    onClick={() => selectDay(null)}
                    className="text-warmgray-500 hover:text-warmgray-300 transition-colors"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>

                {dailyLoading ? (
                  <div className="py-8 text-center">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : dailyEpisodes.length === 0 ? (
                  <p className="text-center text-warmgray-500 py-6">当天无收听记录</p>
                ) : (
                  <div className="space-y-2">
                    {dailyEpisodes.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-warmgray-700/5 hover:bg-warmgray-700/10 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/podcast/${ep.podcastId}`)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                          <Play className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-warmgray-100 truncate">
                            {ep.episodeTitle}
                          </p>
                          <p className="text-xs text-warmgray-500 truncate">
                            {ep.podcastName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-warmgray-300">
                            {formatDuration(ep.duration)}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {ep.completed ? (
                              <span className="text-[10px] text-green-400 flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> 已完成
                              </span>
                            ) : (
                              <span className="text-[10px] text-warmgray-500">
                                {Math.round((ep.position / ep.duration) * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-6 lg:col-span-2">
                <h3 className="font-serif text-lg font-semibold text-warmgray-100 mb-6">
                  收听日历热力图
                </h3>
                <div className="grid grid-cols-7 gap-2">
                  {weeklyReport?.dailyBreakdown?.map((day, idx) => {
                    const maxDuration = Math.max(
                      ...(weeklyReport?.dailyBreakdown?.map(d => d.duration) || [1])
                    )
                    const intensity = maxDuration > 0 ? day.duration / maxDuration : 0
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all cursor-pointer hover:ring-2 hover:ring-amber-500/40 ${
                          day.duration > 0 ? '' : 'cursor-default'
                        }`}
                        style={{
                          backgroundColor:
                            intensity > 0.7
                              ? 'rgba(232, 168, 56, 0.6)'
                              : intensity > 0.3
                              ? 'rgba(232, 168, 56, 0.3)'
                              : intensity > 0
                              ? 'rgba(232, 168, 56, 0.15)'
                              : 'rgba(122, 114, 104, 0.15)',
                          color: intensity > 0.5 ? '#1A1A2E' : '#A09890'
                        }}
                        onClick={() => handleDayClick(day.date, day.duration)}
                      >
                        <span className="font-medium">{weekDays[idx]?.slice(1) || ''}</span>
                        {day.duration > 0 && (
                          <span className="text-[10px] opacity-80 mt-0.5">
                            {formatDuration(day.duration).replace('分钟', '分')}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <span className="text-xs text-warmgray-500">少</span>
                  <div className="flex gap-1">
                    {[0.15, 0.3, 0.6].map((opacity, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: `rgba(232, 168, 56, ${opacity})` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-warmgray-500">多</span>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-serif text-lg font-semibold text-warmgray-100 mb-6">
                  最爱节目
                </h3>
                <div className="space-y-4">
                  {weeklyReport?.favoritePodcasts?.length ? (
                    weeklyReport.favoritePodcasts.map((pod, idx) => (
                      <div
                        key={pod.podcastId}
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate(`/podcast/${pod.podcastId}`)}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            idx === 0
                              ? 'bg-amber-500 text-midnight'
                              : idx === 1
                              ? 'bg-warmgray-500 text-midnight'
                              : 'bg-warmgray-700 text-warmgray-300'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-warmgray-100 truncate">
                            {pod.name}
                          </p>
                          <p className="text-xs text-warmgray-500">
                            {formatDuration(pod.duration)}
                          </p>
                        </div>
                        <TrendingUp className={`w-4 h-4 ${
                          idx === 0 ? 'text-amber-500' : 'text-warmgray-600'
                        }`} />
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-warmgray-500 py-8">
                      暂无收听记录
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {view === 'monthly' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-sm text-warmgray-400 mb-1">总收听时长</p>
                <p className="font-serif text-3xl font-bold text-warmgray-100">
                  {monthlyReport ? formatDuration(monthlyReport.totalDuration) : '--'}
                </p>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-sm text-warmgray-400 mb-1">收听天数</p>
                <p className="font-serif text-3xl font-bold text-warmgray-100">
                  {monthlyReport?.listenedDays || 0}
                  <span className="text-base font-normal text-warmgray-500 ml-1">天</span>
                </p>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center mb-4">
                  <Flame className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-sm text-warmgray-400 mb-1">最长连续</p>
                <p className="font-serif text-3xl font-bold text-warmgray-100">
                  {monthlyReport?.longestStreak || 0}
                  <span className="text-base font-normal text-warmgray-500 ml-1">天</span>
                </p>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm text-warmgray-400 mb-1">完成剧集</p>
                <p className="font-serif text-3xl font-bold text-warmgray-100">
                  {monthlyReport?.completedEpisodes || 0}
                  <span className="text-base font-normal text-warmgray-500 ml-1">集</span>
                </p>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-serif text-lg font-semibold text-warmgray-100 mb-6">
                每周收听趋势
                <span className="text-xs text-warmgray-500 font-normal ml-2">
                  点击可跳转到对应周报
                </span>
              </h3>
              <div className="h-64 flex items-end gap-3">
                {monthlyReport?.weeklyBreakdown?.map((week, idx) => {
                  const maxDuration = Math.max(
                    ...(monthlyReport?.weeklyBreakdown?.map(w => w.duration) || [1])
                  )
                  const height = maxDuration > 0 ? (week.duration / maxDuration) * 100 : 0
                  return (
                    <div
                      key={idx}
                      className={`flex-1 flex flex-col items-center gap-2 ${week.duration > 0 ? 'cursor-pointer' : ''}`}
                      onClick={() => week.duration > 0 && handleWeekClick(week.weekStart)}
                    >
                      <span className="text-xs text-warmgray-500">
                        {week.duration > 0 ? formatDuration(Math.round(week.duration / 60) * 60) : ''}
                      </span>
                      <div className="w-full h-full flex items-end">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            week.duration > 0
                              ? 'bg-gradient-to-t from-deepnavy-600 to-amber-500 hover:from-deepnavy-500 hover:to-amber-400'
                              : 'bg-warmgray-700/30'
                          }`}
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-warmgray-600 text-center leading-tight">
                        {week.weekStart.slice(5)}
                        <br />
                        ~ {week.weekEnd.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-serif text-lg font-semibold text-warmgray-100 mb-6">
                最爱节目 Top 5
              </h3>
              <div className="space-y-3">
                {monthlyReport?.favoritePodcasts?.length ? (
                  monthlyReport.favoritePodcasts.map((pod, idx) => (
                    <div
                      key={pod.podcastId}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-warmgray-700/5 cursor-pointer transition-colors"
                      onClick={() => navigate(`/podcast/${pod.podcastId}`)}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          idx === 0
                            ? 'bg-amber-500 text-midnight'
                            : idx === 1
                            ? 'bg-warmgray-500 text-midnight'
                            : idx === 2
                            ? 'bg-warmgray-600 text-warmgray-200'
                            : 'bg-warmgray-700 text-warmgray-400'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warmgray-100 truncate">
                          {pod.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-sm text-warmgray-400">
                          {formatDuration(pod.duration)}
                        </p>
                        <TrendingUp className={`w-4 h-4 ${
                          idx === 0 ? 'text-amber-500' : 'text-warmgray-600'
                        }`} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-warmgray-500 py-8">
                    本月暂无收听记录
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
