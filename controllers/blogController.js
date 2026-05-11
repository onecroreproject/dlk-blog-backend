const Blog = require("../models/Blog");
const NodeCache = require("node-cache");
const blogCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes by default

const generateSlug = async (title) => {
  let slug = title
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");

  let slugExists = await Blog.findOne({ slug });
  let counter = 1;
  let originalSlug = slug;

  while (slugExists) {
    slug = `${originalSlug}-${counter}`;
    slugExists = await Blog.findOne({ slug });
    counter++;
  }

  return slug;
};

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

    const slug = await generateSlug(title);

    const newBlog = new Blog({
      title,
      slug,
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
    blogCache.flushAll(); // Clear cache on new blog
    res.status(201).json({ message: "Blog saved successfully!", blog: newBlog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving blog", error: error.message });
  }
};

exports.getAllBlogs = async (req, res) => {
  console.log("--- getAllBlogs request received ---");
  const start = Date.now();
  try {
    const { minimal } = req.query;
    const isMinimal = minimal !== 'false';
    const cacheKey = `blogs_${isMinimal}`;
    
    // Check Cache
    const cachedData = blogCache.get(cacheKey);
    if (cachedData) {
      console.log(`--- Serving ${cacheKey} from Cache ---`);
      return res.json(cachedData);
    }

    let blogs;
    const count = await Blog.countDocuments();
    console.log(`Fetching blogs (minimal: ${isMinimal}). Total in DB: ${count}`);
    
    if (isMinimal) {
      // Use aggregation to truncate content at the database level
      blogs = await Blog.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $project: {
            title: 1,
            slug: 1,
            category: 1,
            author: 1,
            createdAt: 1,
            titleImage: 1,
            views: 1,
            shares: 1,
            isEditorsChoice: 1,
            tags: 1,
            content: { $substr: ["$content", 0, 200] }
          }
        }
      ]);
    } else {
      blogs = await Blog.find().sort({ createdAt: -1 }).lean();
    }
    
    const duration = Date.now() - start;
    const payloadSize = JSON.stringify(blogs).length;
    console.log(`--- getAllBlogs completed in ${duration}ms | Payload: ${(payloadSize / 1024).toFixed(2)} KB ---`);
    
    // Set Cache
    blogCache.set(cacheKey, blogs);
    
    // Set Cache-Control for browser
    if (isMinimal) {
      res.set('Cache-Control', 'public, max-age=60');
    }
    
    res.json(blogs);
  } catch (error) {
    console.error("Error in getAllBlogs:", error);
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

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blog by slug", error: error.message });
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

    if (title && title !== existingBlog.title) {
      updatedData.slug = await generateSlug(title);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(blogId, updatedData, { new: true });
    blogCache.flushAll(); // Clear cache on update
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
    blogCache.flushAll(); // Clear cache on delete
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

