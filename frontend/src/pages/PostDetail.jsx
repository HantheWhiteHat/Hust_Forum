import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Eye, ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../api/api'
import CommentTree from '../components/CommentTree'
import { useAuth } from '../store/authContext'

const PostDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const BASE_URL = apiUrl.replace(/\/api\/?$/, '')
  const handleImageError = (e) => {
    e.currentTarget.style.display = 'none'
  }

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [id])

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`)
      setPost(response.data)
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/post/${id}`)
      setComments(response.data.comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setSubmittingComment(true)
      await api.post('/comments', {
        content: newComment,
        postId: id
      })
      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleVote = async (type) => {
    try {
      await api.post('/votes', {
        postId: id,
        type
      })
      fetchPost()
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleDelete = async () => {
    if (!post || !user || post.author._id !== user._id) return

    const confirmed = window.confirm('Are you sure you want to delete this post?')
    if (!confirmed) return

    try {
      setDeleting(true)
      await api.delete(`/posts/${post._id}`)
      toast.success('Post deleted')
      navigate('/')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error(error.response?.data?.message || 'Failed to delete post')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Post not found</p>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Home
        </Link>
      </div>
    )
  }

  return (

    <div className="max-w-4xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Posts
      </Link>

      <article className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {post.author.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium">{post.author.username}</h3>
              <p className="text-sm text-gray-500">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {post.category}
            </span>

            {user && post.author._id === user._id && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

        {post.image && (
          <div className="flex justify-center my-6">
            <img
              src={`${BASE_URL}${post.image}`}
              alt={post.title}
              onError={handleImageError}
              className="max-w-full h-auto object-contain rounded-lg mb-4"
            />
          </div>
        )}
        
        <div className="prose max-w-none mb-6">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleVote('upvote')}
              className="flex items-center space-x-1 text-gray-600 hover:text-red-600"
            >
              <Heart className="w-5 h-5" />
              <span>{post.upvotes}</span>
            </button>
            <div className="flex items-center space-x-1 text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <span>{post.commentCount}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-600">
              <Eye className="w-5 h-5" />
              <span>{post.views}</span>
            </div>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Comments ({post.commentCount})</h3>
        
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          />
          <button
            type="submit"
            disabled={submittingComment || !newComment.trim()}
            className="btn btn-primary mt-2 disabled:opacity-50"
          >
            {submittingComment ? 'Posting...' : 'Post Comment'}
          </button>
        </form>

        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentTree 
              key={comment._id} 
              comment={comment}
              onReplySuccess={fetchComments} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PostDetail
