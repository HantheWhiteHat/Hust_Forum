// Script để fix các posts cũ có blob URLs trong MongoDB
// Sử dụng mongosh để chạy: mongosh bkforum < fix_blob_urls.js

// Hoặc copy-paste vào mongosh shell:

const posts = db.posts.find({ content: /blob:/ }).toArray();

console.log('Found', posts.length, 'posts with blob URLs');

posts.forEach(function (post) {
    if (post.image) {
        console.log('Fixing post:', post._id.toString(), '-', post.title);

        // Replace all blob URLs with the post's actual image path
        const newContent = post.content.replace(
            /src=["']blob:[^"']+["']/g,
            'src="' + post.image + '"'
        );

        // Update the post
        db.posts.updateOne(
            { _id: post._id },
            { $set: { content: newContent } }
        );

        console.log('Fixed:', post._id.toString());
    } else {
        console.log('Post has blob URL but no image:', post._id.toString(), '-', post.title);
    }
});

console.log('All posts processed');

// Verify
const remaining = db.posts.countDocuments({ content: /blob:/ });
print('Posts still with blob URLs: ' + remaining);
