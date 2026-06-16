import { useEffect, useState } from 'react'
import { Search, Sparkles, TrendingUp } from 'lucide-react'
import { usePodcastStore } from '@/stores/podcastStore'
import PodcastCard from '@/components/PodcastCard'
import TagFilter from '@/components/TagFilter'
import { useNotificationStore } from '@/stores/notificationStore'

const allTags = ['科技', '商业', '文化', '社会', '心理', '音乐', '历史', '教育']

export default function Discover() {
  const {
    podcasts,
    recommendations,
    loading,
    searchQuery,
    selectedTag,
    fetchPodcasts,
    fetchRecommendations,
    fetchSubscriptions
  } = usePodcastStore()
  const { fetchNotifications } = useNotificationStore()

  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const init = async () => {
      await fetchPodcasts()
      await fetchRecommendations()
      await fetchSubscriptions()
      fetchNotifications()
    }
    init()
  }, [fetchPodcasts, fetchRecommendations, fetchSubscriptions, fetchNotifications])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPodcasts(searchInput, selectedTag)
  }

  const handleTagSelect = (tag: string) => {
    fetchPodcasts(searchInput, tag)
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-deepnavy via-midnight to-deepnavy border border-warmgray-700/30 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10">
          <p className="text-amber-400 text-sm font-medium mb-2">欢迎回来</p>
          <h1 className="font-serif text-4xl font-bold text-warmgray-100 mb-4">
            今天想听点什么？
          </h1>
          <p className="text-warmgray-400 mb-8 max-w-lg">
            探索精选播客，订阅你喜爱的节目，享受沉浸式的聆听体验
          </p>

          <form onSubmit={handleSearch} className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warmgray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索播客、主播或话题..."
              className="input-field pl-12 pr-32 py-4 text-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2.5 px-5"
            >
              搜索
            </button>
          </form>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="section-title">每周为你推荐</h2>
        </div>
        {loading && recommendations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommendations.slice(0, 4).map((podcast) => (
              <div key={podcast.id} className="relative">
                <div className="absolute -top-2 -right-2 z-10 badge">
                  智能推荐
                </div>
                <PodcastCard podcast={podcast} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <h2 className="section-title">热门播客</h2>
        </div>

        <div className="mb-6">
          <TagFilter
            tags={allTags}
            selectedTag={selectedTag}
            onSelect={handleTagSelect}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card animate-pulse"
              >
                <div className="aspect-square bg-warmgray-700/30 rounded-t-2xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-warmgray-700/30 rounded w-3/4" />
                  <div className="h-3 bg-warmgray-700/30 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-warmgray-700/30 rounded-full w-12" />
                    <div className="h-5 bg-warmgray-700/30 rounded-full w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        )}

        {!loading && podcasts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-warmgray-500">没有找到匹配的播客</p>
          </div>
        )}
      </section>
    </div>
  )
}
