const Vote = require('../models/Vote');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Vote on post or comment
// @route   POST /api/votes
// @access  Private
const createVote = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { postId, commentId, type } = req.body;

    // Validate that either postId or commentId is provided, but not both
    if ((postId && commentId) || (!postId && !commentId)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Must provide either postId or commentId, but not both' });
    }

    // Check if vote already exists
    const existingVote = await Vote.findOne({
      user: req.user.id,
      ...(postId ? { post: postId } : { comment: commentId })
    }).session(session);

    if (existingVote) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'You have already voted on this item' });
    }

    // Create vote
    const vote = await Vote.create([{
      user: req.user.id,
      ...(postId ? { post: postId } : { comment: commentId }),
      type
    }], { session });

    // OPTIMIZED: Use atomic $inc operations to prevent race conditions
    if (postId) {
      const updateField = type === 'upvote' ? 'upvotes' : 'downvotes';
      const result = await Post.findByIdAndUpdate(
        postId,
        { $inc: { [updateField]: 1 } },
        { session, new: true }
      );
      if (!result) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Post not found' });
      }
    } else {
      const updateField = type === 'upvote' ? 'upvotes' : 'downvotes';
      const result = await Comment.findByIdAndUpdate(
        commentId,
        { $inc: { [updateField]: 1 } },
        { session, new: true }
      );
      if (!result) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Comment not found' });
      }
    }

    await session.commitTransaction();
    res.status(201).json(vote[0]);
  } catch (error) {
    await session.abortTransaction();
    console.error('createVote error:', error);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Update vote
// @route   PUT /api/votes/:id
// @access  Private
const updateVote = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { type } = req.body;
    const vote = await Vote.findById(req.params.id).session(session);

    if (!vote) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Vote not found' });
    }

    // Check if user is the voter
    if (vote.user.toString() !== req.user.id) {
      await session.abortTransaction();
      return res.status(401).json({ message: 'Not authorized to update this vote' });
    }

    const oldType = vote.type;

    // If type hasn't changed, no need to update
    if (oldType === type) {
      await session.abortTransaction();
      return res.json(vote);
    }

    vote.type = type;
    await vote.save({ session });

    // OPTIMIZED: Use atomic $inc for both increment and decrement in one operation
    const incUpdate = oldType === 'upvote'
      ? { upvotes: -1, downvotes: 1 }
      : { upvotes: 1, downvotes: -1 };

    if (vote.post) {
      await Post.findByIdAndUpdate(vote.post, { $inc: incUpdate }, { session });
    } else if (vote.comment) {
      await Comment.findByIdAndUpdate(vote.comment, { $inc: incUpdate }, { session });
    }

    await session.commitTransaction();
    res.json(vote);
  } catch (error) {
    await session.abortTransaction();
    console.error('updateVote error:', error);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Delete vote
// @route   DELETE /api/votes/:id
// @access  Private
const deleteVote = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const vote = await Vote.findById(req.params.id).session(session);

    if (!vote) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Vote not found' });
    }

    // Check if user is the voter
    if (vote.user.toString() !== req.user.id) {
      await session.abortTransaction();
      return res.status(401).json({ message: 'Not authorized to delete this vote' });
    }

    // OPTIMIZED: Use atomic $inc to decrement the appropriate counter
    const updateField = vote.type === 'upvote' ? 'upvotes' : 'downvotes';

    if (vote.post) {
      await Post.findByIdAndUpdate(
        vote.post,
        { $inc: { [updateField]: -1 } },
        { session }
      );
    } else if (vote.comment) {
      await Comment.findByIdAndUpdate(
        vote.comment,
        { $inc: { [updateField]: -1 } },
        { session }
      );
    }

    await Vote.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    res.json({ message: 'Vote deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('deleteVote error:', error);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Get user's vote on a post or comment
// @route   GET /api/votes/check
// @access  Private
const checkVote = async (req, res) => {
  try {
    const { postId, commentId } = req.query;

    if (!postId && !commentId) {
      return res.status(400).json({ message: 'Must provide postId or commentId' });
    }

    const vote = await Vote.findOne({
      user: req.user.id,
      ...(postId ? { post: postId } : { comment: commentId })
    });

    res.json({ vote: vote || null });
  } catch (error) {
    console.error('checkVote error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVote,
  updateVote,
  deleteVote,
  checkVote
};
