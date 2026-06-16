import { create } from 'zustand'
import type { Podcast, Episode } from './podcastStore'

export interface EpisodeNote {
  id: string
  content: string
  rating: number
  createdAt: string
}

export interface SilenceRange {
  start: number
  end: number
}

interface PlayerState {
  currentEpisode: Episode | null
  currentPodcast: Podcast | null
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  timerEnabled: boolean
  timerMinutes: number
  timerRemaining: number
  skipSilence: boolean
  note: string
  rating: number
  notes: EpisodeNote[]
  audioRef: HTMLAudioElement | null
  timerInterval: number | null
  setAudio: (audio: HTMLAudioElement) => void
  play: (episode: Episode, podcast: Podcast) => void
  pause: () => void
  togglePlay: () => void
  seek: (time: number) => void
  setRate: (rate: number) => void
  setTimer: (minutes: number | null) => void
  toggleSkipSilence: () => void
  setNote: (content: string) => void
  setRating: (rating: number) => void
  saveNote: () => Promise<boolean>
  fetchNotes: (episodeId: string) => Promise<void>
  onTimeUpdate: (time: number) => void
  onLoadedMetadata: (duration: number) => void
  onEnded: () => void
  formatTime: (seconds: number) => string
  generateSilenceRanges: (episodeId: string, duration: number) => SilenceRange[]
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentEpisode: null,
  currentPodcast: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  timerEnabled: false,
  timerMinutes: 0,
  timerRemaining: 0,
  skipSilence: false,
  note: '',
  rating: 0,
  notes: [],
  audioRef: null,
  timerInterval: null,

  setAudio: (audio: HTMLAudioElement) => {
    set({ audioRef: audio })
  },

  play: (episode: Episode, podcast: Podcast) => {
    const { audioRef } = get()
    set({
      currentEpisode: episode,
      currentPodcast: podcast,
      isPlaying: true,
      currentTime: 0,
      note: '',
      rating: 0
    })
    if (audioRef) {
      audioRef.src = episode.audioUrl
      audioRef.playbackRate = get().playbackRate
      audioRef.play().catch(console.error)
    }
    get().fetchNotes(episode.id)
  },

  pause: () => {
    const { audioRef } = get()
    set({ isPlaying: false })
    if (audioRef) {
      audioRef.pause()
    }
  },

  togglePlay: () => {
    const { isPlaying, audioRef, currentEpisode } = get()
    if (!currentEpisode || !audioRef) return
    if (isPlaying) {
      audioRef.pause()
      set({ isPlaying: false })
    } else {
      audioRef.play().catch(console.error)
      set({ isPlaying: true })
    }
  },

  seek: (time: number) => {
    const { audioRef } = get()
    set({ currentTime: time })
    if (audioRef) {
      audioRef.currentTime = time
    }
  },

  setRate: (rate: number) => {
    const { audioRef } = get()
    set({ playbackRate: rate })
    if (audioRef) {
      audioRef.playbackRate = rate
    }
  },

  setTimer: (minutes: number | null) => {
    const { timerInterval } = get()
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    if (minutes === null || minutes === 0) {
      set({ timerEnabled: false, timerMinutes: 0, timerRemaining: 0, timerInterval: null })
      return
    }
    const remaining = minutes * 60
    set({ timerEnabled: true, timerMinutes: minutes, timerRemaining: remaining })
    const interval = window.setInterval(() => {
      const state = get()
      if (!state.isPlaying) return
      const newRemaining = state.timerRemaining - 1
      if (newRemaining <= 0) {
        clearInterval(interval)
        set({ timerEnabled: false, timerMinutes: 0, timerRemaining: 0, timerInterval: null })
        const { audioRef } = get()
        if (audioRef) {
          audioRef.pause()
        }
        set({ isPlaying: false })
      } else {
        set({ timerRemaining: newRemaining })
      }
    }, 1000)
    set({ timerInterval: interval })
  },

  toggleSkipSilence: () => {
    set(state => ({ skipSilence: !state.skipSilence }))
  },

  setNote: (content: string) => {
    set({ note: content })
  },

  setRating: (rating: number) => {
    set({ rating })
  },

  saveNote: async () => {
    const { currentEpisode, note, rating } = get()
    if (!currentEpisode) return false
    try {
      const res = await fetch(`/api/listen/episodes/${currentEpisode.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: note, rating })
      })
      const data = await res.json()
      if (data.success) {
        await get().fetchNotes(currentEpisode.id)
        set({ note: '', rating: 0 })
        return true
      }
      return false
    } catch (e) {
      console.error('saveNote error:', e)
      return false
    }
  },

  fetchNotes: async (episodeId: string) => {
    try {
      const res = await fetch(`/api/listen/episodes/${episodeId}/notes`)
      const data = await res.json()
      if (data.success) {
        set({ notes: data.data })
      }
    } catch (e) {
      console.error('fetchNotes error:', e)
    }
  },

  onTimeUpdate: (time: number) => {
    set({ currentTime: time })
    const { skipSilence, audioRef, duration, currentEpisode, generateSilenceRanges } = get()
    if (skipSilence && audioRef && currentEpisode && duration > 0) {
      const ranges = generateSilenceRanges(currentEpisode.id, duration)
      for (const range of ranges) {
        if (time >= range.start && time < range.end - 0.5) {
          audioRef.currentTime = range.end
          set({ currentTime: range.end })
          break
        }
      }
    }
  },

  generateSilenceRanges: (episodeId: string, duration: number): SilenceRange[] => {
    if (duration < 60) return []
    let hash = 0
    for (let i = 0; i < episodeId.length; i++) {
      hash = ((hash << 5) - hash) + episodeId.charCodeAt(i)
      hash = hash & hash
    }
    const seed = Math.abs(hash) || 1
    const random = (s: number) => {
      const x = Math.sin(s) * 10000
      return x - Math.floor(x)
    }
    const count = 3 + Math.floor(random(seed) * 3)
    const ranges: SilenceRange[] = []
    const segmentDuration = duration / (count + 1)
    let currentSeed = seed
    for (let i = 0; i < count; i++) {
      currentSeed = currentSeed * 9301 + 49297
      const basePos = segmentDuration * (i + 1)
      const posOffset = (random(currentSeed) - 0.5) * segmentDuration * 0.6
      const start = Math.max(30, Math.min(duration - 60, basePos + posOffset))
      currentSeed = currentSeed * 9301 + 49297
      const silenceDuration = 10 + random(currentSeed) * 20
      const end = Math.min(duration - 10, start + silenceDuration)
      if (end > start + 5) {
        ranges.push({ start, end })
      }
    }
    return ranges
  },

  onLoadedMetadata: (duration: number) => {
    set({ duration })
  },

  onEnded: () => {
    set({ isPlaying: false, currentTime: 0 })
    const { currentEpisode, currentPodcast } = get()
    if (currentEpisode) {
      fetch('/api/listen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: currentEpisode.id,
          podcastId: currentPodcast?.id,
          duration: currentEpisode.duration,
          position: 0,
          completed: true
        })
      }).catch(console.error)
    }
  },

  formatTime: (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
}))
