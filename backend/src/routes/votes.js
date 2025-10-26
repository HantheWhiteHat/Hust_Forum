const express = require('express');
const { createVote, updateVote, deleteVote } = require('../controllers/voteController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.post('/', auth, createVote);
router.put('/:id', auth, updateVote);
router.delete('/:id', auth, deleteVote);

module.exports = router;

