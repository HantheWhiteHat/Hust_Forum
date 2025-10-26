const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
    maxlength: [10000, 'Content cannot be more than 10000 characters']
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['general', 'academic', 'technology', 'sports', 'entertainment', 'other'],
    default: 'general'
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  commentCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for text search
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Index for sorting
postSchema.index({ createdAt: -1 });
postSchema.index({ upvotes: -1 });
postSchema.index({ views: -1 });

module.exports = mongoose.model('Post', postSchema);

