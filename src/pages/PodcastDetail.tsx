import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Calendar, Play, Check } from 'lucide-react'
import { usePodcastStore, type Episode } from '@/stores/podcastStore'
import { usePlayerStore } from '@/stores/playerStore'
import EpisodeItem from '@/components/EpisodeItem'

export default function PodcastDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchSubscriptions, isSubscribed, subscribe, unsubscribe } = usePodcastStore()
  const { play } = usePlayerStore()

  const [podcast, setPodcast] = useState<any>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (id) {
      loadPodcast()
      fetchSubscriptions()
    }
  }, [id, fetchSubscriptions])

  useEffect(() => {
    if (id) {
      setSubscribed(isSubscribed(id))
    }
  }, [id, isSubscribed])

  const loadPodcast = async () => {
    setLoading(true)
    try {
      const [podcastRes, episodesRes] = await Promise.all([
        fetch(`/api/podcasts/${id}`),
        fetch(`/api/podcasts/${id}/episodes`)
      ])
      const podcastData = await podcastRes.json()
      const episodesData = await episodesRes.json()
      if (podcastData.success) setPodcast(podcastData.data)
      if (episodesData.success) setEpisodes(episodesData.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!id) return
    if (subscribed) {
      const ok = await unsubscribe(id)
      if (ok) setSubscribed(false)
    } else {
      const ok = await subscribe(id)
      if (ok) setSubscribed(true)
    }
  }

  const handlePlayLatest = () => {
    if (episodes.length > 0 && podcast) {
      play(episodes[0], podcast)
      navigate(`/player/${podcast.id}/${episodes[0].id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!podcast) {
    return <div className="text-warmgray-500 text-center py-20">播客不存在</div>
  }

  return (
    <div className="pb-24">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-warmgray-400 hover:text-warmgray-100 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回</span>
      </button>

      <section className="relative rounded-3xl overflow-hidden border border-warmgray-700/30 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-deepnavy via-deepnavy/90 to-transparent z-10" />
        {podcast.coverUrl && (
          <img
            src={podcast.coverUrl}
            alt={podcast.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="relative z-20 p-8 flex gap-8">
          <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-warmgray-600/30">
            {podcast.coverUrl && (
              <img
                src={podcast.coverUrl}
                alt={podcast.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 mb-3">
              {podcast.tags?.map((tag: string) => (
                <span key={tag} className="badge">{tag}</span>
              ))}
            </div>
            <h1 className="font-serif text-4xl font-bold text-warmgray-100 mb-2">
              {podcast.name}
            </h1>
            <p className="text-warmgray-400 mb-4">主播：{podcast.author}</p>
            <p className="text-warmgray-500 mb-6 line-clamp-3">
              {podcast.description}
            </p>
            <div className="flex items-center gap-6 text-sm text-warmgray-500 mb-6">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{podcast.subscribeCount} 人订阅</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{episodes.length} 集</span>
              </div>
            </div>
            <div className="flex gap-3">
              {subscribed ? (
                <button
                  onClick={handleSubscribe}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  已订阅
                </button>
              ) : (
                <button onClick={handleSubscribe} className="btn-primary">
                  订阅
                </button>
              )}
              {episodes.length > 0 && (
                <button
                  onClick={handlePlayLatest}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  播放最新
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title mb-6">所有剧集</h2>
        <div className="space-y-2">
          {episodes.map((episode) => (
            <EpisodeItem
              key={episode.id}
              episode={episode}
              podcast={podcast}
            />
          ))}
        </div>
        {episodes.length === 0 && (
          <div className="text-center py-12 text-warmgray-500">
            暂无剧集
          </div>
        )}
      </section>
    </div>
  )
}
