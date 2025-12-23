const { body, param, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Auth validations
const registerValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate
];

// Post validations
const createPostValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 300 }).withMessage('Title cannot exceed 300 characters'),
    body('category')
        .optional()
        .isIn(['general', 'academic', 'technology', 'sports', 'entertainment', 'other'])
        .withMessage('Invalid category'),
    body('content')
        .optional()
        .isLength({ max: 100000 }).withMessage('Content too long'),
    validate
];

const updatePostValidation = [
    param('id').isMongoId().withMessage('Invalid post ID'),
    body('title')
        .optional()
        .trim()
        .isLength({ max: 300 }).withMessage('Title cannot exceed 300 characters'),
    body('category')
        .optional()
        .isIn(['general', 'academic', 'technology', 'sports', 'entertainment', 'other'])
        .withMessage('Invalid category'),
    validate
];

// Comment validations
const createCommentValidation = [
    body('content')
        .trim()
        .notEmpty().withMessage('Comment content is required')
        .isLength({ max: 5000 }).withMessage('Comment cannot exceed 5000 characters'),
    body('postId')
        .notEmpty().withMessage('Post ID is required')
        .isMongoId().withMessage('Invalid post ID'),
    body('parentCommentId')
        .optional()
        .isMongoId().withMessage('Invalid parent comment ID'),
    validate
];

const updateCommentValidation = [
    param('id').isMongoId().withMessage('Invalid comment ID'),
    body('content')
        .trim()
        .notEmpty().withMessage('Comment content is required')
        .isLength({ max: 5000 }).withMessage('Comment cannot exceed 5000 characters'),
    validate
];

// Vote validations
const createVoteValidation = [
    body('type')
        .notEmpty().withMessage('Vote type is required')
        .isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote'),
    body('postId')
        .optional()
        .isMongoId().withMessage('Invalid post ID'),
    body('commentId')
        .optional()
        .isMongoId().withMessage('Invalid comment ID'),
    validate
];

const updateVoteValidation = [
    param('id').isMongoId().withMessage('Invalid vote ID'),
    body('type')
        .notEmpty().withMessage('Vote type is required')
        .isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote'),
    validate
];

// MongoDB ID param validation
const mongoIdParam = (paramName = 'id') => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
    validate
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    createPostValidation,
    updatePostValidation,
    createCommentValidation,
    updateCommentValidation,
    createVoteValidation,
    updateVoteValidation,
    mongoIdParam
};
