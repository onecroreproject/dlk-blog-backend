const Category = require("../models/Category");

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error: error.message });
  }
};

exports.createCategories = async (req, res) => {
  try {
    const { names, name } = req.body;
    
    // Handle Single Creation with Image
    if (name) {
      const existing = await Category.findOne({ name });
      if (existing) return res.status(400).json({ message: "Category already exists" });
      
      const newCategory = new Category({
        name,
        image: req.file ? req.file.path.replace(/\\/g, "/") : null
      });
      await newCategory.save();
      return res.status(201).json({ message: "Category created successfully", category: newCategory });
    }

    // Handle Bulk Creation (Keep existing logic)
    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ message: "Invalid input. Provide 'name' for single or 'names' array for bulk." });
    }

    const existing = await Category.find({ name: { $in: names } });
    const existingNames = existing.map(c => c.name);
    const newNames = names.filter(name => !existingNames.includes(name));

    if (newNames.length === 0) {
      return res.status(400).json({ message: "All categories already exist." });
    }

    const categoriesToCreate = newNames.map(name => ({ name }));
    const created = await Category.insertMany(categoriesToCreate);
    
    res.status(201).json({ message: `${created.length} categories created successfully`, categories: created });
  } catch (error) {
    res.status(500).json({ message: "Error creating categories", error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const updateData = { name };
    if (req.file) {
      updateData.image = req.file.path.replace(/\\/g, "/");
    }
    
    const updated = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category updated successfully", category: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating category", error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error: error.message });
  }
};
