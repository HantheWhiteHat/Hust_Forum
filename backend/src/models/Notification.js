const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'reply', 'message', 'follow'],
        required: true
    },
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post'
    },
    comment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Comment'
    },
    message: {
        type: String,
        maxlength: 200
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-populate sender info
notificationSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'sender',
        select: 'username avatar'
    });
    next();
});

module.exports = mongoose.model('Notification', notificationSchema);
