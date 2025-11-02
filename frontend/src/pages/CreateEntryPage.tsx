import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { entryService, EntryCreate } from '../services/entryService'
import toast from 'react-hot-toast'

export default function CreateEntryPage() {
  const [contentType, setContentType] = useState<'link' | 'repo' | 'note'>('link')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (data: EntryCreate) => entryService.createEntry(data),
    onSuccess: () => {
      toast.success('Entry created successfully!')
      navigate('/entries')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create entry')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: EntryCreate = {
      title: title || (contentType === 'note' ? 'Untitled Note' : 'Untitled'),
      content_type: contentType,
      url: contentType !== 'note' ? url : undefined,
      content: contentType === 'note' ? content : undefined,
    }
    mutation.mutate(data)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Create New Entry</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as any)}
            className="input"
          >
            <option value="link">Link</option>
            <option value="repo">GitHub Repository</option>
            <option value="note">Note</option>
          </select>
        </div>

        {contentType !== 'note' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={contentType === 'repo' ? 'https://github.com/owner/repo' : 'https://example.com'}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional, will be auto-filled)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="input"
                placeholder="Write your note here (Markdown supported)"
              />
            </div>
          </>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 sm:space-x-4">
          <button
            type="button"
            onClick={() => navigate('/entries')}
            className="btn btn-secondary w-full sm:w-auto"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Entry'}
          </button>
        </div>
      </form>
    </div>
  )
}

