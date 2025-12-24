const Vote = require('../models/Vote');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { getIO } = require('../socket');
const { createNotification } = require('./notificationController');

// Helper function to emit socket events safely
const emitSocketEvent = (eventName, payload, roomName = null) => {
  try {
    const io = getIO();
    if (roomName) {
      io.to(roomName).emit(eventName, payload);
    }
    io.emit(eventName, payload);
  } catch (emitError) {
    console.error(`Socket emit error (${eventName}):`, emitError.message);
  }
};

// @desc    Vote on post or comment (toggle vote)
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

    // If same vote exists, remove it (toggle off)
    if (existingVote && existingVote.type === type) {
      // Decrement the count
      const updateField = type === 'upvote' ? 'upvotes' : 'downvotes';

      if (postId) {
        const result = await Post.findByIdAndUpdate(
          postId,
          { $inc: { [updateField]: -1 } },
          { new: true }
        );
        await Vote.findByIdAndDelete(existingVote._id);

        emitSocketEvent('post:voted', {
          postId: postId.toString(),
          upvotes: result.upvotes,
          downvotes: result.downvotes,
        }, `post:${postId}`);

        return res.json({
          message: 'Vote removed',
          upvotes: result.upvotes,
          downvotes: result.downvotes,
          userVote: null
        });
      } else {
        const result = await Comment.findByIdAndUpdate(
          commentId,
          { $inc: { [updateField]: -1 } },
          { new: true }
        );
        await Vote.findByIdAndDelete(existingVote._id);

        emitSocketEvent('comment:voted', {
          postId: result.post.toString(),
          commentId: commentId.toString(),
          upvotes: result.upvotes,
          downvotes: result.downvotes,
        }, `post:${result.post.toString()}`);

        return res.json({
          message: 'Vote removed',
          upvotes: result.upvotes,
          downvotes: result.downvotes,
          userVote: null
        });
      }
    }

    // If opposite vote exists, switch it
    if (existingVote && existingVote.type !== type) {
      const oldType = existingVote.type;
      existingVote.type = type;
      await existingVote.save();

      // Update counts: decrement old, increment new
      const incUpdate = oldType === 'upvote'
        ? { upvotes: -1, downvotes: 1 }
        : { upvotes: 1, downvotes: -1 };

      if (postId) {
        const result = await Post.findByIdAndUpdate(
          postId,
          { $inc: incUpdate },
          { new: true }
        );

        emitSocketEvent('post:voted', {
          postId: postId.toString(),
          upvotes: result.upvotes,
          downvotes: result.downvotes,
        }, `post:${postId}`);

        return res.json({
          message: 'Vote changed',
          upvotes: result.upvotes,
          downvotes: result.downvotes,
          userVote: type
        });
      } else {
        const result = await Comment.findByIdAndUpdate(
          commentId,
          { $inc: incUpdate },
          { new: true }
        );

        emitSocketEvent('comment:voted', {
          postId: result.post.toString(),
          commentId: commentId.toString(),
          upvotes: result.upvotes,
          downvotes: result.downvotes,
        }, `post:${result.post.toString()}`);

        return res.json({
          message: 'Vote changed',
          upvotes: result.upvotes,
          downvotes: result.downvotes,
          userVote: type
        });
      }
    }

    // Create new vote
    const vote = await Vote.create({
      user: req.user.id,
      ...(postId ? { post: postId } : { comment: commentId }),
      type
    });

    // Increment the count
    const updateField = type === 'upvote' ? 'upvotes' : 'downvotes';

    if (postId) {
      const result = await Post.findByIdAndUpdate(
        postId,
        { $inc: { [updateField]: 1 } },
        { new: true }
      );
      if (!result) {
        await Vote.findByIdAndDelete(vote._id);
        return res.status(404).json({ message: 'Post not found' });
      }

      emitSocketEvent('post:voted', {
        postId: postId.toString(),
        upvotes: result.upvotes,
        downvotes: result.downvotes,
      }, `post:${postId}`);

      // Create notification for upvote only (not downvote)
      if (type === 'upvote' && result.author && result.author.toString() !== req.user.id) {
        await createNotification({
          recipient: result.author,
          sender: req.user.id,
          type: 'like',
          post: postId,
          message: `upvoted your post`
        });
      }

      return res.status(201).json({
        vote,
        upvotes: result.upvotes,
        downvotes: result.downvotes,
        userVote: type
      });
    } else {
      const result = await Comment.findByIdAndUpdate(
        commentId,
        { $inc: { [updateField]: 1 } },
        { new: true }
      );
      if (!result) {
        await Vote.findByIdAndDelete(vote._id);
        return res.status(404).json({ message: 'Comment not found' });
      }

      emitSocketEvent('comment:voted', {
        postId: result.post.toString(),
        commentId: commentId.toString(),
        upvotes: result.upvotes,
        downvotes: result.downvotes,
      }, `post:${result.post.toString()}`);

      return res.status(201).json({
        vote,
        upvotes: result.upvotes,
        downvotes: result.downvotes,
        userVote: type
      });
    }
  } catch (error) {
    console.error('createVote error:', error);
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

    // If type hasn't changed, no need to update
    if (oldType === type) {
      return res.json(vote);
    }

    vote.type = type;
    await vote.save();

    // Update counts
    const incUpdate = oldType === 'upvote'
      ? { upvotes: -1, downvotes: 1 }
      : { upvotes: 1, downvotes: -1 };

    if (vote.post) {
      const result = await Post.findByIdAndUpdate(
        vote.post,
        { $inc: incUpdate },
        { new: true }
      );

      emitSocketEvent('post:voted', {
        postId: vote.post.toString(),
        upvotes: result.upvotes,
        downvotes: result.downvotes,
      }, `post:${vote.post.toString()}`);
    } else if (vote.comment) {
      const result = await Comment.findByIdAndUpdate(
        vote.comment,
        { $inc: incUpdate },
        { new: true }
      );

      emitSocketEvent('comment:voted', {
        postId: result.post.toString(),
        commentId: vote.comment.toString(),
        upvotes: result.upvotes,
        downvotes: result.downvotes,
      }, `post:${result.post.toString()}`);
    }

    res.json(vote);
  } catch (error) {
    console.error('updateVote error:', error);
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

    // Decrement the appropriate counter
    const updateField = vote.type === 'upvote' ? 'upvotes' : 'downvotes';

    if (vote.post) {
      const result = await Post.findByIdAndUpdate(
        vote.post,
        { $inc: { [updateField]: -1 } },
        { new: true }
      );

      await Vote.findByIdAndDelete(req.params.id);

      emitSocketEvent('post:voted', {
        postId: vote.post.toString(),
        upvotes: result.upvotes,
        downvotes: result.downvotes,
      }, `post:${vote.post.toString()}`);
    } else if (vote.comment) {
      const result = await Comment.findByIdAndUpdate(
        vote.comment,
        { $inc: { [updateField]: -1 } },
        { new: true }
      );

      await Vote.findByIdAndDelete(req.params.id);

      emitSocketEvent('comment:voted', {
        postId: result.post.toString(),
        commentId: vote.comment.toString(),
        upvotes: result.upvotes,
        downvotes: result.downvotes,
      }, `post:${result.post.toString()}`);
    } else {
      await Vote.findByIdAndDelete(req.params.id);
    }

    res.json({ message: 'Vote deleted successfully' });
  } catch (error) {
    console.error('deleteVote error:', error);
    res.status(500).json({ message: error.message });
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
