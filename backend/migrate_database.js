// Database migration script to add new fields to existing posts and comments
// Run with: mongosh bkforum --quiet --eval "load('migrate_database.js')"

print('Starting database migration...\n');

// ========================================
// STEP 1: Update Posts
// ========================================
print('Step 1: Updating Posts...');

const postsUpdated = db.posts.updateMany(
    {},
    [
        {
            $set: {
                media: { $ifNull: ['$media', []] },
                mediaCount: { $ifNull: ['$mediaCount', 0] },
                netVotes: { $subtract: [{ $ifNull: ['$upvotes', 0] }, { $ifNull: ['$downvotes', 0] }] },
                lastActivityAt: { $ifNull: ['$lastActivityAt', '$updatedAt'] },
                isDeleted: { $ifNull: ['$isDeleted', false] },
                deletedAt: null
            }
        }
    ]
);

print(`  ✅ Updated ${postsUpdated.modifiedCount} posts`);

// ========================================
// STEP 2: Update Comments
// ========================================
print('\nStep 2: Updating Comments...');

const commentsUpdated = db.comments.updateMany(
    {},
    [
        {
            $set: {
                depth: { $ifNull: ['$depth', 0] },
                path: { $ifNull: ['$path', '001'] },
                replyCount: { $ifNull: ['$replyCount', 0] },
                netVotes: { $subtract: [{ $ifNull: ['$upvotes', 0] }, { $ifNull: ['$downvotes', 0] }] },
                isDeleted: { $ifNull: ['$isDeleted', false] },
                deletedAt: null
            }
        }
    ]
);

print(`  ✅ Updated ${commentsUpdated.modifiedCount} comments`);

// ========================================
// STEP 3: Migrate existing media to Media collection
// ========================================
print('\nStep 3: Migrating existing media...');

let migratedCount = 0;

db.posts.find({ image: { $exists: true, $ne: null } }).forEach(function (post) {
    try {
        // Extract filename from path
        const filepath = post.image;
        const filename = filepath.split('/').pop();

        // Create Media document
        const mediaDoc = {
            post: post._id,
            filename: filename,
            filepath: filepath,
            mimetype: post.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
            mediaType: post.mediaType || 'image',
            size: 0, // Unknown, will be 0
            caption: '',
            order: 0,
            uploadedBy: post.author,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
        };

        const result = db.media.insertOne(mediaDoc);

        // Update post with media reference
        db.posts.updateOne(
            { _id: post._id },
            {
                $set: {
                    media: [result.insertedId],
                    mediaCount: 1
                }
            }
        );

        migratedCount++;
    } catch (error) {
        print(`  ⚠️  Error migrating post ${post._id}: ${error}`);
    }
});

print(`  ✅ Migrated ${migratedCount} media files to Media collection`);

// ========================================
// STEP 4: Calculate reply counts for comments
// ========================================
print('\nStep 4: Calculating reply counts...');

db.comments.find({ parentComment: { $ne: null } }).forEach(function (comment) {
    db.comments.updateOne(
        { _id: comment.parentComment },
        { $inc: { replyCount: 1 } }
    );
});

print('  ✅ Reply counts updated');

// ========================================
// STEP 5: Update lastActivityAt for posts
// ========================================
print('\nStep 5: Updating post activity timestamps...');

db.posts.find().forEach(function (post) {
    const latestComment = db.comments.findOne(
        { post: post._id },
        { sort: { createdAt: -1 } }
    );

    const lastActivity = latestComment ? latestComment.createdAt : post.updatedAt;

    db.posts.updateOne(
        { _id: post._id },
        { $set: { lastActivityAt: lastActivity } }
    );
});

print('  ✅ Activity timestamps updated');

// ========================================
// VERIFICATION
// ========================================
print('\n========================================');
print('VERIFICATION:');
print('========================================');

const totalPosts = db.posts.countDocuments({});
const postsWithMedia = db.posts.countDocuments({ mediaCount: { $gt: 0 } });
const totalMedia = db.media.countDocuments({});
const totalComments = db.comments.countDocuments({});

print(`Total Posts: ${totalPosts}`);
print(`Posts with Media: ${postsWithMedia}`);
print(`Total Media documents: ${totalMedia}`);
print(`Total Comments: ${totalComments}`);

print('\n✅ Migration completed successfully!');
print('\nNext steps:');
print('1. Test creating new posts with multiple media');
print('2. Verify existing posts display correctly');
print('3. Test media upload/delete functionality');
print('4. Monitor performance with new indexes');
