const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please add content'],
    maxlength: [5000, 'Content cannot be more than 5000 characters'] // Increased from 2000
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
    default: null
  },

  // Thread tracking (NEW)
  depth: {
    type: Number,
    default: 0,  // 0 = top-level comment
    max: 5       // Limit nesting to 5 levels
  },
  path: {
    type: String,
    default: '001'  // e.g., "001.003.002" for ordering
  },
  replyCount: {
    type: Number,
    default: 0  // Cache number of direct replies
  },

  // Interactions
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
    default: 0  // NEW: upvotes - downvotes
  },

  // Status
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false  // NEW: Soft delete
  },
  deletedAt: {
    type: Date
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware to update netVotes before save
commentSchema.pre('save', function (next) {
  this.netVotes = this.upvotes - this.downvotes;
  next();
});

// Virtual field for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
});

// Compound indexes for efficient queries (NEW - PERFORMANCE OPTIMIZATION)
commentSchema.index({ post: 1, depth: 1, path: 1 }); // Threaded comment ordering
commentSchema.index({ post: 1, createdAt: 1 }); // Chronological per post
commentSchema.index({ parentComment: 1, createdAt: 1 }); // Replies for a comment
commentSchema.index({ author: 1, createdAt: -1 }); // User's comments
commentSchema.index({ post: 1, isDeleted: 1 }); // Exclude deleted comments

module.exports = mongoose.model('Comment', commentSchema);


