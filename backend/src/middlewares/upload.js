const multer = require("multer");
const path = require("path");

// Cho phép upload ảnh và video
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname +
        "_" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

function fileFilter(req, file, cb) {
  // Cho phép cả ảnh và video
  const allowedImages = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
  const allowedVideos = ["video/mp4", "video/quicktime", "video/webm"];
  const allowed = [...allowedImages, ...allowedVideos];
  
  if (!allowed.includes(file.mimetype)) {
    return cb(
      new Error("File không hợp lệ! Chỉ cho phép upload ảnh (JPG, PNG, GIF) hoặc video (MP4, MOV, WebM)."), 
      false
    );
  }
  cb(null, true);
}

// Giới hạn kích thước file: 50MB
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

module.exports = { upload };