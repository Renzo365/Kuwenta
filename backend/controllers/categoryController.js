const { query } = require('../config/db');

// Fetch all system-default categories and user-specific custom categories
async function getAll(req, res) {
  const userId = req.user.id;

  try {
    const categories = await query(
      `SELECT * FROM categories 
       WHERE user_id IS NULL OR user_id = ? 
       ORDER BY user_id ASC, name ASC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving categories.'
    });
  }
}

// Create a new user-customized category
async function create(req, res) {
  const userId = req.user.id;
  const { name, type, color, icon } = req.body;

  try {
    // 1. Check if username already has a category with same name & type to avoid duplication
    const duplicate = await query(
      `SELECT id FROM categories 
       WHERE (user_id IS NULL OR user_id = ?) AND name = ? AND type = ? LIMIT 1`,
      [userId, name, type]
    );

    if (duplicate.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name and transaction type already exists.'
      });
    }

    // 2. Insert category
    const result = await query(
      `INSERT INTO categories (user_id, name, type, color, icon) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, name, type, color || '#6366F1', icon || 'tag']
    );

    const newCat = await query('SELECT * FROM categories WHERE id = ? LIMIT 1', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCat[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating category.'
    });
  }
}

module.exports = {
  getAll,
  create
};
