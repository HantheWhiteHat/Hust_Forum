import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Send, ArrowLeft, MessageCircle, Search } from 'lucide-react'
import { useAuth } from '../store/authContext'
import { getSocket } from '../api/socket'
import api from '../api/api'

const Chat = () => {
    const { user } = useAuth()
    const { conversationId: urlConversationId } = useParams()
    const navigate = useNavigate()

    const [conversations, setConversations] = useState([])
    const [activeConversation, setActiveConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sendingMessage, setSendingMessage] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const BASE_URL = apiUrl.replace(/\/api\/?$/, '')

    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await api.get('/chat/conversations')
                setConversations(response.data.conversations || [])
            } catch (error) {
                console.error('Error fetching conversations:', error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchConversations()
        }
    }, [user])

    // Handle URL conversation ID
    useEffect(() => {
        if (urlConversationId && conversations.length > 0) {
            const conv = conversations.find(c => c._id === urlConversationId)
            if (conv) {
                setActiveConversation(conv)
            }
        }
    }, [urlConversationId, conversations])

    // Fetch messages when active conversation changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (!activeConversation) return

            try {
                const response = await api.get(`/chat/conversations/${activeConversation._id}/messages`)
                setMessages(response.data.messages || [])
            } catch (error) {
                console.error('Error fetching messages:', error)
            }
        }

        fetchMessages()
    }, [activeConversation])

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Socket events for real-time messages
    useEffect(() => {
        if (!user) return

        const socket = getSocket()

        const handleNewMessage = (data) => {
            if (data.conversation === activeConversation?._id) {
                setMessages(prev => [...prev, data.message])
            }
            // Update conversation list
            setConversations(prev => {
                const updated = prev.map(conv => {
                    if (conv._id === data.conversation) {
                        return { ...conv, lastMessage: data.message, updatedAt: new Date() }
                    }
                    return conv
                })
                return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            })
        }

        socket.on('message:new', handleNewMessage)

        return () => {
            socket.off('message:new', handleNewMessage)
        }
    }, [user, activeConversation])

    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !activeConversation || sendingMessage) return

        setSendingMessage(true)
        try {
            const response = await api.post(
                `/chat/conversations/${activeConversation._id}/messages`,
                { content: newMessage }
            )

            setMessages(prev => [...prev, response.data.message])
            setNewMessage('')

            // Update conversation's last message
            setConversations(prev => prev.map(conv => {
                if (conv._id === activeConversation._id) {
                    return { ...conv, lastMessage: response.data.message, updatedAt: new Date() }
                }
                return conv
            }))
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setSendingMessage(false)
            inputRef.current?.focus()
        }
    }

    // Get other participant in conversation
    const getOtherParticipant = (conversation) => {
        return conversation.participants?.find(p => p._id !== user?._id)
    }

    // Format time
    const formatTime = (date) => {
        const d = new Date(date)
        const now = new Date()
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
            return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        } else if (diffDays === 1) {
            return 'Yesterday'
        } else if (diffDays < 7) {
            return d.toLocaleDateString('vi-VN', { weekday: 'short' })
        }
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    }

    // Filter conversations by search
    const filteredConversations = conversations.filter(conv => {
        const other = getOtherParticipant(conv)
        return other?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    })

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
                <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl text-white mb-4">Please log in to view messages</h2>
                    <Link to="/login" className="text-[#FF4500] hover:underline">Log In</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0B0B0C] pt-2">
            <div className="max-w-6xl mx-auto px-4">
                <div className="bg-[#1A1A1B] rounded-lg border border-gray-800 overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
                    <div className="flex h-full">
                        {/* Conversation List */}
                        <div className={`w-full md:w-80 border-r border-gray-700 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-700">
                                <h2 className="text-lg font-bold text-white mb-3">Messages</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search conversations..."
                                        className="w-full pl-10 pr-4 py-2 bg-[#272729] text-white text-sm rounded-full border border-gray-700 focus:border-[#FF4500] focus:outline-none placeholder-gray-500"
                                    />
                                </div>
                            </div>

                            {/* Conversation List */}
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 text-center text-gray-400">Loading...</div>
                                ) : filteredConversations.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                        <p>No conversations yet</p>
                                        <p className="text-sm mt-1">Start a chat from someone's profile!</p>
                                    </div>
                                ) : (
                                    filteredConversations.map(conv => {
                                        const other = getOtherParticipant(conv)
                                        const isActive = activeConversation?._id === conv._id

                                        return (
                                            <button
                                                key={conv._id}
                                                onClick={() => {
                                                    setActiveConversation(conv)
                                                    navigate(`/chat/${conv._id}`)
                                                }}
                                                className={`w-full p-3 flex items-center gap-3 hover:bg-[#272729] transition text-left border-b border-gray-800 ${isActive ? 'bg-[#272729]' : ''}`}
                                            >
                                                {other?.avatar ? (
                                                    <img
                                                        src={`${BASE_URL}${other.avatar}`}
                                                        alt=""
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-[#FF4500] flex items-center justify-center text-white font-bold">
                                                        {other?.username?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-white">{other?.username || 'Unknown'}</span>
                                                        {conv.lastMessage && (
                                                            <span className="text-xs text-gray-500">
                                                                {formatTime(conv.lastMessage.createdAt || conv.updatedAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {conv.lastMessage && (
                                                        <p className="text-sm text-gray-400 truncate">
                                                            {conv.lastMessage.sender === user._id ? 'You: ' : ''}
                                                            {conv.lastMessage.content}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Message Area */}
                        <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
                            {activeConversation ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-700 flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setActiveConversation(null)
                                                navigate('/chat')
                                            }}
                                            className="md:hidden p-2 hover:bg-gray-800 rounded-full transition"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                                        </button>

                                        {(() => {
                                            const other = getOtherParticipant(activeConversation)
                                            return (
                                                <>
                                                    {other?.avatar ? (
                                                        <img
                                                            src={`${BASE_URL}${other.avatar}`}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-[#FF4500] flex items-center justify-center text-white font-bold">
                                                            {other?.username?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                    <Link
                                                        to={`/profile/${other?._id}`}
                                                        className="font-medium text-white hover:underline"
                                                    >
                                                        {other?.username || 'Unknown'}
                                                    </Link>
                                                </>
                                            )
                                        })()}
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.map((msg, index) => {
                                            const isOwn = msg.sender?._id === user._id || msg.sender === user._id

                                            return (
                                                <div
                                                    key={msg._id || index}
                                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwn
                                                                ? 'bg-[#FF4500] text-white rounded-br-md'
                                                                : 'bg-[#272729] text-white rounded-bl-md'
                                                            }`}
                                                    >
                                                        <p className="text-sm break-words">{msg.content}</p>
                                                        <p className={`text-xs mt-1 ${isOwn ? 'text-orange-200' : 'text-gray-500'}`}>
                                                            {formatTime(msg.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                                        <div className="flex gap-2">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1 px-4 py-2 bg-[#272729] text-white rounded-full border border-gray-700 focus:border-[#FF4500] focus:outline-none placeholder-gray-500"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim() || sendingMessage}
                                                className="p-3 bg-[#FF4500] text-white rounded-full hover:bg-[#FF5722] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                        <h3 className="text-lg font-medium text-white mb-2">Your Messages</h3>
                                        <p>Select a conversation to start chatting</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Chat
