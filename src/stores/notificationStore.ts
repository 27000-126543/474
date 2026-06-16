import { create } from 'zustand'

export interface Notification {
  id: string
  type: 'recommendation' | 'download' | 'report' | string
  title: string
  content: string
  podcastId: string
  read: boolean
  createdAt: string
}

interface NotificationStore {
  notifications: Notification[]
  loading: boolean
  open: boolean

  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  toggleOpen: () => void
  setOpen: (open: boolean) => void
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  loading: false,
  open: false,

  fetchNotifications: async () => {
    try {
      set({ loading: true })
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (data.success) {
        set({ notifications: data.data })
      }
    } catch (error) {
      console.error('获取通知列表失败:', error)
    } finally {
      set({ loading: false })
    }
  },

  markAsRead: async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      set({
        notifications: get().notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      set({
        notifications: get().notifications.map((n) => ({ ...n, read: true })),
      })
    } catch (error) {
      console.error('全部已读失败:', error)
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      set({
        notifications: get().notifications.filter((n) => n.id !== id),
      })
    } catch (error) {
      console.error('删除通知失败:', error)
    }
  },

  toggleOpen: () => set({ open: !get().open }),
  setOpen: (open: boolean) => set({ open }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}))
