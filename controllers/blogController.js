const Blog = require("../models/Blog");

exports.createBlog = async (req, res) => {
  try {
    const { title, category, author, content, tags, isEditorsChoice } = req.body;
    const files = req.files;

    const getFilePath = (fieldName) => {
      if (files[fieldName] && files[fieldName][0]) {
        return files[fieldName][0].path.replace(/\\/g, "/");
      }
      return null;
    };

    // Parse tags if they come as a JSON string (typical for FormData)
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(t => t.trim());
      }
    }

    const newBlog = new Blog({
      title,
      category,
      author,
      content,
      tags: parsedTags,
      isEditorsChoice: isEditorsChoice === 'true' || isEditorsChoice === true,
      titleImage: getFilePath("titleImage"),
      blogImage1: getFilePath("blogImage1"),
      blogImage2: getFilePath("blogImage2"),
      authorAvatar: getFilePath("authorAvatar"),
    });

    await newBlog.save();
    res.status(201).json({ message: "Blog saved successfully!", blog: newBlog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving blog", error: error.message });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs", error: error.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blog", error: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { title, category, author, content, tags, isEditorsChoice } = req.body;
    const files = req.files;
    const blogId = req.params.id;

    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) return res.status(404).json({ message: "Blog not found" });

    const getFilePath = (fieldName) => {
      if (files && files[fieldName] && files[fieldName][0]) {
        return files[fieldName][0].path.replace(/\\/g, "/");
      }
      return existingBlog[fieldName];
    };

    let parsedTags = existingBlog.tags;
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(t => t.trim());
      }
    }

    const updatedData = {
      title: title || existingBlog.title,
      category: category || existingBlog.category,
      author: author || existingBlog.author,
      content: content || existingBlog.content,
      tags: parsedTags,
      isEditorsChoice: isEditorsChoice !== undefined ? (isEditorsChoice === 'true' || isEditorsChoice === true) : existingBlog.isEditorsChoice,
      titleImage: getFilePath("titleImage"),
      blogImage1: getFilePath("blogImage1"),
      blogImage2: getFilePath("blogImage2"),
      authorAvatar: getFilePath("authorAvatar"),
    };

    const updatedBlog = await Blog.findByIdAndUpdate(blogId, updatedData, { new: true });
    res.json({ message: "Blog updated successfully!", blog: updatedBlog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating blog", error: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json({ message: "Blog deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting blog", error: error.message });
  }
};

exports.incrementViews = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json({ message: "View count updated", views: blog.views });
  } catch (error) {
    res.status(500).json({ message: "Error updating view count", error: error.message });
  }
};

exports.incrementShares = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json({ message: "Share count updated", shares: blog.shares });
  } catch (error) {
    res.status(500).json({ message: "Error updating share count", error: error.message });
  }
};

