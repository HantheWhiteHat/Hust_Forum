const express = require('express');
const { getPosts, getPost, createPost, updatePost, deletePost } = require('../controllers/postController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', auth, createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);

module.exports = router;

