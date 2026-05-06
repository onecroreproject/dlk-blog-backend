const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const authorName = req.body.author || "anonymous";
    const sanitizedAuthor = authorName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    
    let subFolder = "image";
    let dir;

    if (file.fieldname === "image") {
      // Category images go to a global categories folder
      dir = path.join("uploads", "categories");
    } else {
      if (file.mimetype.startsWith("video/")) {
        subFolder = "video";
      } else if (file.fieldname === "authorAvatar") {
        subFolder = "avatar";
      }
      dir = path.join("uploads", sanitizedAuthor, subFolder);
    }
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed!"), false);
    }
  }
});

module.exports = upload;
