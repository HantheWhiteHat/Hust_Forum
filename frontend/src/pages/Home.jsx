import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Sparkles, Trophy, Filter } from 'lucide-react'
import api from '../api/api'
import PostCard from '../components/PostCard'
import { getSocket } from '../api/socket'

const Home = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({
    page: 1,
    category: '',
    search: '',
    sort: 'newest'
  })

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

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

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
    <div className="min-h-screen bg-[#DAE0E6]">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Sort Tabs - Reddit style */}
        <div className="bg-white border border-gray-300 rounded mb-4 px-2 flex items-center space-x-1">
          <button
            onClick={() => handleSortChange('newest')}
            className={`sort-tab ${filters.sort === 'newest' ? 'sort-tab-active' : ''}`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            New
          </button>
          <button
            onClick={() => handleSortChange('popular')}
            className={`sort-tab ${filters.sort === 'popular' ? 'sort-tab-active' : ''}`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Hot
          </button>
          <button
            onClick={() => handleSortChange('most_viewed')}
            className={`sort-tab ${filters.sort === 'most_viewed' ? 'sort-tab-active' : ''}`}
          >
            <Trophy className="w-4 h-4 inline mr-1" />
            Top
          </button>

          {/* Category Filter */}
          <div className="ml-auto flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filters.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="text-sm border-none bg-transparent focus:outline-none focus:ring-0 text-gray-700 font-medium cursor-pointer"
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
        </div>

        {/* Posts */}
        <div className="space-y-2">
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded border border-gray-300">
              <p className="text-gray-500 text-lg">No posts found</p>
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-6 mb-8">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.prevPage)}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 text-sm font-bold text-[#FF4500] bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-gray-700 font-medium bg-white border border-gray-300 rounded">
                {pagination.current} / {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.nextPage)}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 text-sm font-bold text-[#FF4500] bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
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
