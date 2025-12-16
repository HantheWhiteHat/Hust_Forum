import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Eye, Calendar } from 'lucide-react'

const PostCard = ({ post }) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const BASE_URL = apiUrl.replace(/\/api\/?$/, '')

  const handleImageError = (e) => {
    e.currentTarget.style.display = 'none'
  }

  return (
    <article className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {post.author.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <Link
              to={`/profile/${post.author._id}`}
              className="font-medium text-gray-900 hover:text-blue-600"
            >
              {post.author.username}
            </Link>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
          {post.category}
        </span>
      </div>

      <Link to={`/post/${post._id}`} className="block group">
        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 mb-3">
          {post.title}
        </h2>

        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.content}
        </p>

        {/* Media preview */}
        {post.image && (
          <div className="mb-4">
            {post.mediaType === 'video' ? (
              <video
                src={`${BASE_URL}${post.image}`}
                className="w-full max-h-80 rounded-lg object-cover"
                controls
                preload="metadata"
              />
            ) : (
              <img
                src={`${BASE_URL}${post.image}`}
                alt={post.title}
                onError={handleImageError}
                className="w-full max-h-80 rounded-lg object-cover"
              />
            )}
          </div>
        )}
      </Link>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-gray-600">
            <Heart className="w-4 h-4" />
            <span>{post.upvotes}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentCount}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <Eye className="w-4 h-4" />
            <span>{post.views}</span>
          </div>
        </div>

        <Link
          to={`/post/${post._id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Read more →
        </Link>
      </div>
    </article>
  )
}

export default PostCard
