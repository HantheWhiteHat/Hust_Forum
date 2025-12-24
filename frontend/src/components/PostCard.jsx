import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, Eye, ArrowUp, ArrowDown, Clock } from 'lucide-react'
import { useAuth } from '../store/authContext'
import { useTheme } from '../store/themeContext'
import api from '../api/api'
import toast from 'react-hot-toast'

const PostCard = ({ post }) => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const BASE_URL = apiUrl.replace(/\/api\/?$/, '')

  // Local state for votes
  const [votes, setVotes] = useState({
    upvotes: post.upvotes || 0,
    downvotes: post.downvotes || 0,
    userVote: post.userVote || null // 'upvote', 'downvote', or null
  })
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (type, e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.error('Please login to vote')
      navigate('/login')
      return
    }

    if (isVoting) return

    try {
      setIsVoting(true)
      const response = await api.post('/votes', {
        postId: post._id,
        type
      })

      // Update local state based on response
      if (response.data) {
        setVotes(prev => ({
          upvotes: response.data.upvotes ?? prev.upvotes,
          downvotes: response.data.downvotes ?? prev.downvotes,
          userVote: response.data.userVote ?? (prev.userVote === type ? null : type)
        }))
      }
    } catch (error) {
      console.error('Vote error:', error)
      toast.error(error.response?.data?.message || 'Failed to vote')
    } finally {
      setIsVoting(false)
    }
  }

  // Calculate net votes for display
  const netVotes = votes.upvotes - votes.downvotes

  const handleImageError = (e) => {
    e.currentTarget.style.display = 'none'
  }

  // Format time difference
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + 'y'
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + 'mo'
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + 'd'
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + 'h'
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + 'm'
    return Math.floor(seconds) + 's'
  }

  // Strip HTML tags for preview
  const stripHtmlTags = (html) => {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  return (
    <article className={`flex border transition-all duration-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md ${isDark
      ? 'bg-[#1A1A1B] border-gray-700 hover:border-gray-500'
      : 'bg-white border-gray-300 hover:border-gray-400'
      }`}>
      {/* Vote Section */}
      <div className={`w-10 flex flex-col items-center py-2 px-1 ${isDark ? 'bg-[#161617]' : 'bg-gray-50'
        }`}>
        <button
          onClick={(e) => handleVote('upvote', e)}
          disabled={isVoting}
          className={`vote-btn p-1 rounded transition-all ${votes.userVote === 'upvote'
            ? 'text-[#FF4500] bg-red-50'
            : 'text-gray-400 hover:text-[#FF4500] hover:bg-red-50'
            } disabled:opacity-50`}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <span className={`text-xs font-bold my-1 ${votes.userVote === 'upvote' ? 'text-[#FF4500]' :
          votes.userVote === 'downvote' ? 'text-[#7193FF]' :
            'text-gray-700'
          }`}>
          {netVotes}
        </span>
        <button
          onClick={(e) => handleVote('downvote', e)}
          disabled={isVoting}
          className={`vote-btn p-1 rounded transition-all ${votes.userVote === 'downvote'
            ? 'text-[#7193FF] bg-blue-50'
            : 'text-gray-400 hover:text-[#7193FF] hover:bg-blue-50'
            } disabled:opacity-50`}
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-3">
        <Link to={`/post/${post._id}`} className="block">
          {/* Header */}
          <div className={`flex items-center space-x-2 text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Link to={`/profile/${post.author._id}`} className="flex items-center space-x-1 hover:underline">
              {post.author.avatar ? (
                <img
                  src={`${BASE_URL}${post.author.avatar}`}
                  alt={post.author.username}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {post.author.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span>u/{post.author.username}</span>
            </Link>
            <span>•</span>
            <span className="category-badge">
              r/{post.category}
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{getTimeAgo(post.createdAt)} ago</span>
            </span>
          </div>

          {/* Title */}
          <h2 className={`text-base font-medium hover:text-[#FF4500] mb-1.5 leading-tight ${isDark ? 'text-white' : 'text-gray-900'
            }`}>
            {post.title}
          </h2>

          {/* Content Preview */}
          {post.content && (
            <p className={`text-sm mb-2 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {stripHtmlTags(post.content)}
            </p>
          )}

          {/* Media preview - NEW: Support both media array and single image */}
          {(() => {
            // Get first media (prefer media array, fallback to image)
            const firstMedia = post.media && post.media.length > 0
              ? post.media[0]
              : post.image
                ? { filepath: post.image, mediaType: post.mediaType }
                : null

            if (!firstMedia) return null

            return (
              <div className="mb-2 relative">
                {firstMedia.mediaType === 'video' ? (
                  <video
                    src={`${BASE_URL}${firstMedia.filepath}`}
                    className="w-full max-h-64 rounded object-cover"
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={`${BASE_URL}${firstMedia.filepath}`}
                    alt={post.title}
                    onError={handleImageError}
                    className="w-full max-h-64 rounded object-cover"
                  />
                )}

                {/* Show media count badge if multiple */}
                {post.media && post.media.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                    +{post.media.length - 1} more
                  </div>
                )}
              </div>
            )
          })()}
        </Link>

        {/* Action Bar */}
        <div className="flex items-center space-x-4 mt-2">
          <Link
            to={`/post/${post._id}`}
            className="action-icon"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentCount || 0} Comments</span>
          </Link>

          <div className="action-icon">
            <Eye className="w-4 h-4" />
            <span>{post.views || 0} Views</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default PostCard
