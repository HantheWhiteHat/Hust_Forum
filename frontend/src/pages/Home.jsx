import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TrendingUp, Sparkles, Trophy, X, Search, User, FileText } from 'lucide-react'
import api from '../api/api'
import PostCard from '../components/PostCard'
import { getSocket } from '../api/socket'
import { useTheme } from '../store/themeContext'

const Home = () => {
  const { isDark } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [searchType, setSearchType] = useState('posts') // 'posts' or 'users'
  const [filters, setFilters] = useState({
    page: 1,
    category: '',
    search: searchParams.get('search') || '',
    sort: 'newest'
  })

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const BASE_URL = apiUrl.replace(/\/api\/?$/, '')

  // Sync search param from URL
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    if (urlSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: urlSearch, page: 1 }))
    }
  }, [searchParams])

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/posts', { params: filters })
      setPosts(response.data.posts)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchUsers = useCallback(async () => {
    if (!filters.search) {
      setUsers([])
      return
    }
    try {
      setLoading(true)
      const response = await api.get('/users/search', { params: { search: filters.search } })
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.search])

  useEffect(() => {
    if (searchType === 'posts') {
      fetchPosts()
    } else {
      fetchUsers()
    }
  }, [fetchPosts, fetchUsers, searchType])

  const handleSortChange = (value) => {
    setFilters(prev => ({ ...prev, sort: value, page: 1 }))
  }

  const handleCategoryChange = (value) => {
    setFilters(prev => ({ ...prev, category: value, page: 1 }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearSearch = () => {
    setFilters(prev => ({ ...prev, search: '', page: 1 }))
    setSearchParams({})
    setSearchType('posts')
    setUsers([])
  }

  const handleSearchTypeChange = (type) => {
    setSearchType(type)
  }

  // OPTIMIZED: Incremental updates instead of full refresh
  useEffect(() => {
    const socket = getSocket()

    // Handle new post - add to top of list
    const handleNewPost = (newPost) => {
      if (filters.page === 1) {
        setPosts(prev => {
          // Avoid duplicates
          if (prev.some(p => p._id === newPost._id)) return prev
          // Add new post to top, remove last if at limit
          const updated = [newPost, ...prev]
          return updated.slice(0, 10) // Keep max 10 posts per page
        })
      }
    }

    // Handle post updated - update in place
    const handlePostUpdated = (updatedPost) => {
      setPosts(prev => prev.map(p =>
        p._id === updatedPost._id ? { ...p, ...updatedPost } : p
      ))
    }

    // Handle post deleted - remove from list
    const handlePostDeleted = (data) => {
      setPosts(prev => prev.filter(p => p._id !== data.postId))
    }

    // Handle vote changes - update vote counts incrementally
    const handlePostVoted = (data) => {
      setPosts(prev => prev.map(p =>
        p._id === data.postId
          ? { ...p, upvotes: data.upvotes, downvotes: data.downvotes }
          : p
      ))
    }

    // Handle view changes - update view count incrementally
    const handlePostViewed = (data) => {
      setPosts(prev => prev.map(p =>
        p._id === data.postId
          ? { ...p, views: data.views }
          : p
      ))
    }

    socket.on('post:new', handleNewPost)
    socket.on('post:updated', handlePostUpdated)
    socket.on('post:deleted', handlePostDeleted)
    socket.on('post:voted', handlePostVoted)
    socket.on('post:viewed', handlePostViewed)

    return () => {
      socket.off('post:new', handleNewPost)
      socket.off('post:updated', handlePostUpdated)
      socket.off('post:deleted', handlePostDeleted)
      socket.off('post:voted', handlePostVoted)
      socket.off('post:viewed', handlePostViewed)
    }
  }, [filters.page])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4500]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Sort Tabs */}
        <div className={`rounded-lg mb-4 px-2 sm:px-4 py-2 flex items-center justify-between gap-2 transition-colors ${isDark ? 'bg-[#1A1A1B] border border-gray-700' : 'bg-white border border-gray-300'
          }`}>
          {/* Sort Buttons - Compact on mobile */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => handleSortChange('newest')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${filters.sort === 'newest'
                ? 'bg-[#FF4500] text-white shadow-sm'
                : isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              onClick={() => handleSortChange('popular')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${filters.sort === 'popular'
                ? 'bg-[#FF4500] text-white shadow-sm'
                : 'text-gray-400 hover:bg-gray-700'
                }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Hot</span>
            </button>
            <button
              onClick={() => handleSortChange('most_viewed')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${filters.sort === 'most_viewed'
                ? 'bg-[#FF4500] text-white shadow-sm'
                : isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Top</span>
            </button>
          </div>

          {/* Topic Dropdown - Compact on mobile */}
          <select
            value={filters.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full border focus:outline-none focus:ring-2 focus:ring-[#FF4500] cursor-pointer transition-all appearance-none pr-6 sm:pr-8 max-w-[120px] sm:max-w-none truncate ${isDark
              ? 'text-gray-300 bg-[#272729] hover:bg-[#333] border-gray-600'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '14px' }}
          >
            <option value="">All Topics</option>
            <option value="general">General</option>
            <option value="academic">Academic</option>
            <option value="technology">Technology</option>
            <option value="sports">Sports</option>
            <option value="entertainment">Entertainment</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Search Results Banner */}
        {filters.search && (
          <div className={`rounded-lg mb-4 overflow-hidden border transition-colors ${isDark ? 'bg-[#1A1A1B] border-gray-700' : 'bg-white border-gray-300'
            }`}>
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
              <div className="flex items-center gap-3">
                <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Search results for: <strong className={isDark ? 'text-white' : 'text-gray-900'}>"{filters.search}"</strong>
                </span>
              </div>
              <button
                onClick={clearSearch}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>

            {/* Toggle Buttons */}
            <div className={`px-4 py-2 flex items-center gap-2 ${isDark ? 'bg-[#272729]' : 'bg-gray-50'
              }`}>
              <button
                onClick={() => handleSearchTypeChange('posts')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${searchType === 'posts'
                  ? 'bg-[#FF4500] text-white shadow-sm'
                  : isDark
                    ? 'bg-[#1A1A1B] text-gray-400 hover:bg-[#333] border border-gray-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Posts
                <span className={`text-xs ${searchType === 'posts' ? 'text-white/80' : 'text-gray-400'}`}>
                  ({posts.length})
                </span>
              </button>
              <button
                onClick={() => handleSearchTypeChange('users')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${searchType === 'users'
                  ? 'bg-[#FF4500] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
              >
                <User className="w-3.5 h-3.5" />
                Users
                <span className={`text-xs ${searchType === 'users' ? 'text-white/80' : 'text-gray-400'}`}>
                  ({users.length})
                </span>
              </button>
            </div>
          </div>
        )}

        {/* User Results */}
        {filters.search && searchType === 'users' && (
          <div className="space-y-2 mb-4">
            {users.length === 0 ? (
              <div className="text-center py-12 bg-[#1A1A1B] rounded-lg border border-gray-700">
                <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No users found matching "{filters.search}"</p>
              </div>
            ) : (
              users.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  className="block bg-[#1A1A1B] border border-gray-700 rounded-lg p-4 hover:border-[#FF4500] hover:bg-[#272729] transition group"
                >
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={`${BASE_URL}${user.avatar}`}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-[#FF4500] transition"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#FF4500] rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-transparent group-hover:border-[#FF5722] transition">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-[#FF4500] transition">
                        u/{user.username}
                      </h3>
                      {user.bio && (
                        <p className="text-sm text-gray-400 truncate">{user.bio}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Posts - hide when showing user search results */}
        {(!filters.search || searchType === 'posts') && (
          <div className="space-y-2">
            {posts.length === 0 ? (
              <div className="text-center py-16 bg-[#1A1A1B] rounded-lg border border-gray-700">
                <p className="text-gray-400 text-lg">No posts found</p>
                <Link
                  to="/create-post"
                  className="inline-block mt-4 px-6 py-2 bg-[#FF4500] text-white rounded-full font-bold hover:bg-[#FF5722] transition"
                >
                  Create the first post
                </Link>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-6 mb-8">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.prevPage)}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 text-sm font-bold text-[#FF4500] bg-[#1A1A1B] border border-gray-700 rounded hover:bg-[#272729] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-500"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-gray-300 font-medium bg-[#272729] border border-gray-700 rounded">
                {pagination.current} / {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.nextPage)}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 text-sm font-bold text-[#FF4500] bg-[#1A1A1B] border border-gray-700 rounded hover:bg-[#272729] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-500"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
