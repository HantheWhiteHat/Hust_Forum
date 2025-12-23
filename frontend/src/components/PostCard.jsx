import { Link } from 'react-router-dom'
import { MessageCircle, Eye, ArrowUp, ArrowDown, Clock } from 'lucide-react'

const PostCard = ({ post }) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const BASE_URL = apiUrl.replace(/\/api\/?$/, '')

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
    <article className="flex bg-white border border-gray-300 hover:border-gray-400 transition-all duration-150 rounded overflow-hidden">
      {/* Vote Section */}
      <div className="w-10 bg-gray-50 flex flex-col items-center py-2 px-1">
        <button className="vote-btn text-gray-400 hover:text-[#FF4500] hover:bg-red-50">
          <ArrowUp className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-gray-700 my-1">
          {post.upvotes || 0}
        </span>
        <button className="vote-btn text-gray-400 hover:text-[#7193FF] hover:bg-blue-50">
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-3">
        <Link to={`/post/${post._id}`} className="block">
          {/* Header */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
            <span className="category-badge">
              r/{post.category}
            </span>
            <span>•</span>
            <span>Posted by u/{post.author.username}</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{getTimeAgo(post.createdAt)} ago</span>
            </span>
          </div>

          {/* Title */}
          <h2 className="text-base font-medium text-gray-900 hover:text-[#FF4500] mb-1.5 leading-tight">
            {post.title}
          </h2>

          {/* Content Preview */}
          {post.content && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
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
