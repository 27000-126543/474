import { Play, CheckCircle2, Download, Clock, Check, Trash2 } from 'lucide-react'
import type { Episode } from '@/stores/podcastStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useDownloadStore } from '@/stores/downloadStore'

interface EpisodeItemProps {
  episode: Episode
  podcast: any
  isCompleted?: boolean
  showPlayButton?: boolean
}

export default function EpisodeItem({
  episode,
  podcast,
  isCompleted = false,
  showPlayButton = true
}: EpisodeItemProps) {
  const { play, currentEpisode, isPlaying, formatTime } = usePlayerStore()
  const { isDownloaded, downloadEpisode, removeDownload } = useDownloadStore()
  const isCurrent = currentEpisode?.id === episode.id
  const downloaded = isDownloaded(episode.id)

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    play(episode, podcast)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (downloaded) {
      await removeDownload(episode.id)
    } else {
      await downloadEpisode(episode.id)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer group ${
        isCurrent
          ? 'bg-amber-500/10 border border-amber-500/20'
          : 'hover:bg-warmgray-700/20 border border-transparent'
      }`}
    >
      {showPlayButton && (
        <button
          onClick={handlePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            isCurrent && isPlaying
              ? 'bg-amber-500 text-midnight'
              : 'bg-warmgray-700/50 text-warmgray-300 group-hover:bg-amber-500 group-hover:text-midnight'
          }`}
        >
          <Play className="w-4 h-4 ml-0.5" />
        </button>
      )}

      {isCompleted && (
        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4
            className={`font-medium truncate ${
              isCurrent ? 'text-amber-400' : 'text-warmgray-100'
            }`}
          >
            {episode.title}
          </h4>
          {downloaded && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium flex-shrink-0">
              <Check className="w-3 h-3" />
              已下载
            </span>
          )}
        </div>
        <p className="text-sm text-warmgray-500 truncate">{episode.description}</p>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-sm text-warmgray-500">
          <Clock className="w-4 h-4" />
          <span>{formatTime(episode.duration)}</span>
        </div>
        <div className="text-sm text-warmgray-600 hidden md:block">
          {formatDate(episode.publishDate)}
        </div>
        <button
          onClick={handleDownload}
          className={`p-2 transition-colors ${
            downloaded
              ? 'text-green-400 hover:text-red-400 bg-green-500/10 rounded-full'
              : 'text-warmgray-500 hover:text-amber-400 opacity-0 group-hover:opacity-100 bg-warmgray-700/30 rounded-full hover:bg-amber-500/15'
          }`}
          title={downloaded ? '删除下载' : '下载'}
        >
          {downloaded ? <Trash2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
