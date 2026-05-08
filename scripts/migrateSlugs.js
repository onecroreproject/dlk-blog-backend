const mongoose = require('mongoose');
const Blog = require('../models/Blog');
require('dotenv').config();

const generateSlug = async (title) => {
  let slug = title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');

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

const migrate = async () => {
  try {
    await mongoose.connect(process.env.BLOG_DB_URI);
    console.log('Connected to database...');

    const blogs = await Blog.find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] });
    console.log(`Found ${blogs.length} blogs without slugs.`);

    for (const blog of blogs) {
      const slug = await generateSlug(blog.title);
      blog.slug = slug;
      await blog.save();
      console.log(`Updated blog: ${blog.title} -> ${slug}`);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
