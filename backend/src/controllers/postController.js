const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Media = require('../models/Media');
const { paginate } = require('../utils/paginate');
const mongoose = require('mongoose');
const { getIO } = require('../socket');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, sort = 'newest' } = req.query;

    let query = {};

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
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { upvotes: -1 };
        break;
      case 'most_viewed':
        sortOption = { views: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .populate('media') // Populate media with captions
      .select('-viewedBy')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: paginate(page, limit, total)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res) => {
  try {

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar reputation')
      .populate('media'); // NEW: Populate media array

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 });

    const currentUserId = req.user?._id?.toString();
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

        try {
          const io = getIO();
          io.emit('post:viewed', {
            postId: post._id.toString(),
            views: post.views,
          });
          io.to(`post:${post._id.toString()}`).emit('post:viewed', {
            postId: post._id.toString(),
            views: post.views,
          });
        } catch (emitError) {
          console.error('Socket emit error (post:viewed):', emitError.message);
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
    // res.status(500).json({ message: error.message });
    console.error('getPost error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    console.log("req.user =", req.user);
    console.log("BODY RECEIVED:", req.body);
    console.log("FILES RECEIVED:", req.files); // Now using req.files for multiple

    const { title, content, tags, category, captions } = req.body;

    // Parse captions if provided
    let captionsArray = [];
    if (captions) {
      captionsArray = typeof captions === 'string' ? JSON.parse(captions) : captions;
    }

    // Create post first
    const post = await Post.create({
      title,
      content: content || '',
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
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
      post.image = mediaDocuments[0].filepath;
      post.mediaType = mediaDocuments[0].mediaType;
    }

    await post.save();

    // Populate and return
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar')
      .populate('media');

    try {
      const io = getIO();
      io.emit('post:new', populatedPost);
    } catch (emitError) {
      console.error('Socket emit error (post:new):', emitError.message);
    }

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('createPost error:', error);
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

    // const updatedPost = await Post.findByIdAndUpdate(
    //   req.params.id,
    //   req.body,
    //   { new: true, runValidators: true }
    // ).populate('author', 'username avatar');

    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    post.category = req.body.category || post.category;
    post.tags = req.body.tags ? JSON.parse(req.body.tags) : post.tags;

    if (req.file) {
      post.image = `/uploads/${req.file.filename}`;
      // Cập nhật mediaType dựa trên file mới
      if (req.file.mimetype.startsWith('video/')) {
        post.mediaType = 'video';
      } else if (req.file.mimetype.startsWith('image/')) {
        post.mediaType = 'image';
      }
    }

    const updatedPost = await post.save();
    const populatedPost = await Post.findById(updatedPost._id)
      .populate('author', 'username avatar');

    try {
      const io = getIO();
      io.emit('post:updated', populatedPost);
    } catch (emitError) {
      console.error('Socket emit error (post:updated):', emitError.message);
    }

    // res.json(updatedPost);
    res.json(populatedPost);
  } catch (error) {
    console.error('updatePost error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author or admin
    if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: req.params.id });

    await Post.findByIdAndDelete(req.params.id);

    try {
      const io = getIO();
      io.emit('post:deleted', { postId: req.params.id });
    } catch (emitError) {
      console.error('Socket emit error (post:deleted):', emitError.message);
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
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
