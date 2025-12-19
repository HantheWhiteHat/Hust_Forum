const express = require('express');
const { getPosts, getPost, createPost, updatePost, deletePost } = require('../controllers/postController');
const auth = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', optionalAuth, getPost);
router.post('/', auth, upload.array('media', 10), createPost); // Changed to array, max 10 files
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);


module.exports = router;
