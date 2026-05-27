const { query } = require('../config/db');

// Get all budgets for the logged-in user with dynamic spent aggregates
async function getAll(req, res) {
  const userId = req.user.id;

  try {
    const budgets = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
              COALESCE((
                SELECT SUM(t.amount) 
                FROM transactions t 
                WHERE t.user_id = b.user_id 
                  AND t.category_id = b.category_id 
                  AND t.type = 'expense'
                  AND t.transaction_date >= b.start_date 
                  AND t.transaction_date <= b.end_date
              ), 0.00) as spent_amount
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ?
       ORDER BY b.start_date DESC, c.name ASC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: budgets
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving budgets.'
    });
  }
}

// Create a new budget limit
async function create(req, res) {
  const userId = req.user.id;
  const { categoryId, limitAmount, startDate, endDate } = req.body;

  try {
    // 1. Verify category ownership
    const categories = await query(
      'SELECT id FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?)',
      [categoryId, userId]
    );
    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selection.'
      });
    }

    // 2. Check for duplicate budget constraints (same category and start date)
    const duplicate = await query(
      'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND start_date = ? LIMIT 1',
      [userId, categoryId, startDate]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A budget limit for this category has already been defined for this start date.'
      });
    }

    // 3. Insert budget
    const result = await query(
      `INSERT INTO budgets (user_id, category_id, limit_amount, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, categoryId, limitAmount, startDate, endDate]
    );

    const newBudget = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon, 0.00 as spent_amount
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Budget limit defined successfully.',
      data: newBudget[0]
    });
  } catch (error) {
    console.error('Error creating budget limit:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating budget limit.'
    });
  }
}

// Update an existing budget limit
async function update(req, res) {
  const userId = req.user.id;
  const budgetId = req.params.id;
  const { limitAmount, startDate, endDate } = req.body;

  try {
    const existingBudget = await query(
      'SELECT id, category_id FROM budgets WHERE id = ? AND user_id = ? LIMIT 1',
      [budgetId, userId]
    );

    if (existingBudget.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget limit not found or unauthorized.'
      });
    }

    await query(
      `UPDATE budgets 
       SET limit_amount = ?, start_date = ?, end_date = ? 
       WHERE id = ? AND user_id = ?`,
      [limitAmount, startDate, endDate, budgetId, userId]
    );

    const updatedBudget = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
              COALESCE((
                SELECT SUM(t.amount) 
                FROM transactions t 
                WHERE t.user_id = b.user_id 
                  AND t.category_id = b.category_id 
                  AND t.type = 'expense'
                  AND t.transaction_date >= b.start_date 
                  AND t.transaction_date <= b.end_date
              ), 0.00) as spent_amount
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.id = ? LIMIT 1`,
      [budgetId]
    );

    return res.status(200).json({
      success: true,
      message: 'Budget limit updated successfully.',
      data: updatedBudget[0]
    });
  } catch (error) {
    console.error('Error updating budget limit:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating budget limit.'
    });
  }
}

// Remove a budget constraint
async function remove(req, res) {
  const userId = req.user.id;
  const budgetId = req.params.id;

  try {
    const existingBudget = await query(
      'SELECT id FROM budgets WHERE id = ? AND user_id = ? LIMIT 1',
      [budgetId, userId]
    );

    if (existingBudget.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget limit not found or unauthorized.'
      });
    }

    await query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [budgetId, userId]);

    return res.status(200).json({
      success: true,
      message: 'Budget limit removed successfully.'
    });
  } catch (error) {
    console.error('Error deleting budget limit:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting budget limit.'
    });
  }
}

module.exports = {
  getAll,
  create,
  update,
  remove
};
