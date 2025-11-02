import { useState, useEffect } from 'react'
import { EntryFilter, SavedFilter, searchService } from '../../services/searchService'
import { tagService } from '../../services/tagService'
import { Tag } from '../../services/entryService'
import { X, Filter, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface FilterPanelProps {
  filters: EntryFilter
  onFiltersChange: (filters: EntryFilter) => void
  onClearFilters: () => void
}

export function FilterPanel({ filters, onFiltersChange, onClearFilters }: FilterPanelProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [isLoadingTags, setIsLoadingTags] = useState(false)

  useEffect(() => {
    loadTags()
    loadSavedFilters()
  }, [])

  const loadTags = async () => {
    try {
      setIsLoadingTags(true)
      const data = await tagService.getTags()
      setTags(data)
    } catch (error) {
      console.error('Error loading tags:', error)
    } finally {
      setIsLoadingTags(false)
    }
  }

  const loadSavedFilters = async () => {
    try {
      const data = await searchService.getSavedFilters()
      setSavedFilters(data)
    } catch (error) {
      console.error('Error loading saved filters:', error)
    }
  }

  const updateFilter = (key: keyof EntryFilter, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleTagToggle = (tagId: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((id) => id !== tagId)
      : [...currentTags, tagId]
    updateFilter('tags', newTags.length > 0 ? newTags : undefined)
  }

  const handleSaveFilter = async () => {
    if (!saveFilterName.trim()) {
      toast.error('Please enter a filter name')
      return
    }

    try {
      await searchService.createSavedFilter({
        name: saveFilterName.trim(),
        filters,
      })
      toast.success('Filter saved successfully')
      setShowSaveDialog(false)
      setSaveFilterName('')
      loadSavedFilters()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save filter')
    }
  }

  const handleLoadSavedFilter = (savedFilter: SavedFilter) => {
    onFiltersChange(savedFilter.filters)
    toast.success(`Loaded filter: ${savedFilter.name}`)
  }

  const handleDeleteSavedFilter = async (id: string) => {
    if (!confirm('Delete this saved filter?')) return

    try {
      await searchService.deleteSavedFilter(id)
      toast.success('Filter deleted')
      loadSavedFilters()
    } catch (error) {
      toast.error('Failed to delete filter')
    }
  }

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)
  )

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Content Type Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
        <div className="flex flex-wrap gap-2">
          {(['link', 'repo', 'note'] as const).map((type) => (
            <button
              key={type}
              onClick={() => updateFilter('content_type', filters.content_type === type ? undefined : type)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filters.content_type === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        {isLoadingTags ? (
          <div className="text-sm text-gray-500">Loading tags...</div>
        ) : tags.length === 0 ? (
          <div className="text-sm text-gray-500">No tags available</div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagToggle(tag.id)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  filters.tags?.includes(tag.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={tag.color ? { borderColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => updateFilter('date_from', e.target.value || undefined)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => updateFilter('date_to', e.target.value || undefined)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateFilter('has_summary', filters.has_summary === true ? undefined : true)}
            className={`px-3 py-1 rounded-md text-sm ${
              filters.has_summary === true
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Has Summary
          </button>
          <button
            onClick={() => updateFilter('has_url', filters.has_url === true ? undefined : true)}
            className={`px-3 py-1 rounded-md text-sm ${
              filters.has_url === true
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Has URL
          </button>
        </div>
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Saved Filters</label>
          <div className="space-y-1">
            {savedFilters.map((savedFilter) => (
              <div
                key={savedFilter.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                <button
                  onClick={() => handleLoadSavedFilter(savedFilter)}
                  className="flex-1 text-left text-sm text-gray-700"
                >
                  {savedFilter.name}
                </button>
                <button
                  onClick={() => handleDeleteSavedFilter(savedFilter.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Current Filter */}
      {hasActiveFilters && (
        <div>
          {!showSaveDialog ? (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Filter
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="Filter name"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveFilter()
                  } else if (e.key === 'Escape') {
                    setShowSaveDialog(false)
                    setSaveFilterName('')
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveFilter}
                  className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false)
                    setSaveFilterName('')
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

