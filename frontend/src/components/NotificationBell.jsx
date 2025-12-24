import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/api'
import { getSocket } from '../api/socket'
import { useAuth } from '../store/authContext'

const NotificationBell = () => {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef(null)

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const BASE_URL = apiUrl.replace(/\/api\/?$/, '')

    // Fetch notifications
    const fetchNotifications = async () => {
        if (!user) return
        try {
            setLoading(true)
            const response = await api.get('/notifications?limit=10')
            setNotifications(response.data.notifications || [])
            setUnreadCount(response.data.unreadCount || 0)
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    // Listen for real-time notifications
    useEffect(() => {
        if (!user) return

        fetchNotifications()

        const socket = getSocket()

        const handleNewNotification = (notification) => {
            setNotifications(prev => [notification, ...prev.slice(0, 9)])
            setUnreadCount(prev => prev + 1)
        }

        socket.on('notification:new', handleNewNotification)

        return () => {
            socket.off('notification:new', handleNewNotification)
        }
    }, [user])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`)
            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all')
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    // Get notification icon and text based on type
    const getNotificationContent = (notification) => {
        const sender = notification.sender?.username || 'Someone'
        switch (notification.type) {
            case 'like':
                return `${sender} upvoted your post`
            case 'comment':
                return `${sender} commented on your post`
            case 'reply':
                return `${sender} replied to your comment`
            case 'message':
                return `${sender} sent you a message`
            default:
                return notification.message || 'New notification'
        }
    }

    // Time ago helper
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000)
        if (seconds < 60) return 'just now'
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    if (!user) return null

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen)
                    if (!isOpen) fetchNotifications()
                }}
                className="relative p-2 rounded-full hover:bg-gray-800 transition"
            >
                <Bell className="w-5 h-5 text-gray-400 hover:text-white" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1A1A1B] rounded-lg shadow-lg border border-gray-700 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-[#272729] border-b border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-[#FF4500] hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <Link
                                    key={notification._id}
                                    to={notification.post ? `/post/${notification.post._id || notification.post}` : '#'}
                                    onClick={() => {
                                        if (!notification.isRead) markAsRead(notification._id)
                                        setIsOpen(false)
                                    }}
                                    className={`block px-4 py-3 border-b border-gray-700 hover:bg-[#272729] transition ${!notification.isRead ? 'bg-[#2a2a2b]' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        {notification.sender?.avatar ? (
                                            <img
                                                src={`${BASE_URL}${notification.sender.avatar}`}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-[#FF4500] flex items-center justify-center text-white font-bold">
                                                {notification.sender?.username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-200">
                                                {getNotificationContent(notification)}
                                            </p>
                                            {notification.post?.title && (
                                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                                    "{notification.post.title}"
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {timeAgo(notification.createdAt)}
                                            </p>
                                        </div>

                                        {/* Unread indicator */}
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 bg-[#FF4500] rounded-full mt-2"></div>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationBell
