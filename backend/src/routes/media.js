const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
    uploadMedia,
    getMediaByPost,
    updateMediaCaption,
    deleteMedia,
    reorderMedia
} = require('../controllers/mediaController');

// Upload multiple media files
router.post('/upload', auth, upload.array('media', 10), uploadMedia);

// Get media for a post
router.get('/post/:postId', getMediaByPost);

// Update media caption
router.patch('/:id/caption', auth, updateMediaCaption);

// Delete media
router.delete('/:id', auth, deleteMedia);

// Reorder media
router.patch('/reorder', auth, reorderMedia);

module.exports = router;
