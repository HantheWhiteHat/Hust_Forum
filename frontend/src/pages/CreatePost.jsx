import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/api'

const CreatePost = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, watch } = useForm()

  const tags = watch('tags')

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      // Process tags
      const processedTags = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : []

      const postData = {
        ...data,
        tags: processedTags
      }

      const response = await api.post('/posts', postData)
      toast.success('Post created successfully!')
      navigate(`/post/${response.data._id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New Post</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              {...register('title', { 
                required: 'Title is required',
                maxLength: { value: 200, message: 'Title must be less than 200 characters' }
              })}
              className="input"
              placeholder="Enter post title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="input"
            >
              <option value="">Select a category</option>
              <option value="general">General</option>
              <option value="academic">Academic</option>
              <option value="technology">Technology</option>
              <option value="sports">Sports</option>
              <option value="entertainment">Entertainment</option>
              <option value="other">Other</option>
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              {...register('content', { 
                required: 'Content is required',
                maxLength: { value: 10000, message: 'Content must be less than 10000 characters' }
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="10"
              placeholder="Write your post content here..."
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              {...register('tags')}
              className="input"
              placeholder="Enter tags separated by commas (e.g., javascript, react, tutorial)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating Post...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost
