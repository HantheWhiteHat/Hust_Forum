const Vote = require('../models/Vote');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// @desc    Vote on post or comment
// @route   POST /api/votes
// @access  Private
const createVote = async (req, res) => {
  try {
    const { postId, commentId, type } = req.body;

    // Validate that either postId or commentId is provided, but not both
    if ((postId && commentId) || (!postId && !commentId)) {
      return res.status(400).json({ message: 'Must provide either postId or commentId, but not both' });
    }

    // Check if vote already exists
    const existingVote = await Vote.findOne({
      user: req.user.id,
      ...(postId ? { post: postId } : { comment: commentId })
    });

    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted on this item' });
    }

    // Create vote
    const vote = await Vote.create({
      user: req.user.id,
      ...(postId ? { post: postId } : { comment: commentId }),
      type
    });

    // Update vote count on post or comment
    if (postId) {
      const post = await Post.findById(postId);
      if (post) {
        if (type === 'upvote') {
          post.upvotes += 1;
        } else {
          post.downvotes += 1;
        }
        await post.save();
      }
    } else {
      const comment = await Comment.findById(commentId);
      if (comment) {
        if (type === 'upvote') {
          comment.upvotes += 1;
        } else {
          comment.downvotes += 1;
        }
        await comment.save();
      }
    }

    res.status(201).json(vote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update vote
// @route   PUT /api/votes/:id
// @access  Private
const updateVote = async (req, res) => {
  try {
    const { type } = req.body;
    const vote = await Vote.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({ message: 'Vote not found' });
    }

    // Check if user is the voter
    if (vote.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this vote' });
    }

    const oldType = vote.type;
    vote.type = type;
    await vote.save();

    // Update vote count on post or comment
    if (vote.post) {
      const post = await Post.findById(vote.post);
      if (post) {
        if (oldType === 'upvote' && type === 'downvote') {
          post.upvotes -= 1;
          post.downvotes += 1;
        } else if (oldType === 'downvote' && type === 'upvote') {
          post.downvotes -= 1;
          post.upvotes += 1;
        }
        await post.save();
      }
    } else if (vote.comment) {
      const comment = await Comment.findById(vote.comment);
      if (comment) {
        if (oldType === 'upvote' && type === 'downvote') {
          comment.upvotes -= 1;
          comment.downvotes += 1;
        } else if (oldType === 'downvote' && type === 'upvote') {
          comment.downvotes -= 1;
          comment.upvotes += 1;
        }
        await comment.save();
      }
    }

    res.json(vote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete vote
// @route   DELETE /api/votes/:id
// @access  Private
const deleteVote = async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({ message: 'Vote not found' });
    }

    // Check if user is the voter
    if (vote.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this vote' });
    }

    // Update vote count on post or comment
    if (vote.post) {
      const post = await Post.findById(vote.post);
      if (post) {
        if (vote.type === 'upvote') {
          post.upvotes -= 1;
        } else {
          post.downvotes -= 1;
        }
        await post.save();
      }
    } else if (vote.comment) {
      const comment = await Comment.findById(vote.comment);
      if (comment) {
        if (vote.type === 'upvote') {
          comment.upvotes -= 1;
        } else {
          comment.downvotes -= 1;
        }
        await comment.save();
      }
    }

    await Vote.findByIdAndDelete(req.params.id);

    res.json({ message: 'Vote deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVote,
  updateVote,
  deleteVote,
};

