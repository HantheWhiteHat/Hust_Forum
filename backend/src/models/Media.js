const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    filename: {
        type: String,
        required: true
    },
    filepath: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    caption: {
        type: String,
        maxlength: 500,
        default: ''
    },
    order: {
        type: Number,
        default: 0
    },
    dimensions: {
        width: Number,
        height: Number
    },
    duration: Number, // For videos (in seconds)
    thumbnail: String, // Thumbnail path for videos
    uploadedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
mediaSchema.index({ post: 1, order: 1 }); // Get media for a post in order
mediaSchema.index({ uploadedBy: 1, createdAt: -1 }); // User's uploads
mediaSchema.index({ mediaType: 1 }); // Filter by type

module.exports = mongoose.model('Media', mediaSchema);
