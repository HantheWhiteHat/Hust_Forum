import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Bold, Italic, Image as ImageIcon, Video, X } from 'lucide-react'
import api from '../api/api'

const CreatePost = () => {
    const [loading, setLoading] = useState(false)
    const [mediaFiles, setMediaFiles] = useState([]) // Store actual files

    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors }, watch } = useForm()
    const editorRef = useRef(null)

    const titleValue = watch('title') || ''
    const titleLength = titleValue.length
    const maxTitleLength = 300

    // Make editor editable on mount
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.contentEditable = true
            editorRef.current.focus()
        }
    }, [])

    // Apply formatting (WYSIWYG)
    const applyFormat = (command) => {
        document.execCommand(command, false, null)
        editorRef.current.focus()
    }

    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
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

    // Insert media at cursor position
    const insertMediaAtCursor = (type) => {
        // 🔧 FIX: Focus editor first to prevent duplicate when cursor in caption
        if (editorRef.current) {
            editorRef.current.focus()
            // Small delay to ensure focus is set
            setTimeout(() => {
                openFileDialog(type)
            }, 50)
        }
    }

    const openFileDialog = (type) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = type === 'image' ? 'image/*' : 'video/*'
        input.multiple = true

        input.onchange = async (e) => {
            const files = Array.from(e.target.files)

            files.forEach((file) => {
                const mediaId = `media-${Date.now()}-${Math.random()}`
                const preview = URL.createObjectURL(file)

                // Store file reference
                setMediaFiles(prev => [...prev, { id: mediaId, file, type }])

                // Create media container
                const container = document.createElement('div')
                container.className = 'media-block my-3 border border-gray-300 rounded overflow-hidden bg-gray-50'
                container.setAttribute('data-media-id', mediaId)
                container.contentEditable = false

                // Create media element
                const mediaWrapper = document.createElement('div')
                mediaWrapper.className = 'relative'

                let mediaElement
                if (type === 'image') {
                    mediaElement = document.createElement('img')
                    mediaElement.src = preview
                    mediaElement.className = 'w-full max-h-96 object-contain bg-black'
                } else {
                    mediaElement = document.createElement('video')
                    mediaElement.src = preview
                    mediaElement.className = 'w-full max-h-96 object-contain bg-black'
                    mediaElement.controls = true
                }

                // Create remove button
                const removeBtn = document.createElement('button')
                removeBtn.innerHTML = '×'
                removeBtn.className = 'absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-black/90 text-white rounded-full text-xl leading-none'
                removeBtn.onclick = (e) => {
                    e.preventDefault()
                    container.remove()
                    setMediaFiles(prev => prev.filter(m => m.id !== mediaId))
                }

                mediaWrapper.appendChild(mediaElement)
                mediaWrapper.appendChild(removeBtn)

                // Create caption input (PLAIN TEXT ONLY)
                const captionWrapper = document.createElement('div')
                captionWrapper.className = 'p-2'

                const captionInput = document.createElement('input')
                captionInput.type = 'text'
                captionInput.placeholder = 'Add a caption (optional)'
                captionInput.className = 'w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-orange-500'
                captionInput.setAttribute('data-caption-for', mediaId)
                // Prevent any formatting or special input
                captionInput.setAttribute('autocomplete', 'off')
                captionInput.setAttribute('spellcheck', 'false')
                // Stop event propagation to prevent editor commands
                captionInput.addEventListener('keydown', (e) => {
                    e.stopPropagation() // Prevent Ctrl+B, Ctrl+I from reaching editor
                })
                captionInput.addEventListener('paste', (e) => {
                    e.preventDefault()
                    // Only paste plain text
                    const text = e.clipboardData.getData('text/plain')
                    captionInput.value = text.substring(0, 200) // Max 200 chars
                })

                captionWrapper.appendChild(captionInput)

                container.appendChild(mediaWrapper)
                container.appendChild(captionWrapper)

                // ✅ FIX: Always insert into editor, not at random cursor position
                // This prevents inserting between title/category fields
                if (!editorRef.current) return

                // Check if cursor is inside editor
                const selection = window.getSelection()
                let insertIntoEditor = false

                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0)
                    const container = range.commonAncestorContainer

                    // Check if selection is inside editor or its descendants
                    let node = container
                    while (node && node !== document.body) {
                        if (node === editorRef.current) {
                            insertIntoEditor = true
                            break
                        }
                        node = node.parentNode
                    }
                }

                if (insertIntoEditor) {
                    // Insert at cursor position if cursor is in editor
                    const range = selection.getRangeAt(0)
                    range.deleteContents()
                    range.insertNode(container)

                    // Move cursor after media
                    const newRange = document.createRange()
                    newRange.setStartAfter(container)
                    newRange.collapse(true)
                    selection.removeAllRanges()
                    selection.addRange(newRange)
                } else {
                    // Otherwise append to end of editor
                    editorRef.current.appendChild(container)
                }

                // Add line break after media for better editing
                const br = document.createElement('br')
                editorRef.current.appendChild(br)
            })

            editorRef.current.focus()
        }

        input.click()
    }

    const onSubmit = async (data) => {
        try {
            setLoading(true)

            // Get HTML content from editor and CLEAN it
            const rawHTML = editorRef.current.innerHTML

            // 🧹 CLEAN: Remove caption input elements before saving
            const cleanHTMLContent = (html) => {
                const tempDiv = document.createElement('div')
                tempDiv.innerHTML = html

                // Remove all caption input wrappers
                const captionWrappers = tempDiv.querySelectorAll('.media-block .p-2')
                captionWrappers.forEach(wrapper => {
                    // Check if it contains caption input
                    const captionInput = wrapper.querySelector('[data-caption-for]')
                    if (captionInput) {
                        wrapper.remove() // Remove the entire wrapper
                    }
                })

                return tempDiv.innerHTML
            }

            const htmlContent = cleanHTMLContent(rawHTML)

            const formData = new FormData()
            formData.append('title', data.title)
            formData.append('category', data.category)
            formData.append('content', htmlContent) // Store CLEANED HTML

            // ✅ NEW: Send ALL media files (not just first one)
            if (mediaFiles.length > 0) {
                // Append all media files with same field name 'media'
                mediaFiles.forEach((media) => {
                    formData.append('media', media.file)
                })

                // Send captions as array in order
                // 🔧 FIX: Query from editorRef instead of document
                const captionsArray = mediaFiles.map(media => {
                    const captionInput = editorRef.current.querySelector(`[data-caption-for="${media.id}"]`)
                    return captionInput ? captionInput.value : ''
                })
                formData.append('captions', JSON.stringify(captionsArray))
            }

            const token = localStorage.getItem('token')

            const response = await api.post('/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            })

            toast.success('Post created successfully!')
            navigate(`/post/${response.data._id}`)
        } catch (error) {
            console.error('Create post error:', error)
            toast.error(error.response?.data?.message || 'Failed to create post')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#DAE0E6] py-6">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded border border-gray-300">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-300">
                        <h1 className="text-lg font-medium text-gray-900">Create a post</h1>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                        {/* Category */}
                        <div className="mb-4">
                            <select
                                {...register('category', { required: 'Choose a community' })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-[#FF4500] cursor-pointer"
                            >
                                <option value="">Choose a community</option>
                                <option value="general">r/general</option>
                                <option value="academic">r/academic</option>
                                <option value="technology">r/technology</option>
                                <option value="sports">r/sports</option>
                                <option value="entertainment">r/entertainment</option>
                                <option value="other">r/other</option>
                            </select>
                            {errors.category && (
                                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
                            )}
                        </div>

                        {/* Title */}
                        <div className="mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    {...register('title', {
                                        required: 'Title is required',
                                        maxLength: { value: maxTitleLength, message: `Max ${maxTitleLength} characters` }
                                    })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-[#FF4500]"
                                    placeholder="Title"
                                    maxLength={maxTitleLength}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                    {titleLength}/{maxTitleLength}
                                </span>
                            </div>
                            {errors.title && (
                                <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                            )}
                        </div>

                        {/* WYSIWYG Editor */}
                        <div className="mb-4">
                            {/* Toolbar */}
                            <div className="flex items-center gap-1 p-2 border border-b-0 border-gray-300 bg-gray-50 rounded-t">
                                <button
                                    type="button"
                                    onClick={() => applyFormat('bold')}
                                    className="p-2 hover:bg-gray-200 rounded transition"
                                    title="Bold (Ctrl+B)"
                                >
                                    <Bold className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat('italic')}
                                    className="p-2 hover:bg-gray-200 rounded transition"
                                    title="Italic (Ctrl+I)"
                                >
                                    <Italic className="w-4 h-4 text-gray-700" />
                                </button>
                                <div className="w-px h-5 bg-gray-300 mx-1" />
                                <button
                                    type="button"
                                    onClick={() => insertMediaAtCursor('image')}
                                    className="p-2 hover:bg-gray-200 rounded transition"
                                    title="Insert image"
                                >
                                    <ImageIcon className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertMediaAtCursor('video')}
                                    className="p-2 hover:bg-gray-200 rounded transition"
                                    title="Insert video"
                                >
                                    <Video className="w-4 h-4 text-gray-700" />
                                </button>
                            </div>

                            {/* Content Editor (ContentEditable) */}
                            <div
                                ref={editorRef}
                                onKeyDown={handleKeyDown}
                                className="editor-content w-full px-3 py-3 text-sm border border-gray-300 rounded-b focus:outline-none focus:ring-2 focus:ring-[#FF4500] min-h-[300px] bg-white"
                                data-placeholder="Text (optional)"
                            />

                            <p className="text-xs text-gray-500 mt-1">
                                Format text with Bold/Italic • Insert media at cursor position • Press Ctrl+B for bold, Ctrl+I for italic
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="px-6 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 text-sm font-bold text-white bg-[#FF4500] rounded-full hover:bg-[#FF5722] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* CSS for editor */}
            <style>{`
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
        
        .editor-content:focus {
          outline: none;
        }

        .editor-content b, .editor-content strong {
          font-weight: bold;
        }

        .editor-content i, .editor-content em {
          font-style: italic;
        }

        .media-block {
          user-select: none;
        }

        .media-block input {
          user-select: text;
        }
      `}</style>
        </div>
    )
}

export default CreatePost
