import { useEffect, useState } from 'react'
import { Library, Download, Radio, Check, Sparkles } from 'lucide-react'
import { usePodcastStore } from '@/stores/podcastStore'
import PodcastCard from '@/components/PodcastCard'
import { useNavigate } from 'react-router-dom'
import { useDownloadStore } from '@/stores/downloadStore'
import { useNotificationStore } from '@/stores/notificationStore'

export default function Subscriptions() {
  const { subscriptions, fetchSubscriptions, toggleAutoDownload } = usePodcastStore()
  const { fetchDownloads, getDownloadedEpisodesForPodcast } = useDownloadStore()
  const { fetchNotifications } = useNotificationStore()
  const [successTip, setSuccessTip] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSubscriptions()
    fetchDownloads()
  }, [fetchSubscriptions, fetchDownloads])

  const handleToggleAutoDownload = async (podcastId: string, name: string, value: boolean) => {
    const ok = await toggleAutoDownload(podcastId, value)
    if (ok && value) {
      setSuccessTip(`已为「${name}」开启自动下载，最新一集已下载`)
      fetchDownloads()
      fetchNotifications()
      setTimeout(() => setSuccessTip(null), 3000)
    }
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center">
            <Library className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-warmgray-100">
              我的订阅
            </h1>
            <p className="text-sm text-warmgray-500">
              已订阅 {subscriptions.length} 个播客
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {successTip && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/15 text-green-400 text-sm animate-slide-up">
              <Sparkles className="w-4 h-4" />
              {successTip}
            </div>
          )}
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            发现更多
          </button>
        </div>
      </section>

      {subscriptions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-deepnavy flex items-center justify-center mx-auto mb-6">
            <Radio className="w-10 h-10 text-warmgray-600" />
          </div>
          <h3 className="text-xl font-semibold text-warmgray-300 mb-2">
            还没有订阅
          </h3>
          <p className="text-warmgray-500 mb-6">
            去发现页找找你感兴趣的播客吧
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            发现播客
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {subscriptions.map((podcast) => {
            const downloadedIds = getDownloadedEpisodesForPodcast(podcast.id)
            const autoDownload = (podcast as any).autoDownload

            return (
              <div key={podcast.id} className="relative group">
                <PodcastCard podcast={podcast} />

                {downloadedIds.length > 0 && (
                  <div className="mt-2 px-1 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-400">
                      <Check className="w-3 h-3" />
                      已下载 {downloadedIds.length} 集
                    </span>
                  </div>
                )}

                <div className="mt-2 px-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-warmgray-500" />
                    <span className="text-sm text-warmgray-500">自动下载</span>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleAutoDownload(
                        podcast.id,
                        podcast.name,
                        !autoDownload
                      )
                    }
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      autoDownload ? 'bg-amber-500' : 'bg-warmgray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        autoDownload ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
