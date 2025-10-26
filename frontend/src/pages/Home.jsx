import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'
import PostCard from '../components/PostCard'

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

  useEffect(() => {
    fetchPosts()
  }, [filters])

  const fetchPosts = async () => {
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
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">BK Forum</h1>
        <Link
          to="/create-post"
          className="btn btn-primary"
        >
          Create Post
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts found</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.prevPage)}
              disabled={!pagination.hasPrevPage}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {pagination.current} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.nextPage)}
              disabled={!pagination.hasNextPage}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
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

