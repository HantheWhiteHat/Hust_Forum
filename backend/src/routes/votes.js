const express = require('express');
const { createVote, updateVote, deleteVote } = require('../controllers/voteController');
const auth = require('../middlewares/auth');
const { createVoteValidation, updateVoteValidation, mongoIdParam } = require('../middlewares/validation');

const router = express.Router();

router.post('/', auth, createVoteValidation, createVote);
router.put('/:id', auth, updateVoteValidation, updateVote);
router.delete('/:id', auth, mongoIdParam('id'), deleteVote);

module.exports = router;
