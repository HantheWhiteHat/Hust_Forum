import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Reply, ChevronDown, ChevronRight } from 'lucide-react'
import api from '../api/api'
import { useTheme } from '../store/themeContext'

const CommentTree = ({ comment, onReplySuccess }) => {
  const { isDark } = useTheme()
  const [showReplies, setShowReplies] = useState(true)
  const [replies, setReplies] = useState(comment.replies || [])
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const BASE_URL = apiUrl.replace(/\/api\/?$/, '')

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null
    if (avatarPath.startsWith('http')) return avatarPath
    return `${BASE_URL}${avatarPath}`
  }

  useEffect(() => {
    setReplies(comment.replies || [])
  }, [comment.replies])

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    try {
      setSubmittingReply(true)
      const response = await api.post('/comments', {
        content: replyText,
        postId: comment.post,
        parentCommentId: comment._id
      })

      setReplies(prev => [...prev, response.data])
      setReplyText('')
      setShowReplyForm(false)

      if (onReplySuccess) {
        onReplySuccess()
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleVote = async (type) => {
    try {
      await api.post('/votes', {
        commentId: comment._id,
        type
      })
      // Refresh comment data or update local state
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const avatarUrl = getAvatarUrl(comment.author?.avatar)

  return (
    <div className="border-l-2 border-gray-600 pl-4">
      <div className="flex items-start space-x-3">
        <Link to={`/profile/${comment.author?._id}`}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={comment.author?.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {comment.author?.username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </Link>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-white">{comment.author?.username || 'unknown'}</span>
            <span className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>

          <p className="text-gray-300 mb-3 whitespace-pre-wrap">{comment.content}</p>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleVote('upvote')}
              className="flex items-center space-x-1 text-gray-400 hover:text-red-500"
            >
              <Heart className="w-4 h-4" />
              <span>{comment.upvotes}</span>
            </button>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center space-x-1 text-gray-400 hover:text-blue-400"
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReply} className="mt-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-3 border border-gray-600 rounded-lg bg-[#272729] text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FF4500] focus:border-[#FF4500]"
                rows="3"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#FF4500] hover:bg-[#FF5722] rounded-lg transition disabled:opacity-50"
                >
                  {submittingReply ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </form>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center space-x-1 text-sm text-gray-400 hover:text-gray-200 mb-2"
              >
                {showReplies ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
              </button>

              {showReplies && (
                <div className="space-y-4">
                  {replies.map((reply) => (
                    <CommentTree
                      key={reply._id}
                      comment={reply}
                      onReplySuccess={onReplySuccess}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommentTree

