const Comment = require('../models/Comment');
const Post = require('../models/Post');
const mongoose = require('mongoose');
const { getIO } = require('../socket');
const { createNotification } = require('./notificationController');

// Optimized: Use aggregation instead of recursive N+1 queries
const buildCommentTree = (comments, parentId = null) => {
  const result = [];
  for (const comment of comments) {
    const parentCommentId = comment.parentComment ? comment.parentComment.toString() : null;
    if (parentCommentId === (parentId ? parentId.toString() : null)) {
      const children = buildCommentTree(comments, comment._id);
      result.push({
        ...comment,
        replies: children
      });
    }
  }
  return result;
};

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validation already done by middleware, but keep as safety check
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID format" });
    }

    // OPTIMIZED: Fetch all comments in ONE query, then build tree in memory
    const allComments = await Comment.find({
      post: new mongoose.Types.ObjectId(postId),
      isDeleted: { $ne: true }
    })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 })
      .lean(); // Use lean() for better performance

    // Build comment tree in memory (much faster than N+1 queries)
    const commentTree = buildCommentTree(allComments, null);

    // Apply pagination to top-level comments only
    const paginatedComments = commentTree.slice((page - 1) * limit, page * limit);
    const total = commentTree.length;

    res.json({
      comments: paginatedComments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new comment
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if post is locked
    if (post.isLocked) {
      return res.status(403).json({ message: 'This post is locked for comments' });
    }

    // If replying to a comment, verify parent comment exists
    let depth = 0;
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      // Set depth based on parent
      depth = Math.min((parentComment.depth || 0) + 1, 5); // Max depth 5
    }

    const comment = await Comment.create({
      content,
      author: req.user.id,
      post: postId,
      parentComment: parentCommentId || null,
      depth
    });

    // OPTIMIZED: Use atomic $inc operation instead of read-modify-write
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
      $set: { lastActivityAt: new Date() }
    });

    // Update parent comment's reply count if applicable
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $inc: { replyCount: 1 }
      });
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar');

    // Socket emit for real-time updates
    try {
      const io = getIO();
      io.to(`post:${postId}`).emit('comment:new', {
        postId: postId.toString(),
        comment: populatedComment,
      });
    } catch (emitError) {
      console.error('Socket emit error (comment:new):', emitError.message);
    }

    // Create notification for post author or parent comment author
    if (parentCommentId) {
      // Notify parent comment author about reply
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment && parentComment.author.toString() !== req.user.id) {
        await createNotification({
          recipient: parentComment.author,
          sender: req.user.id,
          type: 'reply',
          post: postId,
          comment: comment._id,
          message: `replied to your comment`
        });
      }
    } else {
      // Notify post author about new comment
      if (post.author.toString() !== req.user.id) {
        await createNotification({
          recipient: post.author,
          sender: req.user.id,
          type: 'comment',
          post: postId,
          comment: comment._id,
          message: `commented on your post`
        });
      }
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('createComment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this comment' });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        content: req.body.content,
        isEdited: true,
        editedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('author', 'username avatar');

    // Socket emit for real-time updates
    try {
      const io = getIO();
      io.to(`post:${comment.post.toString()}`).emit('comment:updated', {
        postId: comment.post.toString(),
        comment: updatedComment,
      });
    } catch (emitError) {
      console.error('Socket emit error (comment:updated):', emitError.message);
    }

    res.json(updatedComment);
  } catch (error) {
    console.error('updateComment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author or admin
    if (comment.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized to delete this comment' });
    }

    // Count replies to adjust comment count properly
    const replyCount = await Comment.countDocuments({ parentComment: req.params.id });

    // Soft delete: mark as deleted instead of hard delete
    await Comment.updateMany(
      { parentComment: req.params.id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    await Comment.findByIdAndUpdate(req.params.id, {
      $set: { isDeleted: true, deletedAt: new Date() }
    });

    // OPTIMIZED: Atomic decrement of comment count (including replies)
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentCount: -(1 + replyCount) }
    });

    // Update parent's reply count if applicable
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $inc: { replyCount: -1 }
      });
    }

    // Socket emit for real-time updates
    try {
      const io = getIO();
      io.to(`post:${comment.post.toString()}`).emit('comment:deleted', {
        postId: comment.post.toString(),
        commentId: comment._id.toString(),
        parentCommentId: comment.parentComment ? comment.parentComment.toString() : null,
      });
    } catch (emitError) {
      console.error('Socket emit error (comment:deleted):', emitError.message);
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('deleteComment error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};
