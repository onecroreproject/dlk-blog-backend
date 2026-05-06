const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const blogRoutes = require("./routes/blogRoutes");
const otpRoutes = require("./routes/otpRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const messageRoutes = require("./routes/messageRoutes");
require("dotenv").config();

const app = express();

// ABSOLUTE TOP LEVEL DEBUG ROUTES
app.get("/projectblogs-api/debug-path", (req, res) => {
  res.json({ message: "RAW PREFIX MATCH" });
});

app.get("/debug-path", (req, res) => {
  res.json({ message: "REWRITTEN MATCH" });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Strip nginx proxy prefix if present (nginx passes full path without stripping)
app.use((req, res, next) => {
  req.originalUrlBeforeStrip = req.url;
  if (req.url.startsWith('/projectblogs-api')) {
    // Replace the prefix and ensure it still starts with a slash
    let newUrl = req.url.replace('/projectblogs-api', '');
    if (!newUrl.startsWith('/')) newUrl = '/' + newUrl;
    req.url = newUrl;
  }
  next();
});

// Debug route to check path mapping
app.get("/debug-path", (req, res) => {
  res.json({
    originalUrl: req.originalUrlBeforeStrip,
    transformedUrl: req.url,
    match: "Success! The debug route was hit.",
    headers: req.headers
  });
});

// Routes
app.use("/api/blogs", blogRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/messages", messageRoutes);

// Database Connection
mongoose.connect(process.env.BLOG_DB_URI)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Database connection failed", err));

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
