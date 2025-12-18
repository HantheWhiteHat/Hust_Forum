const Comment = require('../models/Comment');
const Post = require('../models/Post');
const mongoose = require('mongoose');
const { getIO } = require('../socket');

async function getReplies(commentId) {
  const replies = await Comment.find({ parentComment: commentId })
    .populate('author', 'username avatar')
    .sort({ createdAt: 1 });

  // fetch replies of replies
  for (let reply of replies) {
    reply.replies = await getReplies(reply._id); // recursive
  }

  return replies;
}



// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID format" });
    }

    const parentComments = await Comment.find({ post: new mongoose.Types.ObjectId(postId), parentComment: null })
      .populate('author', 'username avatar')
      // .populate({
      //   path: 'replies',
      //   populate: {
      //     path: 'author',
      //     select: 'username avatar'
      //   }
      // })
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const comments = [];
    for (let c of parentComments) {
      const obj = c.toObject();
      obj.replies = await getReplies(c._id);
      comments.push(obj);
    }

    const total = await Comment.countDocuments({ post: new mongoose.Types.ObjectId(postId), parentComment: null });

    res.json({
      comments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error("Error fetching comments:", error.stack);

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

    // If replying to a comment, verify parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const comment = await Comment.create({
      content,
      author: req.user.id,
      post: postId,
      parentComment: parentCommentId || null
    });

    // Update comment count on post
    post.commentCount += 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar');

    try {
      const io = getIO();
      io.to(`post:${postId}`).emit('comment:new', {
        postId: postId.toString(),
        comment: populatedComment,
      });
    } catch (emitError) {
      console.error('Socket emit error (comment:new):', emitError.message);
    }

    res.status(201).json(populatedComment);
  } catch (error) {
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

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: req.params.id });

    // Update comment count on post
    const post = await Post.findById(comment.post);
    if (post) {
      post.commentCount -= 1;
      await post.save();
    }

    await Comment.findByIdAndDelete(req.params.id);

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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};
