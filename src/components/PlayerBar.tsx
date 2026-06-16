import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Gauge,
  Timer,
  Sparkles,
  FileText,
  Maximize2,
  X
} from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'

export default function PlayerBar() {
  const navigate = useNavigate()
  const [showTimerMenu, setShowTimerMenu] = useState(false)
  const {
    currentEpisode,
    currentPodcast,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    timerEnabled,
    timerRemaining,
    skipSilence,
    togglePlay,
    seek,
    setRate,
    setTimer,
    toggleSkipSilence,
    formatTime
  } = usePlayerStore()

  const timerOptions = [15, 30, 45, 60]
  const remainingMinutes = timerEnabled ? Math.ceil(timerRemaining / 60) : 0

  if (!currentEpisode) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2]

  const goToPlayer = () => {
    if (currentEpisode && currentPodcast) {
      navigate(`/player/${currentPodcast.id}/${currentEpisode.id}`)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-deepnavy/95 backdrop-blur-md border-t border-warmgray-700/30 z-50 px-6 py-3 ml-60">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 min-w-0 w-64">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex-shrink-0 overflow-hidden">
            {currentPodcast?.coverUrl && (
              <img
                src={currentPodcast.coverUrl}
                alt={currentPodcast.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-warmgray-100 truncate">
              {currentEpisode.title}
            </p>
            <p className="text-xs text-warmgray-500 truncate">
              {currentPodcast?.name}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button
              className="p-2 text-warmgray-400 hover:text-warmgray-100 transition-colors"
              title="后退 15 秒"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-amber-500 text-midnight flex items-center justify-center hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/30"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button
              className="p-2 text-warmgray-400 hover:text-warmgray-100 transition-colors"
              title="前进 30 秒"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full max-w-md flex items-center gap-3">
            <span className="text-xs text-warmgray-500 w-12 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1.5 bg-warmgray-700/50 rounded-full relative cursor-pointer group">
              <div
                className="h-full bg-amber-500 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-xs text-warmgray-500 w-12 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              className="p-2 rounded-lg text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/30 transition-colors flex items-center gap-1"
              title="播放速度"
            >
              <Gauge className="w-4 h-4" />
              <span className="text-xs font-medium">{playbackRate}x</span>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-deepnavy border border-warmgray-700/50 rounded-xl p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-10">
              <div className="flex gap-1">
                {speedOptions.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setRate(speed)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      playbackRate === speed
                        ? 'bg-amber-500 text-midnight'
                        : 'text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/30'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowTimerMenu(!showTimerMenu)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                timerEnabled
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/30'
              }`}
              title={timerEnabled ? `剩余 ${remainingMinutes} 分钟` : '定时关闭'}
            >
              <Timer className="w-4 h-4" />
              {timerEnabled && (
                <span className="text-xs font-medium">{remainingMinutes}分</span>
              )}
            </button>
            {showTimerMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-deepnavy border border-warmgray-700/50 rounded-xl p-2 shadow-xl z-20 min-w-[120px]">
                <div className="flex flex-col gap-1">
                  {timerOptions.map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setTimer(mins)
                        setShowTimerMenu(false)
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                        timerEnabled && Math.ceil(timerRemaining / 60) === mins
                          ? 'bg-amber-500 text-midnight'
                          : 'text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/30'
                      }`}
                    >
                      {mins} 分钟
                    </button>
                  ))}
                  {timerEnabled && (
                    <button
                      onClick={() => {
                        setTimer(null)
                        setShowTimerMenu(false)
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left text-warmgray-400 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-1.5"
                    >
                      <X className="w-3 h-3" />
                      取消定时
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleSkipSilence}
            className={`p-2 rounded-lg transition-colors ${
              skipSilence
                ? 'text-amber-400 bg-amber-500/15 ring-1 ring-amber-400/30'
                : 'text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/30'
            }`}
            title={skipSilence ? '已开启跳过静音' : '跳过静音'}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            className="p-2 rounded-lg text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/30 transition-colors"
            title="笔记"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={goToPlayer}
            className="p-2 rounded-lg text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/30 transition-colors"
            title="展开播放器"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {isPlaying && (
          <div className="flex items-end gap-0.5 h-5 w-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-amber-500 rounded-full animate-wave"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  height: '40%'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
