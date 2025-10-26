const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { paginate } = require('../utils/paginate');
const mongoose = require('mongoose');

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
      // .populate({
      //   path: 'comments',
      //   populate: {
      //     path: 'author',
      //     select: 'username avatar'
      //   }
      // });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 });

    // Increment view count
    post.views += 1;
    await post.save();

    res.json({
      ...post.toObject(),
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
    const { title, content, tags, category } = req.body;

    const post = await Post.create({
      title,
      content,
      tags: tags || [],
      category: category || 'general',
      author: req.user.id
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author or admin
    if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'username avatar');

    res.json(updatedPost);
  } catch (error) {
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

