import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  useEffect(() => {
    const socket = getSocket()

    const refresh = () => {
      fetchPosts()
    }

    socket.on('post:new', refresh)
    socket.on('post:updated', refresh)
    socket.on('post:deleted', refresh)
    socket.on('post:voted', refresh)
    socket.on('post:viewed', refresh)

    return () => {
      socket.off('post:new', refresh)
      socket.off('post:updated', refresh)
      socket.off('post:deleted', refresh)
      socket.off('post:voted', refresh)
      socket.off('post:viewed', refresh)
    }
  }, [fetchPosts])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-100">
      <div className="flex justify-between items-center mb-10 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">BK Forum</h1>
        <Link
          to="/create-post"
          className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-base hover:bg-indigo-700 transition duration-300 shadow-lg"
        >
          Create Post
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-xl mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search posts..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="academic">Academic</option>
              <option value="technology">Technology</option>
              <option value="sports">Sports</option>
              <option value="entertainment">Entertainment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="input"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most Popular</option>
              <option value="most_viewed">Most Viewed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ page: 1, category: '', search: '', sort: 'newest' })}
              className="w-full py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-150"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100">
            <p className="text-gray-500 text-xl font-medium">No posts found</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-12">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handlePageChange(pagination.prevPage)}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 border border-indigo-300 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700 font-semibold bg-gray-100 rounded-lg">
              Page {pagination.current} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.nextPage)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 border border-indigo-300 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
