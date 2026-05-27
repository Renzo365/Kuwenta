const { query } = require('../config/db');

// Get all transactions for the logged-in user with filters and pagination
async function getAll(req, res) {
  const userId = req.user.id;
  const { type, categoryId, startDate, endDate, search, page = 1, limit = 50 } = req.query;

  try {
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const queryParams = [userId];
    let sql = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;

    // Apply type filter (income/expense)
    if (type) {
      sql += ' AND t.type = ?';
      queryParams.push(type);
    }

    // Apply category filter
    if (categoryId) {
      sql += ' AND t.category_id = ?';
      queryParams.push(parseInt(categoryId, 10));
    }

    // Apply date range filters
    if (startDate) {
      sql += ' AND t.transaction_date >= ?';
      queryParams.push(startDate);
    }
    if (endDate) {
      sql += ' AND t.transaction_date <= ?';
      queryParams.push(endDate);
    }

    // Apply text search on description
    if (search) {
      sql += ' AND t.description LIKE ?';
      queryParams.push(`%${search}%`);
    }

    // Clone query for counting total pages before limit/offset
    let countSql = `SELECT COUNT(*) as total FROM (${sql}) as subquery`;
    const countResults = await query(countSql, queryParams);
    const totalTransactions = countResults[0].total;

    // Apply ordering and pagination
    sql += ' ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit, 10), offset);

    const transactions = await query(sql, queryParams);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: totalTransactions,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(totalTransactions / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving transactions.'
    });
  }
}

// Get single transaction details
async function getById(req, res) {
  const userId = req.user.id;
  const transactionId = req.params.id;

  try {
    const transactions = await query(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ? AND t.user_id = ? LIMIT 1`,
      [transactionId, userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: transactions[0]
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving transaction details.'
    });
  }
}

// Create a new transaction
async function create(req, res) {
  const userId = req.user.id;
  const { amount, type, categoryId, description, transactionDate, paymentMethod } = req.body;

  try {
    // 1. Verify category ownership if categoryId is provided
    if (categoryId) {
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
    }

    // 2. Insert transaction
    const result = await query(
      `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date, payment_method) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, categoryId || null, amount, type, description || null, transactionDate, paymentMethod || 'cash']
    );

    const newTxn = await query(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully.',
      data: newTxn[0]
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating transaction.'
    });
  }
}

// Update an existing transaction
async function update(req, res) {
  const userId = req.user.id;
  const transactionId = req.params.id;
  const { amount, type, categoryId, description, transactionDate, paymentMethod } = req.body;

  try {
    // 1. Check if transaction exists and belongs to user
    const existingTxn = await query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ? LIMIT 1',
      [transactionId, userId]
    );

    if (existingTxn.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized.'
      });
    }

    // 2. Verify category ownership if categoryId is updated
    if (categoryId) {
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
    }

    // 3. Update database record
    await query(
      `UPDATE transactions 
       SET amount = ?, type = ?, category_id = ?, description = ?, transaction_date = ?, payment_method = ? 
       WHERE id = ? AND user_id = ?`,
      [amount, type, categoryId || null, description || null, transactionDate, paymentMethod || 'cash', transactionId, userId]
    );

    const updatedTxn = await query(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ? LIMIT 1`,
      [transactionId]
    );

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully.',
      data: updatedTxn[0]
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating transaction.'
    });
  }
}

// Delete a transaction record
async function remove(req, res) {
  const userId = req.user.id;
  const transactionId = req.params.id;

  try {
    const existingTxn = await query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ? LIMIT 1',
      [transactionId, userId]
    );

    if (existingTxn.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized.'
      });
    }

    await query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [transactionId, userId]);

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting transaction.'
    });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
