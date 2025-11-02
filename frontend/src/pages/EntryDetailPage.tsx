import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { entryService } from '../services/entryService'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: entry, isLoading } = useQuery({
    queryKey: ['entry', id],
    queryFn: () => entryService.getEntry(id!),
  })

  const summarizeMutation = useMutation({
    mutationFn: () => entryService.summarizeEntry(id!),
    onSuccess: () => {
      toast.success('Summary generation started!')
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!entry) {
    return <div>Entry not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 break-words">{entry.title}</h1>
      
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs sm:text-sm">
              {entry.content_type}
            </span>
            <span className="text-xs sm:text-sm text-gray-500">
              {new Date(entry.created_at).toLocaleDateString()}
            </span>
          </div>
          <button
            onClick={() => summarizeMutation.mutate()}
            className="btn btn-primary w-full sm:w-auto"
            disabled={entry.summary_status === 'processing'}
          >
            {entry.summary_status === 'processing' ? 'Generating...' : 'Generate Summary'}
          </button>
        </div>

        {entry.url && (
          <div className="break-all">
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm sm:text-base"
            >
              {entry.url}
            </a>
          </div>
        )}

        {entry.content && (
          <div className="prose max-w-none">
            <ReactMarkdown>{entry.content}</ReactMarkdown>
          </div>
        )}

        {entry.ai_summary && (
          <div className="border-t pt-4">
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">AI Summary</h2>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg prose prose-sm sm:prose-base max-w-none">
              <ReactMarkdown>{entry.ai_summary}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

