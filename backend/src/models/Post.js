const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [300, 'Title cannot be more than 300 characters'] // Increased from 200
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
    maxlength: [100000, 'Content cannot be more than 100000 characters']
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

  // Media references (NEW - replaces single image field)
  media: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Media'
  }],
  mediaCount: {
    type: Number,
    default: 0
  },

  // Interaction counters
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  netVotes: {
    type: Number,
    default: 0  // NEW: upvotes - downvotes (for easier sorting)
  },
  views: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },

  // Activity tracking
  lastActivityAt: {
    type: Date,
    default: Date.now  // NEW: For "hot" post sorting
  },

  // Flags
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false  // NEW: Soft delete
  },
  deletedAt: {
    type: Date
  },

  // Legacy fields (keep for backward compatibility during migration)
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  image: {
    type: String,
    default: null
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', null],
    default: null
  }
}, {
  timestamps: true
});

// Middleware to update netVotes before save
postSchema.pre('save', function (next) {
  this.netVotes = this.upvotes - this.downvotes;
  next();
});

// Text search index
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Compound indexes for common queries (NEW - PERFORMANCE OPTIMIZATION)
postSchema.index({ category: 1, createdAt: -1 }); // Filter by category + sort by newest
postSchema.index({ category: 1, netVotes: -1 }); // Filter by category + sort by popular
postSchema.index({ category: 1, views: -1 }); // Filter by category + sort by views
postSchema.index({ author: 1, createdAt: -1 }); // User's posts
postSchema.index({ isPinned: -1, createdAt: -1 }); // Pinned posts first
postSchema.index({ lastActivityAt: -1 }); // Hot posts (recent activity)
postSchema.index({ isDeleted: 1, createdAt: -1 }); // Exclude deleted posts

// Simple indexes for sorting
postSchema.index({ createdAt: -1 });
postSchema.index({ upvotes: -1 });
postSchema.index({ views: -1 });
postSchema.index({ netVotes: -1 });

module.exports = mongoose.model('Post', postSchema);


