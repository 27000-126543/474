import { cn } from '@/lib/utils'

interface TagFilterProps {
  tags: string[]
  selectedTag: string
  onSelect: (tag: string) => void
  showAllOption?: boolean
  allLabel?: string
}

export default function TagFilter({
  tags,
  selectedTag,
  onSelect,
  showAllOption = true,
  allLabel = '全部'
}: TagFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {showAllOption && (
        <button
          onClick={() => onSelect('')}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
            selectedTag === ''
              ? 'bg-amber-500 text-midnight shadow-md shadow-amber-500/30'
              : 'bg-warmgray-700/40 text-warmgray-400 hover:bg-warmgray-700/60 hover:text-warmgray-200'
          )}
        >
          {allLabel}
        </button>
      )}
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
            selectedTag === tag
              ? 'bg-amber-500 text-midnight shadow-md shadow-amber-500/30'
              : 'bg-warmgray-700/40 text-warmgray-400 hover:bg-warmgray-700/60 hover:text-warmgray-200'
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
