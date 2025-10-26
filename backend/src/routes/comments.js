const express = require('express');
const { getComments, createComment, updateComment, deleteComment } = require('../controllers/commentController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/post/:postId', getComments);
router.post('/', auth, createComment);
router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);

module.exports = router;

