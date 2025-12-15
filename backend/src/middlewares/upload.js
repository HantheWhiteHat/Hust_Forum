const multer = require("multer");
const path = require("path");

// chỉ cho phép upload ảnh
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
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("File không hợp lệ! Chỉ cho upload ảnh."), false);
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter });

module.exports = { upload };