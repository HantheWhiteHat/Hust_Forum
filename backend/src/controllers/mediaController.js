const Media = require('../models/Media');
const Post = require('../models/Post');
const fs = require('fs').promises;
const path = require('path');

// @desc    Upload media files (multiple)
// @route   POST /api/media/upload
// @access  Private
const uploadMedia = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const { postId, captions } = req.body;

        // Parse captions if provided
        let captionsArray = [];
        if (captions) {
            captionsArray = typeof captions === 'string' ? JSON.parse(captions) : captions;
        }

        // Create Media documents
        const mediaPromises = req.files.map(async (file, index) => {
            const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';

            const mediaData = {
                post: postId,
                filename: file.filename,
                filepath: `/uploads/${file.filename}`,
                mimetype: file.mimetype,
                mediaType,
                size: file.size,
                caption: captionsArray[index] || '',
                order: index,
                uploadedBy: req.user.id
            };

            return await Media.create(mediaData);
        });

        const mediaDocuments = await Promise.all(mediaPromises);

        // Update post with media references if postId provided
        if (postId) {
            await Post.findByIdAndUpdate(postId, {
                $push: { media: { $each: mediaDocuments.map(m => m._id) } },
                $inc: { mediaCount: mediaDocuments.length }
            });
        }

        res.status(201).json({
            success: true,
            count: mediaDocuments.length,
            media: mediaDocuments
        });
    } catch (error) {
        console.error('uploadMedia error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get media for a post
// @route   GET /api/media/post/:postId
// @access  Public
const getMediaByPost = async (req, res) => {
    try {
        const media = await Media.find({ post: req.params.postId })
            .sort({ order: 1 })
            .populate('uploadedBy', 'username');

        res.json({
            success: true,
            count: media.length,
            media
        });
    } catch (error) {
        console.error('getMediaByPost error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update media caption
// @route   PATCH /api/media/:id/caption
// @access  Private
const updateMediaCaption = async (req, res) => {
    try {
        const { caption } = req.body;

        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // Check if user is owner
        if (media.uploadedBy.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        media.caption = caption;
        await media.save();

        res.json({
            success: true,
            media
        });
    } catch (error) {
        console.error('updateMediaCaption error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete media
// @route   DELETE /api/media/:id
// @access  Private
const deleteMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // Check if user is owner
        if (media.uploadedBy.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete file from filesystem
        const filepath = path.join(__dirname, '../../uploads', media.filename);
        try {
            await fs.unlink(filepath);
        } catch (err) {
            console.error('Error deleting file:', err);
        }

        // Remove from post's media array
        await Post.findByIdAndUpdate(media.post, {
            $pull: { media: media._id },
            $inc: { mediaCount: -1 }
        });

        // Delete Media document
        await Media.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Media deleted'
        });
    } catch (error) {
        console.error('deleteMedia error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reorder media
// @route   PATCH /api/media/reorder
// @access  Private
const reorderMedia = async (req, res) => {
    try {
        const { mediaIds } = req.body; // Array of media IDs in new order

        if (!Array.isArray(mediaIds)) {
            return res.status(400).json({ message: 'mediaIds must be an array' });
        }

        // Update order for each media
        const updatePromises = mediaIds.map(async (mediaId, index) => {
            const media = await Media.findById(mediaId);
            if (media && media.uploadedBy.toString() === req.user.id) {
                media.order = index;
                return await media.save();
            }
        });

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: 'Media reordered'
        });
    } catch (error) {
        console.error('reorderMedia error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadMedia,
    getMediaByPost,
    updateMediaCaption,
    deleteMedia,
    reorderMedia
};
