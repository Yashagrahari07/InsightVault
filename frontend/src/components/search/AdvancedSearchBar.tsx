import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { searchService } from '../../services/searchService'
import { Search, X, Clock } from 'lucide-react'

interface AdvancedSearchBarProps {
  onSearch: (query: string) => void
  onSelectSuggestion?: (query: string) => void
  initialQuery?: string
  placeholder?: string
}

export function AdvancedSearchBar({
  onSearch,
  onSelectSuggestion,
  initialQuery = '',
  placeholder = 'Search entries...',
}: AdvancedSearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions when query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    let cancelled = false
    
    // Use async function to avoid setState in effect
    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const data = await searchService.getSuggestions(debouncedQuery, 10)
        if (!cancelled) {
          setSuggestions(data.suggestions)
          setShowSuggestions(true)
        }
      } catch {
        if (!cancelled) {
          setSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchSuggestions()
    
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const selectedQuery = suggestions[selectedIndex]
        setQuery(selectedQuery)
        setShowSuggestions(false)
        onSelectSuggestion?.(selectedQuery)
        onSearch(selectedQuery)
      } else if (query.trim()) {
        setShowSuggestions(false)
        onSearch(query.trim())
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    onSelectSuggestion?.(suggestion)
    onSearch(suggestion)
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={() => {
            // Delay to allow click events on suggestions
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-sm text-gray-500">Loading suggestions...</div>
        </div>
      )}
    </div>
  )
}

