const express = require('express');
const { getPosts, getPost, createPost, updatePost, deletePost } = require('../controllers/postController');
const auth = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { upload } = require('../middlewares/upload');

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', optionalAuth, getPost);
// router.post('/', auth, createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/', auth, upload.single('image'), createPost);


module.exports = router;
