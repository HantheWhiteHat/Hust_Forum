const express = require('express');
const { getComments, createComment, updateComment, deleteComment } = require('../controllers/commentController');
const auth = require('../middlewares/auth');
const { createCommentValidation, updateCommentValidation, mongoIdParam } = require('../middlewares/validation');

const router = express.Router();

router.get('/post/:postId', mongoIdParam('postId'), getComments);
router.post('/', auth, createCommentValidation, createComment);
router.put('/:id', auth, updateCommentValidation, updateComment);
router.delete('/:id', auth, mongoIdParam('id'), deleteComment);

module.exports = router;
