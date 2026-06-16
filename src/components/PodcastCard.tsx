import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import type { Podcast } from '@/stores/podcastStore'

interface PodcastCardProps {
  podcast: Podcast
  size?: 'sm' | 'md' | 'lg'
}

export default function PodcastCard({ podcast, size = 'md' }: PodcastCardProps) {
  const sizeClasses = {
    sm: 'aspect-square text-sm',
    md: 'aspect-square',
    lg: 'aspect-[4/3]'
  }

  return (
    <Link
      to={`/podcast/${podcast.id}`}
      className="card group overflow-hidden block"
    >
      <div className={`relative ${sizeClasses[size]} overflow-hidden`}>
        <img
          src={podcast.coverUrl}
          alt={podcast.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deepnavy via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 left-3 right-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-xs text-warmgray-300 line-clamp-2">
            {podcast.description}
          </p>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-serif font-semibold text-warmgray-100 mb-1 truncate group-hover:text-amber-400 transition-colors">
          {podcast.name}
        </h3>
        <p className="text-sm text-warmgray-500 mb-3 truncate">
          {podcast.author}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {podcast.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-warmgray-500">
            <Users className="w-3.5 h-3.5" />
            <span>{podcast.subscribeCount}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
