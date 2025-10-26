import { useState, useEffect } from 'react'

import { useParams, Link } from 'react-router-dom'
import { User, Mail, Calendar, MessageSquare } from 'lucide-react'
import api from '../api/api'

const Profile = () => {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/${id}`)
      setUser(response.data)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">User not found</p>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-6">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-600">
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {user.bio && (
              <p className="mt-4 text-gray-700">{user.bio}</p>
            )}
            <div className="flex items-center space-x-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{user.reputation || 0}</div>
                <div className="text-sm text-gray-500">Reputation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{user.posts?.length || 0}</div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Recent Posts
        </h2>
        
        {user.posts && user.posts.length > 0 ? (
          <div className="space-y-4">
            {user.posts.map((post) => (
              <div key={post._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <Link
                  to={`/post/${post._id}`}
                  className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                >
                  <h3 className="font-medium text-gray-900 hover:text-blue-600">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No posts yet
          </p>
        )}
      </div>
    </div>
  )
}

export default Profile
