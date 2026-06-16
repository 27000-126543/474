import { useEffect, useRef } from 'react'
import {
  Bell,
  X,
  Download,
  BarChart3,
  Sparkles,
  Trash2,
  CheckCheck
} from 'lucide-react'
import { useNotificationStore, type Notification } from '@/stores/notificationStore'
import { useNavigate } from 'react-router-dom'

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  recommendation: { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  download: { icon: Download, color: 'text-green-400', bg: 'bg-green-500/15' },
  report: { icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/15' },
}

export default function NotificationCenter() {
  const {
    notifications,
    loading,
    open,
    setOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount,
    fetchNotifications,
  } = useNotificationStore()
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, setOpen])

  const formatTime = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    return `${days} 天前`
  }

  const handleClick = (notif: Notification) => {
    markAsRead(notif.id)
    setOpen(false)
    if (notif.podcastId) {
      navigate(`/podcast/${notif.podcastId}`)
    } else if (notif.type === 'report') {
      navigate('/report')
    }
  }

  const count = unreadCount()

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/40 transition-colors"
        title="通知中心"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-midnight">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-[400px] max-w-[calc(100vw-2rem)] card overflow-hidden animate-slide-up z-50">
          <div className="flex items-center justify-between p-4 border-b border-warmgray-700/30">
            <h3 className="font-semibold text-warmgray-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              通知中心
              {count > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                  {count} 条未读
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg text-warmgray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  title="全部已读"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-10 h-10 text-warmgray-700 mx-auto mb-3" />
                <p className="text-warmgray-500 text-sm">暂无通知</p>
              </div>
            ) : (
              <div className="divide-y divide-warmgray-700/20">
                {notifications.map((notif) => {
                  const config = typeConfig[notif.type] || typeConfig.recommendation
                  const Icon = config.icon
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-warmgray-700/10 ${
                        !notif.read ? 'bg-warmgray-700/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}
                        >
                          <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4
                              className={`text-sm font-medium ${
                                !notif.read ? 'text-warmgray-100' : 'text-warmgray-400'
                              }`}
                            >
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-warmgray-500 line-clamp-2 mb-1">
                            {notif.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-warmgray-600">
                              {formatTime(notif.createdAt)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notif.id)
                              }}
                              className="p-1 rounded text-warmgray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="删除通知"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
