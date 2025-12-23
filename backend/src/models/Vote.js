const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
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
  type: {
    type: String,
    enum: ['upvote', 'downvote'],
    required: true
  }
}, {
  timestamps: true
});

// Ensure user can only vote once per post/comment
// Use partialFilterExpression instead of sparse to properly exclude null values
voteSchema.index(
  { user: 1, post: 1 },
  { unique: true, partialFilterExpression: { post: { $exists: true, $ne: null } } }
);
voteSchema.index(
  { user: 1, comment: 1 },
  { unique: true, partialFilterExpression: { comment: { $exists: true, $ne: null } } }
);

// Ensure either post or comment is provided, but not both
voteSchema.pre('save', function (next) {
  if ((this.post && this.comment) || (!this.post && !this.comment)) {
    next(new Error('Vote must be associated with either a post or comment, but not both'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Vote', voteSchema);

