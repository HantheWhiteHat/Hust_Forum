import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/api'

const CreatePost = () => {
  const [loading, setLoading] = useState(false)
  // Single media file that can be image or video
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null) // 'image' | 'video' | null
  const [postType, setPostType] = useState('text');
  const [content, setContent] = useState('')

  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      content: ''
    }
  })

  const textareaRef = useRef(null)
  const mediaInputRef = useRef(null)

  const titleValue = watch('title') || '';
  const titleLength = titleValue.length;
  const maxTitleLength = 300;

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      const formData = new FormData()
      formData.append("title", data.title);
      formData.append("content", content || '');
      formData.append("category", data.category);

      if (mediaFile) {
        // Backend đang dùng field "image" nên tái sử dụng cho cả image & video
        formData.append("image", mediaFile);
        formData.append("mediaType", mediaType || 'image')
      }

      const token = localStorage.getItem('token');

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })
      toast.success('Post created successfully!')
      navigate(`/post/${response.data._id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));

      if (file.type.startsWith('video/')) {
        setMediaType('video')
      } else {
        setMediaType('image')
      }
    }
  }

  const triggerMediaSelect = () => {
    if (mediaInputRef.current) {
      mediaInputRef.current.accept = 'image/*,video/*'
      mediaInputRef.current.value = ''
      mediaInputRef.current.click()
    }
  }

  const triggerImageSelect = () => {
    if (mediaInputRef.current) {
      mediaInputRef.current.accept = 'image/*'
      mediaInputRef.current.value = ''
      mediaInputRef.current.click()
    }
  }

  const triggerVideoSelect = () => {
    if (mediaInputRef.current) {
      mediaInputRef.current.accept = 'video/*'
      mediaInputRef.current.value = ''
      mediaInputRef.current.click()
    }
  }

  // Basic text formatting using markdown-like syntax
  const applyFormat = (type) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.slice(start, end)

    let before = content.slice(0, start)
    let after = content.slice(end)
    let formatted = selected

    if (type === 'bold') {
      formatted = `**${selected || 'bold text'}**`
    } else if (type === 'italic') {
      formatted = `*${selected || 'italic text'}*`
    } else if (type === 'superscript') {
      formatted = `^${selected || 'x^2'}^`
    } else if (type === 'link') {
      const url = window.prompt('Enter URL')
      if (!url) return
      const label = selected || 'link text'
      formatted = `[${label}](${url})`
    }

    const next = before + formatted + after
    setContent(next)
    setValue('content', next, { shouldValidate: true })

    // Restore cursor
    requestAnimationFrame(() => {
      const pos = before.length + formatted.length
      textarea.setSelectionRange(pos, pos)
      textarea.focus()
    })
  }

  const handleContentChange = (e) => {
    const value = e.target.value
    setContent(value)
    setValue('content', value, { shouldValidate: true })
  }

  const handleContentKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        applyFormat('bold')
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        applyFormat('italic')
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setPostType('text')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              postType === 'text'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => setPostType('image')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              postType === 'image'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Images & Video
          </button>
          <button
            type="button"
            onClick={() => setPostType('link')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              postType === 'link'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Link
          </button>
          <button
            type="button"
            onClick={() => setPostType('poll')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              postType === 'poll'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Poll
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* Category Selector */}
          <div className="mb-4">
            <select
              {...register('category', { required: 'Category is required' })}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-full bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Title Field */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                {...register('title', { 
                  required: 'Title is required',
                  maxLength: { value: maxTitleLength, message: `Title must be less than ${maxTitleLength} characters` }
                })}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Title"
                maxLength={maxTitleLength}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {titleLength}/{maxTitleLength}
              </div>
            </div>
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Content Area */}
          {postType === 'text' && (
            <div className="mb-4">
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-3 py-2 border border-b-0 border-gray-300 rounded-t-lg bg-gray-50">
                <button
                  type="button"
                  onClick={() => applyFormat('bold')}
                  className="px-2 py-1 text-sm font-semibold rounded hover:bg-gray-200"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('italic')}
                  className="px-2 py-1 text-sm italic rounded hover:bg-gray-200"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('superscript')}
                  className="px-2 py-1 text-sm rounded hover:bg-gray-200"
                >
                  X²
                </button>
                <span className="h-5 w-px bg-gray-300 mx-1" />
                <button
                  type="button"
                  onClick={() => applyFormat('link')}
                  className="px-2 py-1 text-sm rounded hover:bg-gray-200"
                >
                  Link
                </button>
                <span className="h-5 w-px bg-gray-300 mx-1" />
                <button
                  type="button"
                  onClick={triggerImageSelect}
                  className="px-2 py-1 text-sm rounded hover:bg-gray-200"
                >
                  Image
                </button>
                <button
                  type="button"
                  onClick={triggerVideoSelect}
                  className="px-2 py-1 text-sm rounded hover:bg-gray-200"
                >
                  Video
                </button>
              </div>

              <div className="border border-gray-300 rounded-b-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <textarea
                  ref={textareaRef}
                  {...register('content', { 
                    validate: (value) => {
                      if (postType !== 'text') return true
                      if ((value || '').trim().length === 0) {
                        return 'Content is required'
                      }
                      if (value.length > 10000) {
                        return 'Content must be less than 10000 characters'
                      }
                      return true
                    }
                  })}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleContentKeyDown}
                  className="w-full px-4 py-3 text-base resize-none focus:outline-none min-h-[200px]"
                  rows="8"
                  placeholder="Body text (optional)"
                />
              </div>
              {errors.content && (
                <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>
              )}
            </div>
          )}

          {/* Hidden media input reused by Text + Images & Video */}
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="hidden"
          />

          {/* Images & Video tab content: only drag & drop / upload */}
          {postType === 'image' && (
            <div className="mb-4">
              <div
                className="flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
                onClick={triggerMediaSelect}
              >
                <p className="text-sm text-gray-700 font-medium mb-1">
                  Drag and Drop or upload media
                </p>
                <p className="text-xs text-gray-500">
                  Images (JPG, PNG, GIF) or Videos (MP4, MOV)
                </p>
              </div>

              {mediaPreview && (
                <div className="mt-4">
                  {mediaType === 'video' ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full max-h-96 rounded-md border border-gray-200"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      className="max-w-full h-auto max-h-96 object-contain rounded-md border border-gray-200"
                      alt="preview"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* If user inserts media while on Text tab, still show preview */}
          {postType === 'text' && mediaPreview && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">Attached media:</p>
              {mediaType === 'video' ? (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full max-h-96 rounded-md border border-gray-200"
                />
              ) : (
                <img
                  src={mediaPreview}
                  className="max-w-full h-auto max-h-96 object-contain rounded-md border border-gray-200"
                  alt="preview"
                />
              )}
            </div>
          )}

          {/* Link Input */}
          {postType === 'link' && (
            <div className="mb-4">
              <input
                type="url"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Link URL"
              />
            </div>
          )}

          {/* Poll Placeholder */}
          {postType === 'poll' && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Creating a poll?</p>
                  <p className="text-sm text-gray-600">
                    Poll functionality is coming soon. For now, please use the Text option to create your post.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost
