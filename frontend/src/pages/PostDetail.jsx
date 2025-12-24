import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowUp, ArrowDown, MessageCircle, Eye, ArrowLeft, Trash2, X, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../api/api'
import { getSocket } from '../api/socket'
import CommentTree from '../components/CommentTree'
import MediaGallery from '../components/MediaGallery'
import { useAuth } from '../store/authContext'
import { useTheme } from '../store/themeContext'

const PostDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const BASE_URL = apiUrl.replace(/\/api\/?$/, '')


  // Helper: Update a comment in nested tree structure
  const updateCommentInTree = (comments, updatedComment) => {
    return comments.map(comment => {
      if (comment._id === updatedComment._id) {
        return { ...comment, ...updatedComment }
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: updateCommentInTree(comment.replies, updatedComment) }
      }
      return comment
    })
  }

  // Helper: Remove a comment from nested tree structure
  const removeCommentFromTree = (comments, commentId) => {
    return comments
      .filter(comment => comment._id !== commentId)
      .map(comment => {
        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: removeCommentFromTree(comment.replies, commentId) }
        }
        return comment
      })
  }

  // Helper: Update vote counts for a comment in tree
  const updateCommentVoteInTree = (comments, commentId, upvotes, downvotes) => {
    return comments.map(comment => {
      if (comment._id === commentId) {
        return { ...comment, upvotes, downvotes }
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: updateCommentVoteInTree(comment.replies, commentId, upvotes, downvotes) }
      }
      return comment
    })
  }

  const hasInlineUploadMedia = useMemo(() => {
    if (!post?.content) return false

    try {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = post.content

      // Media inserted by our editor uses `.media-block`
      if (tempDiv.querySelector('.media-block')) return true

      // Fallback: detect upload/blob media that may not be wrapped
      const mediaElements = tempDiv.querySelectorAll('img, video')
      return Array.from(mediaElements).some((element) => {
        const src = element.getAttribute('src') || ''
        return src.startsWith('blob:') || src.includes('/uploads/')
      })
    } catch {
      return false
    }
  }, [post?.content])

  const fetchPost = useCallback(async () => {
    try {
      const response = await api.get(`/posts/${id}`)
      setPost(response.data)
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/comments/post/${id}`)
      setComments(response.data.comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    fetchPost()
    fetchComments()
  }, [fetchPost, fetchComments])

  // OPTIMIZED: Socket handlers with incremental updates where possible
  useEffect(() => {
    const socket = getSocket()
    socket.emit('join_post', id)

    // New comment: need to refresh comments list
    const handleNewComment = (payload) => {
      if (payload?.postId === id) {
        // Add new comment to list if we have the full comment data
        if (payload.comment) {
          setComments(prev => {
            // Avoid duplicates
            if (prev.some(c => c._id === payload.comment._id)) return prev
            return [...prev, payload.comment]
          })
          // Update comment count incrementally
          setPost(prev => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev)
        } else {
          fetchComments()
          fetchPost()
        }
      }
    }

    // Updated comment: update in place
    const handleCommentUpdated = (payload) => {
      if (payload?.postId === id && payload.comment) {
        setComments(prev => updateCommentInTree(prev, payload.comment))
      }
    }

    // Deleted comment: remove from list 
    const handleCommentDeleted = (payload) => {
      if (payload?.postId === id) {
        setComments(prev => removeCommentFromTree(prev, payload.commentId))
        setPost(prev => prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount || 1) - 1) } : prev)
      }
    }

    // OPTIMIZED: Post voted - increment update instead of full fetch
    const handlePostVoted = (payload) => {
      if (payload?.postId === id) {
        setPost(prev => prev ? {
          ...prev,
          upvotes: payload.upvotes ?? prev.upvotes,
          downvotes: payload.downvotes ?? prev.downvotes
        } : prev)
      }
    }

    // OPTIMIZED: Comment voted - increment update
    const handleCommentVoted = (payload) => {
      if (payload?.postId === id && payload.commentId) {
        setComments(prev => updateCommentVoteInTree(prev, payload.commentId, payload.upvotes, payload.downvotes))
      }
    }

    // Post viewed - increment update
    const handlePostViewed = (payload) => {
      if (payload?.postId === id) {
        setPost(prev => prev ? { ...prev, views: payload.views ?? prev.views } : prev)
      }
    }

    socket.on('comment:new', handleNewComment)
    socket.on('comment:updated', handleCommentUpdated)
    socket.on('comment:deleted', handleCommentDeleted)
    socket.on('post:voted', handlePostVoted)
    socket.on('comment:voted', handleCommentVoted)
    socket.on('post:viewed', handlePostViewed)

    return () => {
      socket.emit('leave_post', id)
      socket.off('comment:new', handleNewComment)
      socket.off('comment:updated', handleCommentUpdated)
      socket.off('comment:deleted', handleCommentDeleted)
      socket.off('post:voted', handlePostVoted)
      socket.off('comment:voted', handleCommentVoted)
      socket.off('post:viewed', handlePostViewed)
    }
  }, [id, fetchPost, fetchComments])

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

  const handleDeleteClick = () => {
    if (!post || !user) return

    // Compare as strings to avoid ObjectId comparison issues
    const isAuthor = post.author._id?.toString() === user._id?.toString() ||
      post.author._id === user._id ||
      post.author === user._id

    if (!isAuthor) {
      toast.error('You can only delete your own posts')
      return
    }

    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      setDeleting(true)
      setShowDeleteModal(false)
      await api.delete(`/posts/${post._id}`)
      toast.success('Post deleted successfully')
      navigate('/')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error(error.response?.data?.message || 'Failed to delete post')
    } finally {
      setDeleting(false)
    }
  }

  // Check if content is long (more than 500 characters of text)
  const isLongContent = post && post.content && post.content.length > 500

  // Process media content: replace blob URLs with server URLs
  const processMediaContent = (htmlContent) => {
    if (!htmlContent || !post) return htmlContent

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent

    // Find all media elements (img and video)
    const mediaElements = tempDiv.querySelectorAll('img, video')

    mediaElements.forEach((element) => {
      const src = element.getAttribute('src')

      // If it's a blob URL, replace with actual server URL
      if (src && src.startsWith('blob:')) {
        // Use post.image as the main media source
        if (post.image) {
          element.setAttribute('src', `${BASE_URL}${post.image}`)
        }
      } else if (src && !src.startsWith('http')) {
        // If it's a relative path, make it absolute
        element.setAttribute('src', `${BASE_URL}${src}`)
      }
    })

    return tempDiv.innerHTML
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4500]"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Post not found</p>
        <Link to="/" className="text-[#FF4500] hover:underline mt-4 inline-block">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#DAE0E6]">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Post</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this post? This action cannot be undone. All comments and votes will also be deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-4">
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to posts
        </Link>

        {/* Post Card */}
        <article className="flex bg-white border border-gray-300 rounded">
          {/* Vote Section */}
          <div className="w-10 bg-gray-50 flex flex-col items-center py-2 px-1 rounded-l">
            <button
              onClick={() => handleVote('upvote')}
              className="vote-btn text-gray-400 hover:text-[#FF4500] hover:bg-red-50"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-gray-700 my-1">
              {(post.upvotes || 0) - (post.downvotes || 0)}
            </span>
            <button
              onClick={() => handleVote('downvote')}
              className="vote-btn text-gray-400 hover:text-[#7193FF] hover:bg-blue-50"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Link to={`/profile/${post.author._id}`} className="flex items-center space-x-1 hover:underline">
                  {post.author.avatar ? (
                    <img
                      src={`${BASE_URL}${post.author.avatar}`}
                      alt={post.author.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {post.author.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>u/{post.author.username}</span>
                </Link>
                <span>•</span>
                <span className="category-badge">r/{post.category}</span>
                <span>•</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Delete button - only show for post author */}
              {user && (post.author._id?.toString() === user._id?.toString() || post.author._id === user._id) && (
                <button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-white hover:bg-red-500 rounded-full border border-red-200 hover:border-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete this post"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{deleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-4 text-gray-900">{post.title}</h1>

            {/* Media Gallery - show only when media isn't already embedded in content */}
            {!hasInlineUploadMedia && post.media && post.media.length > 0 ? (
              <MediaGallery media={post.media} />
            ) : !hasInlineUploadMedia && post.image ? (
              <div className="my-4 bg-black rounded-lg overflow-hidden">
                {post.mediaType === 'video' ? (
                  <video
                    src={`${BASE_URL}${post.image}`}
                    controls
                    className="w-full max-h-[600px] object-contain"
                  />
                ) : (
                  <img
                    src={`${BASE_URL}${post.image}`}
                    alt={post.title}
                    className="w-full max-h-[600px] object-contain"
                  />
                )}
              </div>
            ) : null}

            {/* Content with HTML formatting and Read More */}
            <div className="mb-4">
              <div
                className={`post-content ${!isExpanded && isLongContent ? 'post-content-collapsed' : ''}`}
                dangerouslySetInnerHTML={{ __html: processMediaContent(post.content) }}
              />

              {isLongContent && !isExpanded && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="mt-2 text-sm font-bold text-[#FF4500] hover:underline"
                >
                  Xem thêm
                </button>
              )}

              {isLongContent && isExpanded && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="mt-2 text-sm font-bold text-[#FF4500] hover:underline"
                >
                  Thu gọn
                </button>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center space-x-4 pt-3 border-t border-gray-200">
              <div className="action-icon">
                <MessageCircle className="w-4 h-4" />
                <span>{comments.length} Comments</span>
              </div>
              <div className="action-icon">
                <Eye className="w-4 h-4" />
                <span>{post.views || 0} Views</span>
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-4 bg-white border border-gray-300 rounded p-4">
          <h2 className="text-lg font-bold mb-4">Comments</h2>

          {user && (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FF4500] focus:border-[#FF4500] focus:outline-none resize-none"
                rows="3"
                placeholder="What are your thoughts?"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="px-6 py-2 text-sm font-bold text-white bg-[#FF4500] rounded-full hover:bg-[#FF5722] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingComment ? 'Commenting...' : 'Comment'}
                </button>
              </div>
            </form>
          )}

          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentTree
                  key={comment._id}
                  comment={comment}
                  onReplySuccess={() => {
                    fetchComments()
                    fetchPost()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CSS for post content */}
      <style>{`
        .post-content {
          font-size: 0.875rem;
          line-height: 1.5;
          color: #1a1a1b;
        }

        .post-content b,
        .post-content strong {
          font-weight: 600;
        }

        .post-content i,
        .post-content em {
          font-style: italic;
        }

        .post-content p {
          margin-bottom: 0.75rem;
        }

        /* Collapsed state for long content */
        .post-content-collapsed {
          max-height: 300px;
          overflow: hidden;
          position: relative;
        }

        .post-content-collapsed::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(to bottom, transparent, white);
        }

        /* Media blocks from WYSIWYG editor */
        .post-content .media-block {
          margin: 1rem 0;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          overflow: hidden;
          background-color: #f9fafb;
        }

        .post-content .media-block > div:first-child {
          position: relative;
          background-color: #000;
        }

        .post-content .media-block img,
        .post-content .media-block video {
          width: 100%;
          max-height: 32rem;
          object-fit: contain;
          display: block;
        }

        /* Caption rendering - show as text not input */
        .post-content .media-block > div:last-child {
          padding: 0.5rem;
          background-color: #f9fafb;
        }

        .post-content .media-block input {
          display: block;
          width: 100%;
          padding: 0;
          margin: 0;
          border: none;
          background: transparent;
          font-size: 0.75rem;
          color: #6b7280;
          font-style: italic;
          pointer-events: none;
          outline: none;
        }

        /* Hide remove buttons in view mode */
        .post-content .media-block button {
          display: none;
        }

        .vote-btn {
          display: flex;
          align-items: center;
          justify-center;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 0.25rem;
          transition: all 0.15s;
        }
      `}</style>
    </div>
  )
}

export default PostDetail
