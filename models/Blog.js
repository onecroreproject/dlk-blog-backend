const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  titleImage: { type: String },
  blogImage1: { type: String },
  blogImage2: { type: String },
  authorAvatar: { type: String },
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  isEditorsChoice: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Blog', blogSchema,'Blog');
