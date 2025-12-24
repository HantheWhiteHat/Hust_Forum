const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, {
    timestamps: true
})

// Index for finding conversations by participants
conversationSchema.index({ participants: 1 })
conversationSchema.index({ updatedAt: -1 })

// Static method to find conversation between two users
conversationSchema.statics.findBetweenUsers = async function (userId1, userId2) {
    return this.findOne({
        participants: { $all: [userId1, userId2], $size: 2 }
    })
}

module.exports = mongoose.model('Conversation', conversationSchema)
