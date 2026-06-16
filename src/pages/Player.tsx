import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowLeft,
  Timer,
  Sparkles,
  FileText,
  Volume2,
  Download
} from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { usePodcastStore, type Episode } from '@/stores/podcastStore'
import StarRating from '@/components/StarRating'

export default function Player() {
  const { podcastId, episodeId } = useParams<{ podcastId: string; episodeId: string }>()
  const navigate = useNavigate()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [podcast, setPodcast] = useState<any>(null)
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [showTimer, setShowTimer] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [loading, setLoading] = useState(true)

  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    timerEnabled,
    timerRemaining,
    skipSilence,
    note,
    rating,
    notes,
    setAudio,
    play,
    togglePlay,
    seek,
    setRate,
    setTimer,
    toggleSkipSilence,
    setNote,
    setRating,
    saveNote,
    fetchNotes,
    onTimeUpdate,
    onLoadedMetadata,
    onEnded,
    formatTime
  } = usePlayerStore()

  const { fetchSubscriptions, isSubscribed, subscribe, unsubscribe } = usePodcastStore()

  useEffect(() => {
    if (audioRef.current) {
      setAudio(audioRef.current)
    }
    fetchSubscriptions()
  }, [setAudio, fetchSubscriptions])

  useEffect(() => {
    if (podcastId && episodeId) {
      loadData()
    }
  }, [podcastId, episodeId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [podcastRes, episodesRes] = await Promise.all([
        fetch(`/api/podcasts/${podcastId}`),
        fetch(`/api/podcasts/${podcastId}/episodes`)
      ])
      const podcastData = await podcastRes.json()
      const episodesData = await episodesRes.json()
      if (podcastData.success) setPodcast(podcastData.data)
      if (episodesData.success) {
        setEpisodes(episodesData.data)
        const ep = episodesData.data.find((e: Episode) => e.id === episodeId)
        if (ep) {
          setEpisode(ep)
          if (podcastData.success) {
            play(ep, podcastData.data)
          }
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevEpisode = () => {
    if (!episode || episodes.length === 0 || !podcast) return
    const idx = episodes.findIndex(e => e.id === episode.id)
    if (idx < episodes.length - 1) {
      const prevEp = episodes[idx + 1]
      navigate(`/player/${podcast.id}/${prevEp.id}`)
    }
  }

  const handleNextEpisode = () => {
    if (!episode || episodes.length === 0 || !podcast) return
    const idx = episodes.findIndex(e => e.id === episode.id)
    if (idx > 0) {
      const nextEp = episodes[idx - 1]
      navigate(`/player/${podcast.id}/${nextEp.id}`)
    }
  }

  const timerOptions = [0, 15, 30, 45, 60]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const subscribed = podcastId ? isSubscribed(podcastId) : false

  const handleSubscribe = async () => {
    if (!podcastId) return
    if (subscribed) {
      await unsubscribe(podcastId)
    } else {
      await subscribe(podcastId)
    }
  }

  return (
    <div className="min-h-[calc(100vh-100px)] pb-24">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-warmgray-400 hover:text-warmgray-100 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回</span>
      </button>

      <div className="flex gap-10">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-80 h-80 rounded-3xl overflow-hidden shadow-2xl mb-8 border border-warmgray-700/30">
            {podcast?.coverUrl && (
              <img
                src={podcast.coverUrl}
                alt={podcast.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="text-center mb-8 w-full max-w-lg">
            <h1 className="font-serif text-2xl font-bold text-warmgray-100 mb-2">
              {episode?.title}
            </h1>
            <p className="text-warmgray-400">{podcast?.name}</p>
          </div>

          <div className="w-full max-w-lg mb-6">
            <div className="h-1.5 bg-warmgray-700/50 rounded-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const pct = (e.clientX - rect.left) / rect.width
                seek(pct * duration)
              }}
            >
              <div
                className="h-full bg-amber-500 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full shadow-md" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-warmgray-500 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={handlePrevEpisode}
              className="p-3 text-warmgray-400 hover:text-warmgray-100 transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-amber-500 text-midnight flex items-center justify-center hover:bg-amber-400 transition-colors shadow-xl shadow-amber-500/30"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 ml-1" />
              )}
            </button>
            <button
              onClick={handleNextEpisode}
              className="p-3 text-warmgray-400 hover:text-warmgray-100 transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowTimer(!showTimer)}
                className={`p-3 rounded-xl transition-colors ${
                  timerEnabled
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-deepnavy text-warmgray-400 hover:text-warmgray-100 border border-warmgray-700/30'
                }`}
                title="定时关闭"
              >
                <Timer className="w-5 h-5" />
              </button>
              {timerEnabled && (
                <span className="absolute -top-1 -right-1 text-xs bg-amber-500 text-midnight font-medium px-1.5 py-0.5 rounded-full">
                  {Math.ceil(timerRemaining / 60)}
                </span>
              )}
              {showTimer && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-deepnavy border border-warmgray-700/50 rounded-xl p-2 shadow-xl z-10">
                  <div className="flex gap-1">
                    {timerOptions.map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          setTimer(mins === 0 ? null : mins)
                          setShowTimer(false)
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          (mins === 0 && !timerEnabled) ||
                          (mins > 0 && timerRemaining === mins * 60)
                            ? 'bg-amber-500 text-midnight'
                            : 'text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/30'
                        }`}
                      >
                        {mins === 0 ? '关闭' : `${mins}分`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleSkipSilence}
              className={`p-3 rounded-xl transition-colors ${
                skipSilence
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'bg-deepnavy text-warmgray-400 hover:text-warmgray-100 border border-warmgray-700/30'
              }`}
              title="跳过静音"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-3 rounded-xl transition-colors ${
                showNotes
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'bg-deepnavy text-warmgray-400 hover:text-warmgray-100 border border-warmgray-700/30'
              }`}
              title="笔记"
            >
              <FileText className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-2 bg-deepnavy border border-warmgray-700/30 rounded-xl">
              <Volume2 className="w-4 h-4 text-warmgray-400" />
              <select
                value={playbackRate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="bg-transparent text-sm text-warmgray-400 outline-none cursor-pointer"
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <option key={rate} value={rate} className="bg-deepnavy">
                    {rate}x
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="w-80 flex-shrink-0">
          {showNotes ? (
            <div className="card p-5">
              <h3 className="font-serif text-lg font-semibold text-warmgray-100 mb-4">
                笔记与评分
              </h3>

              <div className="mb-4">
                <label className="text-sm text-warmgray-400 mb-2 block">评分</label>
                <StarRating rating={rating} onRate={setRating} size="lg" />
              </div>

              <div className="mb-4">
                <label className="text-sm text-warmgray-400 mb-2 block">笔记</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="记录你的想法..."
                  rows={6}
                  className="input-field resize-none"
                />
              </div>

              <button
                onClick={saveNote}
                className="btn-primary w-full"
                disabled={!note && rating === 0}
              >
                保存笔记
              </button>

              {notes.length > 0 && (
                <div className="mt-6 pt-6 border-t border-warmgray-700/30">
                  <h4 className="text-sm font-medium text-warmgray-400 mb-3">
                    历史笔记 ({notes.length})
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 bg-warmgray-700/20 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <StarRating rating={n.rating} size="sm" readOnly />
                          <span className="text-xs text-warmgray-500">
                            {new Date(n.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-sm text-warmgray-300">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="card p-5">
                <h3 className="font-serif text-lg font-semibold text-warmgray-100 mb-4">
                  节目信息
                </h3>
                <p className="text-sm text-warmgray-400 mb-4">
                  {podcast?.description}
                </p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {podcast?.tags?.map((tag: string) => (
                    <span key={tag} className="badge">{tag}</span>
                  ))}
                </div>
                <button
                  onClick={handleSubscribe}
                  className={subscribed ? 'btn-secondary w-full' : 'btn-primary w-full'}
                >
                  {subscribed ? '已订阅' : '订阅此播客'}
                </button>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg font-semibold text-warmgray-100">
                    剧集列表
                  </h3>
                  <span className="text-xs text-warmgray-500">
                    共 {episodes.length} 集
                  </span>
                </div>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {episodes.map((ep, idx) => (
                    <button
                      key={ep.id}
                      onClick={() => navigate(`/player/${podcastId}/${ep.id}`)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${
                        ep.id === episodeId
                          ? 'bg-amber-500/10 border border-amber-500/20'
                          : 'hover:bg-warmgray-700/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-warmgray-600 mt-0.5 w-5">
                          {episodes.length - idx}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              ep.id === episodeId ? 'text-amber-400' : 'text-warmgray-200'
                            }`}
                          >
                            {ep.title}
                          </p>
                          <p className="text-xs text-warmgray-500">
                            {formatTime(ep.duration)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => onLoadedMetadata(e.currentTarget.duration)}
        onEnded={onEnded}
      />
    </div>
  )
}
