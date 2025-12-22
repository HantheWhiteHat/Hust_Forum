const express = require('express');
const { getPosts, getPost, createPost, updatePost, deletePost } = require('../controllers/postController');
const auth = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const upload = require('../middlewares/upload');
const { createPostValidation, updatePostValidation, mongoIdParam } = require('../middlewares/validation');

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', optionalAuth, mongoIdParam('id'), getPost);
router.post('/', auth, upload.array('media', 10), createPostValidation, createPost);
router.put('/:id', auth, upload.single('media'), updatePostValidation, updatePost);
router.delete('/:id', auth, mongoIdParam('id'), deletePost);

module.exports = router;
