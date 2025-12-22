const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Media = require('../models/Media');
const Vote = require('../models/Vote');
const { paginate } = require('../utils/paginate');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { getIO } = require('../socket');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, sort = 'newest' } = req.query;

    let query = { isDeleted: { $ne: true } }; // Exclude soft-deleted posts

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { isPinned: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { isPinned: -1, netVotes: -1, createdAt: -1 };
        break;
      case 'most_viewed':
        sortOption = { isPinned: -1, views: -1 };
        break;
      case 'hot':
        sortOption = { isPinned: -1, lastActivityAt: -1 };
        break;
      default:
        sortOption = { isPinned: -1, createdAt: -1 };
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .populate('media')
      .select('-viewedBy')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Use lean() for read-only queries

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: paginate(page, limit, total)
    });
  } catch (error) {
    logger.error('getPosts error', { error: error.message });
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res) => {
  try {
    // Validation already done by middleware
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar reputation')
      .populate('media');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.isDeleted) {
      return res.status(404).json({ message: 'Post has been deleted' });
    }

    const comments = await Comment.find({
      post: req.params.id,
      isDeleted: { $ne: true }
    })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 });

    // OPTIMIZED: Better view counting with user tracking
    const currentUserId = req.user?._id?.toString() || req.user?.id?.toString();
    const isAuthor = currentUserId && currentUserId === post.author._id.toString();

    // Increment view count only once per authenticated user and never for author
    if (currentUserId && !isAuthor) {
      const viewedBy = Array.isArray(post.viewedBy) ? post.viewedBy : [];
      const alreadyViewed = viewedBy.some(
        (viewerId) => viewerId.toString() === currentUserId
      );
      if (!alreadyViewed) {
        post.views += 1;
        post.viewedBy = [...viewedBy, currentUserId];
        await post.save();

        // Socket emit for real-time view updates
        try {
          const io = getIO();
          io.emit('post:viewed', {
            postId: post._id.toString(),
            views: post.views,
          });
        } catch (emitError) {
          logger.warn('Socket emit error (post:viewed)', { error: emitError.message });
        }
      }
    }

    const postObj = post.toObject();
    delete postObj.viewedBy;

    res.json({
      ...postObj,
      comments
    });
  } catch (error) {
    logger.error('getPost error', { error: error.message, postId: req.params.id });
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    logger.debug('Creating post', { userId: req.user.id });

    const { title, content, tags, category, captions } = req.body;

    // Parse captions if provided
    let captionsArray = [];
    if (captions) {
      try {
        captionsArray = typeof captions === 'string' ? JSON.parse(captions) : captions;
      } catch (e) {
        logger.warn('Failed to parse captions', { captions });
        captionsArray = [];
      }
    }

    // Parse tags safely
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags);
      } catch (e) {
        logger.warn('Failed to parse tags', { tags });
        parsedTags = [];
      }
    }

    // Create post first
    const post = await Post.create({
      title,
      content: content || '',
      tags: parsedTags,
      category: category || 'general',
      author: req.user.id,
      media: [],
      mediaCount: 0
    });

    // Handle multiple media files if present
    let processedContent = content || '';
    const mediaDocuments = [];

    if (req.files && req.files.length > 0) {
      // Create Media documents
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';

        const mediaData = {
          post: post._id,
          filename: file.filename,
          filepath: `/uploads/${file.filename}`,
          mimetype: file.mimetype,
          mediaType,
          size: file.size,
          caption: captionsArray[i] || '',
          order: i,
          uploadedBy: req.user.id
        };

        const mediaDoc = await Media.create(mediaData);
        mediaDocuments.push(mediaDoc);

        // Replace blob URLs with actual server paths
        const uploadedFilePath = `/uploads/${file.filename}`;
        processedContent = processedContent.replace(
          /src=["']blob:[^"']+["']/,
          `src="${uploadedFilePath}"`
        );
      }

      // Update post with media references
      post.media = mediaDocuments.map(m => m._id);
      post.mediaCount = mediaDocuments.length;
      post.content = processedContent;

      // Keep backward compatibility - set first media as image/mediaType
      if (mediaDocuments.length > 0) {
        post.image = mediaDocuments[0].filepath;
        post.mediaType = mediaDocuments[0].mediaType;
      }
    }

    await post.save();

    // Populate and return
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar')
      .populate('media');

    logger.info('Post created', { postId: post._id, userId: req.user.id });

    // Socket emit for real-time updates
    try {
      const io = getIO();
      io.emit('post:new', populatedPost);
    } catch (emitError) {
      logger.warn('Socket emit error (post:new)', { error: emitError.message });
    }

    res.status(201).json(populatedPost);
  } catch (error) {
    logger.error('createPost error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author or admin
    if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }

    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    post.category = req.body.category || post.category;

    if (req.body.tags) {
      try {
        post.tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
      } catch (e) {
        logger.warn('Failed to parse tags in update', { tags: req.body.tags });
      }
    }

    if (req.file) {
      post.image = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith('video/')) {
        post.mediaType = 'video';
      } else if (req.file.mimetype.startsWith('image/')) {
        post.mediaType = 'image';
      }
    }

    const updatedPost = await post.save();
    const populatedPost = await Post.findById(updatedPost._id)
      .populate('author', 'username avatar');

    logger.info('Post updated', { postId: post._id, userId: req.user.id });

    // Socket emit for real-time updates
    try {
      const io = getIO();
      io.emit('post:updated', populatedPost);
    } catch (emitError) {
      logger.warn('Socket emit error (post:updated)', { error: emitError.message });
    }

    res.json(populatedPost);
  } catch (error) {
    logger.error('updatePost error', { error: error.message, postId: req.params.id });
    res.status(500).json({ message: error.message });
  }
};

// Helper function to safely delete a file
const safeDeleteFile = (filepath) => {
  try {
    const fullPath = path.join(process.cwd(), filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.debug('Deleted file', { filepath: fullPath });
      return true;
    }
  } catch (error) {
    logger.warn('Failed to delete file', { filepath, error: error.message });
  }
  return false;
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('media');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author or admin
    if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    // Clean up media files from disk and database
    if (post.media && post.media.length > 0) {
      for (const media of post.media) {
        // Delete file from disk
        safeDeleteFile(media.filepath);
        // Delete media document
        await Media.findByIdAndDelete(media._id);
      }
      logger.info('Cleaned up media files', { postId: post._id, count: post.media.length });
    }

    // Delete legacy single image if exists
    if (post.image) {
      safeDeleteFile(post.image);
    }

    // Delete associated comments (soft delete)
    await Comment.updateMany(
      { post: req.params.id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    // Delete associated votes
    await Vote.deleteMany({ post: req.params.id });

    // Soft delete the post (or hard delete based on preference)
    await Post.findByIdAndUpdate(req.params.id, {
      $set: { isDeleted: true, deletedAt: new Date() }
    });

    logger.info('Post deleted', { postId: post._id, userId: req.user.id });

    // Socket emit for real-time updates
    try {
      const io = getIO();
      io.emit('post:deleted', { postId: req.params.id });
    } catch (emitError) {
      logger.warn('Socket emit error (post:deleted)', { error: emitError.message });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('deletePost error', { error: error.message, postId: req.params.id });
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
};
