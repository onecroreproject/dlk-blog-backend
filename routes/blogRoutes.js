const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const upload = require("../middleware/upload");

router.post("/", upload.fields([
  { name: "titleImage", maxCount: 1 },
  { name: "blogImage1", maxCount: 1 },
  { name: "blogImage2", maxCount: 1 },
  { name: "authorAvatar", maxCount: 1 },
]), blogController.createBlog);

router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);
router.get("/slug/:slug", blogController.getBlogBySlug);
router.put("/:id", upload.fields([
  { name: "titleImage", maxCount: 1 },
  { name: "blogImage1", maxCount: 1 },
  { name: "blogImage2", maxCount: 1 },
  { name: "authorAvatar", maxCount: 1 },
]), blogController.updateBlog);
router.delete("/:id", blogController.deleteBlog);

// Engagement Routes
router.patch("/:id/view", blogController.incrementViews);
router.patch("/:id/share", blogController.incrementShares);

module.exports = router;
