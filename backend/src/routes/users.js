const express = require('express');
const { getUsers, searchUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

// Public route - must be before /:id to avoid route conflict
router.get('/search', searchUsers);

router.get('/', auth, getUsers);
router.get('/:id', auth, getUser);
router.put('/:id', auth, upload.single('avatar'), updateUser);
router.delete('/:id', auth, deleteUser);

module.exports = router;

