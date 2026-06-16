import { create } from 'zustand'

export interface UploadRequest {
  id: string
  userId: string
  name: string
  audioUrl: string
  tags: string[]
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string
  createdAt: string
}

export interface Tag {
  id: string
  name: string
}

interface AdminState {
  pendingUploads: UploadRequest[]
  tags: Tag[]
  loading: boolean
  fetchPending: () => Promise<void>
  approveUpload: (id: string) => Promise<boolean>
  rejectUpload: (id: string, reason: string) => Promise<boolean>
  fetchTags: () => Promise<void>
  createTag: (name: string) => Promise<boolean>
  updateTag: (id: string, name: string) => Promise<boolean>
  deleteTag: (id: string) => Promise<boolean>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  pendingUploads: [],
  tags: [],
  loading: false,

  fetchPending: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/admin/pending')
      const data = await res.json()
      if (data.success) {
        set({ pendingUploads: data.data })
      }
    } catch (e) {
      console.error('fetchPending error:', e)
    } finally {
      set({ loading: false })
    }
  },

  approveUpload: async (id: string) => {
    try {
      const res = await fetch(`/api/admin/approve/${id}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        await get().fetchPending()
        return true
      }
      return false
    } catch (e) {
      console.error('approveUpload error:', e)
      return false
    }
  },

  rejectUpload: async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/admin/reject/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectReason: reason })
      })
      const data = await res.json()
      if (data.success) {
        await get().fetchPending()
        return true
      }
      return false
    } catch (e) {
      console.error('rejectUpload error:', e)
      return false
    }
  },

  fetchTags: async () => {
    try {
      const res = await fetch('/api/admin/tags')
      const data = await res.json()
      if (data.success) {
        set({ tags: data.data })
      }
    } catch (e) {
      console.error('fetchTags error:', e)
    }
  },

  createTag: async (name: string) => {
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await res.json()
      if (data.success) {
        await get().fetchTags()
        return true
      }
      return false
    } catch (e) {
      console.error('createTag error:', e)
      return false
    }
  },

  updateTag: async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await res.json()
      if (data.success) {
        await get().fetchTags()
        return true
      }
      return false
    } catch (e) {
      console.error('updateTag error:', e)
      return false
    }
  },

  deleteTag: async (id: string) => {
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        await get().fetchTags()
        return true
      }
      return false
    } catch (e) {
      console.error('deleteTag error:', e)
      return false
    }
  }
}))
