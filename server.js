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

// Middleware
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Debug Route
app.get("/debug-path", (req, res) => {
  res.json({
    message: "Backend working successfully",
    url: req.url
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