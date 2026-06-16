import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  onRate?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
}

export default function StarRating({
  rating,
  onRate,
  size = 'md',
  readOnly = false
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  }

  const handleClick = (value: number) => {
    if (readOnly || !onRate) return
    onRate(rating === value ? 0 : value)
  }

  return (
    <div className={cn('flex gap-0.5', !readOnly && 'cursor-pointer')}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value)}
          disabled={readOnly}
          className={cn(
            'transition-colors',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              value <= rating
                ? 'fill-amber-500 text-amber-500'
                : 'text-warmgray-600'
            )}
          />
        </button>
      ))}
    </div>
  )
}
