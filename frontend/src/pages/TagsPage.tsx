import { useQuery } from '@tanstack/react-query'
import { tagService } from '../services/tagService'

export default function TagsPage() {
  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags(),
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tags</h1>
      <div className="card">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {tags?.map((tag) => (
            <span
              key={tag.id}
              className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
              style={{
                backgroundColor: tag.color || '#e5e7eb',
                color: tag.color ? '#fff' : '#374151',
              }}
            >
              {tag.name}
            </span>
          ))}
          {tags?.length === 0 && <p className="text-sm sm:text-base text-gray-500">No tags yet</p>}
        </div>
      </div>
    </div>
  )
}

