import { useEffect, useRef, useState } from 'react'
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
  Sparkles
} from 'lucide-react'
import { useReportStore } from '@/stores/reportStore'

export default function Report() {
  const {
    weeklyReport,
    reportList,
    selectedWeekStart,
    loading,
    listLoading,
    fetchReportList,
    fetchWeeklyReport,
    selectWeek,
    formatDuration
  } = useReportStore()
  const reportRef = useRef<HTMLDivElement>(null)
  const [listOpen, setListOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      await fetchWeeklyReport()
      fetchReportList()
    }
    init()
  }, [fetchReportList, fetchWeeklyReport])

  const handleExportPDF = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF } = await import('jspdf')

      if (!reportRef.current) return

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#1A1A2E',
        scale: 2
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

      const weekLabel = weeklyReport?.weekStart
        ? `周报_${weeklyReport.weekStart}_${weeklyReport.weekEnd}`
        : '收听周报'
      pdf.save(`${weekLabel}.pdf`)
    } catch (e) {
      console.error('PDF export error:', e)
    }
  }

  if (loading && !weeklyReport) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-warmgray-100">
              收听周报
            </h1>
            <p className="text-sm text-warmgray-500">
              {weeklyReport?.weekStart} ~ {weeklyReport?.weekEnd}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

          <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出 PDF
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-2">
            <h3 className="font-serif text-lg font-semibold text-warmgray-100 mb-6">
              每日收听时长
            </h3>
            <div className="h-56 flex items-end gap-3">
              {weeklyReport?.dailyBreakdown?.map((day, idx) => {
                const maxDuration = Math.max(
                  ...(weeklyReport?.dailyBreakdown?.map(d => d.duration) || [1])
                )
                const height = maxDuration > 0 ? (day.duration / maxDuration) * 100 : 0
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-warmgray-500">
                      {day.duration > 0 ? formatDuration(Math.round(day.duration / 60) * 60) : ''}
                    </span>
                    <div className="w-full h-full flex items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          day.duration > 0
                            ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                            : 'bg-warmgray-700/30'
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className="text-xs text-warmgray-600">
                      {weekDays[idx] || day.date.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-serif text-lg font-semibold text-warmgray-100 mb-6">
              最爱节目
            </h3>
            <div className="space-y-4">
              {weeklyReport?.favoritePodcasts?.length ? (
                weeklyReport.favoritePodcasts.map((pod, idx) => (
                  <div key={pod.podcastId} className="flex items-center gap-3">
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

        <div className="card p-6">
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
                  className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all"
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
      </div>
    </div>
  )
}
