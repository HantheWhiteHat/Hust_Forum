const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth')
const {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
    getUnreadCount
} = require('../controllers/chatController')

// All routes require authentication
router.use(protect)

// Get all conversations
router.get('/conversations', getConversations)

// Get or create conversation with a user
router.get('/conversations/user/:userId', getOrCreateConversation)

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', getMessages)

// Send message to a conversation
router.post('/conversations/:conversationId/messages', sendMessage)

// Get unread message count
router.get('/unread-count', getUnreadCount)

module.exports = router
