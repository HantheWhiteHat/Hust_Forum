import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Plus, Search, X, Loader2 } from 'lucide-react'
import { useAuth } from '../store/authContext'
import api from '../api/api'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const BASE_URL = apiUrl.replace(/\/api\/?$/, '')

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true)
        const response = await api.get(`/posts?search=${encodeURIComponent(searchQuery)}&limit=5`)
        setSearchResults(response.data.posts || [])
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`)
      setShowResults(false)
      setSearchQuery('')
    }
  }

  const handleResultClick = (postId) => {
    navigate(`/post/${postId}`)
    setShowResults(false)
    setSearchQuery('')
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  return (
    <header className="bg-[#1A1A1B] sticky top-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-white hover:opacity-90 transition flex-shrink-0">
            <img
              src="/favico.png"
              alt="BK Forum"
              className="w-8 h-8 rounded"
            />
            <span className="font-bold text-xl hidden sm:block">
              BK<span className="text-[#FF4500]">Forum</span>
            </span>
          </Link>

          {/* Search Bar - Center */}
          <div ref={searchRef} className="flex-1 max-w-xl relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowResults(true)}
                  placeholder="Search posts..."
                  className="w-full pl-10 pr-10 py-2 bg-[#272729] text-white text-sm rounded-full border border-gray-700 focus:border-[#FF4500] focus:outline-none focus:ring-1 focus:ring-[#FF4500] placeholder-gray-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1B] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <>
                    {searchResults.map((post) => (
                      <button
                        key={post._id}
                        onClick={() => handleResultClick(post._id)}
                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[#272729] transition text-left border-b border-gray-800 last:border-b-0"
                      >
                        {/* Thumbnail */}
                        {post.image && (
                          <img
                            src={`${BASE_URL}${post.image}`}
                            alt=""
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium truncate">
                            {post.title}
                          </h4>
                          <p className="text-gray-400 text-xs mt-0.5">
                            r/{post.category} • u/{post.author?.username}
                          </p>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full px-4 py-2.5 text-center text-sm text-[#FF4500] hover:bg-[#272729] transition font-medium"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-6 text-center text-gray-400 text-sm">
                    {isSearching ? 'Searching...' : 'No posts found'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {user ? (
              <>
                <Link
                  to="/create-post"
                  className="flex items-center px-3 py-1.5 bg-[#FF4500] text-white rounded-full font-bold text-sm hover:bg-[#FF5722] transition"
                >
                  <Plus className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Create</span>
                </Link>

                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center space-x-2 px-2 py-1.5 text-white hover:bg-gray-800 rounded transition"
                >
                  {user.avatar ? (
                    <img
                      src={`${BASE_URL}${user.avatar}`}
                      alt={user.username}
                      className="w-7 h-7 rounded-full object-cover border border-gray-600"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-[#FF4500] rounded-full flex items-center justify-center text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium hidden md:block">{user.username}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-white font-bold text-sm hover:bg-gray-800 rounded-full transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 bg-[#FF4500] text-white rounded-full font-bold text-sm hover:bg-[#FF5722] transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
