import { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  TagIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { api, type Job, type PaginatedJobsResponse, type JobSource, type JobCategory, type JobsQueryParams } from '../utils/api'

interface JobsState {
  jobs: Job[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    search?: string | null
    source?: string | null
    category?: string | null
    dateFrom?: string | null
    dateTo?: string | null
  }
  sources: JobSource[]
  categories: JobCategory[]
  loading: boolean
  error: string | null
}

const Jobs = () => {
  const [state, setState] = useState<JobsState>({
    jobs: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    },
    filters: {},
    sources: [],
    categories: [],
    loading: true,
    error: null
  })

  const [queryParams, setQueryParams] = useState<JobsQueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'publishedAt',
    sortOrder: 'desc'
  })

  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  // Load initial data
  useEffect(() => {
    loadJobs()
    loadSources()
    loadCategories()
  }, [queryParams])

  const loadJobs = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const response: PaginatedJobsResponse = await api.getJobs(queryParams)
      setState(prev => ({
        ...prev,
        jobs: response.jobs,
        pagination: response.pagination,
        filters: response.filters,
        loading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load jobs',
        loading: false
      }))
    }
  }

  const loadSources = async () => {
    try {
      const response = await api.getJobSources()
      setState(prev => ({ ...prev, sources: response.sources }))
    } catch (error) {
      console.error('Failed to load sources:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await api.getJobCategories()
      setState(prev => ({ ...prev, categories: response.categories }))
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQueryParams(prev => ({
      ...prev,
      search: searchInput || undefined,
      page: 1
    }))
  }

  const handleFilterChange = (key: keyof JobsQueryParams, value: string | undefined) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1
    }))
  }

  const handleSort = (field: 'publishedAt' | 'processedAt' | 'title') => {
    setQueryParams(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1
    }))
  }

  const handlePageChange = (newPage: number) => {
    setQueryParams(prev => ({ ...prev, page: newPage }))
  }

  const clearFilters = () => {
    setSearchInput('')
    setQueryParams({
      page: 1,
      limit: 10,
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSortIcon = (field: string) => {
    if (queryParams.sortBy !== field) return null
    return queryParams.sortOrder === 'desc' ? 
      <ArrowDownIcon className="h-4 w-4" /> : 
      <ArrowUpIcon className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Job Listings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {state.pagination.total} jobs found
          </p>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors"
          style={{
            backgroundColor: showFilters ? 'var(--accent-primary)' : 'var(--surface)',
            color: showFilters ? 'white' : 'var(--text-primary)',
            borderColor: 'var(--neutral-200)'
          }}
        >
          <FunnelIcon className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className={`space-y-4 transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--neutral-200)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white'
            }}
          >
            Search
          </button>
        </form>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Source
            </label>
            <select
              value={queryParams.source || ''}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--neutral-200)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">All Sources</option>
              {state.sources.map((source) => (
                <option key={source.name} value={source.name}>
                  {source.name} ({source.count})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Category
            </label>
            <select
              value={queryParams.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--neutral-200)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">All Categories</option>
              {state.categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              From Date
            </label>
            <input
              type="datetime-local"
              value={queryParams.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--neutral-200)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              To Date
            </label>
            <input
              type="datetime-local"
              value={queryParams.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--neutral-200)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="text-sm px-3 py-1 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4 text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>Sort by:</span>
        {[
          { key: 'publishedAt' as const, label: 'Published Date' },
          { key: 'processedAt' as const, label: 'Processed Date' },
          { key: 'title' as const, label: 'Title' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              queryParams.sortBy === key ? 'font-semibold' : ''
            }`}
            style={{
              color: queryParams.sortBy === key ? 'var(--accent-primary)' : 'var(--text-secondary)'
            }}
          >
            {label}
            {getSortIcon(key)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {state.loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="p-4 rounded-lg border" style={{
          backgroundColor: 'var(--status-error-bg)',
          borderColor: 'var(--status-error)',
          color: 'var(--status-error)'
        }}>
          <p>Error: {state.error}</p>
        </div>
      )}

      {/* Job List */}
      {!state.loading && !state.error && (
        <div className="space-y-4">
          {state.jobs.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
              <p>No jobs found matching your criteria.</p>
            </div>
          ) : (
            state.jobs.map((job) => (
              <div
                key={job.id}
                className="p-6 rounded-lg border transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--neutral-200)'
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {job.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                      <div className="flex items-center gap-1">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        <span>{job.source}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(job.publishedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TagIcon className="h-4 w-4" />
                        <span>#{job.hash.slice(0, 8)}</span>
                      </div>
                    </div>

                    {job.description && (
                      <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                        {job.description.replace(/<[^>]*>/g, '').slice(0, 200)}...
                      </p>
                    )}
                  </div>

                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'white'
                    }}
                  >
                    <span>View Job</span>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!state.loading && state.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Showing {((state.pagination.page - 1) * state.pagination.limit) + 1} to{' '}
            {Math.min(state.pagination.page * state.pagination.limit, state.pagination.total)} of{' '}
            {state.pagination.total} jobs
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(state.pagination.page - 1)}
              disabled={!state.pagination.hasPrev}
              className="p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--neutral-200)',
                color: 'var(--text-primary)'
              }}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, state.pagination.totalPages) }, (_, i) => {
                const page = Math.max(1, state.pagination.page - 2) + i
                if (page > state.pagination.totalPages) return null
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded transition-colors ${
                      page === state.pagination.page ? 'font-semibold' : ''
                    }`}
                    style={{
                      backgroundColor: page === state.pagination.page ? 'var(--accent-primary)' : 'transparent',
                      color: page === state.pagination.page ? 'white' : 'var(--text-primary)'
                    }}
                  >
                    {page}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => handlePageChange(state.pagination.page + 1)}
              disabled={!state.pagination.hasNext}
              className="p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--neutral-200)',
                color: 'var(--text-primary)'
              }}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Jobs
