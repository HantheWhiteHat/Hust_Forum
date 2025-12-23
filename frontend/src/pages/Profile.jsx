import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { User, Mail, Calendar, MessageSquare, Camera, Edit2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/api'
import { useAuth } from '../store/authContext'
import ImageCropper from '../components/ImageCropper'

const Profile = () => {
  const { id } = useParams()
  const { user: currentUser, updateUserProfile } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [showCropper, setShowCropper] = useState(false)
  const [imageToCrop, setImageToCrop] = useState(null)
  const fileInputRef = useRef(null)

  const isOwnProfile = currentUser?._id === id

  // Size threshold for showing cropper (500KB)
  const CROP_THRESHOLD = 500 * 1024

  useEffect(() => {
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/${id}`)
      setUser(response.data)
      setBio(response.data.bio || '')
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate max file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    // If file is large, show cropper
    if (file.size > CROP_THRESHOLD) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageToCrop(reader.result)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
    } else {
      // Small file, upload directly
      await uploadAvatar(file)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropComplete = async (croppedFile) => {
    setShowCropper(false)
    setImageToCrop(null)
    await uploadAvatar(croppedFile)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setImageToCrop(null)
  }

  const uploadAvatar = async (file) => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await api.put(`/users/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setUser(response.data)
      updateUserProfile({ avatar: response.data.avatar })
      toast.success('Avatar updated successfully!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error(error.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveBio = async () => {
    try {
      const response = await api.put(`/users/${id}`, { bio })
      setUser(response.data)
      setEditing(false)
      toast.success('Profile updated!')
    } catch (error) {
      console.error('Error updating bio:', error)
      toast.error('Failed to update profile')
    }
  }

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null
    // Handle both full URLs and relative paths
    if (avatarPath.startsWith('http')) return avatarPath
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const baseUrl = apiUrl.replace(/\/api\/?$/, '')
    return `${baseUrl}${avatarPath}`
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

  const avatarUrl = getAvatarUrl(user?.avatar)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Image Cropper Modal */}
      {showCropper && imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}

      <div className="card mb-6">
        <div className="flex items-start space-x-6">
          {/* Avatar Section */}
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.username}
                className={`w-20 h-20 rounded-full object-cover ${isOwnProfile ? 'cursor-pointer' : ''}`}
                onClick={handleAvatarClick}
              />
            ) : (
              <div
                className={`w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold ${isOwnProfile ? 'cursor-pointer' : ''}`}
                onClick={handleAvatarClick}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Upload overlay for own profile */}
            {isOwnProfile && (
              <div
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* User Info Section */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
              {isOwnProfile && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Edit profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

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

            {/* Bio Section */}
            {editing ? (
              <div className="mt-4">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write something about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{bio.length}/500</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(false)
                        setBio(user.bio || '')
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSaveBio}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              user.bio && <p className="mt-4 text-gray-700">{user.bio}</p>
            )}

            {/* Stats */}
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
