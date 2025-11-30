import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Eye, Calendar } from 'lucide-react'

const PostCard = ({ post }) => {
  const BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

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

        {post.image && (
          <img
            src={`${BASE_URL}${post.image}`}
            // src={post.image}
            alt={post.title}
            className="max-w-full h-auto object-contain rounded-lg mb-4"
          />
        )}
        
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.content.length > 200 
            ? `${post.content.substring(0, 200)}...` 
            : post.content
          }
        </p>
      </Link>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
            >
              #{tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
              +{post.tags.length - 3} more
            </span>
          )}
        </div>
      )}

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

