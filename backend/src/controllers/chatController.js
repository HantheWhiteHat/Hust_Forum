const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const { createNotification } = require('./notificationController')

// Get all conversations for current user
exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
            .populate('participants', 'username avatar')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })

        res.json({ conversations })
    } catch (error) {
        console.error('Error fetching conversations:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Get or create conversation with a user
exports.getOrCreateConversation = async (req, res) => {
    try {
        const { userId } = req.params

        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot create conversation with yourself' })
        }

        // Check if conversation exists
        let conversation = await Conversation.findBetweenUsers(req.user._id, userId)

        if (!conversation) {
            // Create new conversation
            conversation = await Conversation.create({
                participants: [req.user._id, userId]
            })
        }

        // Populate participants
        await conversation.populate('participants', 'username avatar')
        await conversation.populate('lastMessage')

        res.json({ conversation })
    } catch (error) {
        console.error('Error getting/creating conversation:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Get messages for a conversation
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 50

        // Verify user is part of conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user._id
        })

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' })
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'username avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)

        // Mark messages as read
        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: req.user._id },
                isRead: false
            },
            { isRead: true }
        )

        res.json({
            messages: messages.reverse(), // Return in chronological order
            page,
            hasMore: messages.length === limit
        })
    } catch (error) {
        console.error('Error fetching messages:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params
        const { content } = req.body

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Message content is required' })
        }

        // Verify user is part of conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user._id
        })

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' })
        }

        // Create message
        const message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            content: content.trim()
        })

        // Update conversation's last message
        conversation.lastMessage = message._id
        await conversation.save()

        // Populate sender info
        await message.populate('sender', 'username avatar')

        // Find the other participant to send notification
        const recipientId = conversation.participants.find(
            p => p.toString() !== req.user._id.toString()
        )

        // Create notification for recipient
        if (recipientId) {
            await createNotification({
                recipient: recipientId,
                sender: req.user._id,
                type: 'message',
                message: `New message from ${req.user.username}`
            }, req.io)
        }

        // Emit socket event
        if (req.io) {
            req.io.to(`user:${recipientId}`).emit('message:new', {
                conversation: conversationId,
                message
            })
        }

        res.status(201).json({ message })
    } catch (error) {
        console.error('Error sending message:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        // Get all conversations for user
        const conversations = await Conversation.find({
            participants: req.user._id
        })

        const conversationIds = conversations.map(c => c._id)

        // Count unread messages
        const unreadCount = await Message.countDocuments({
            conversation: { $in: conversationIds },
            sender: { $ne: req.user._id },
            isRead: false
        })

        res.json({ unreadCount })
    } catch (error) {
        console.error('Error getting unread count:', error)
        res.status(500).json({ message: 'Server error' })
    }
}
