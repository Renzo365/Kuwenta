const { query } = require('../config/db');

// Get all savings goals for the logged-in user
async function getAll(req, res) {
  const userId = req.user.id;

  try {
    const goals = await query(
      'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY status ASC, created_at DESC',
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving savings goals.'
    });
  }
}

// Create a new savings goal card
async function create(req, res) {
  const userId = req.user.id;
  const { name, targetAmount, currentAmount = 0.00, targetDate } = req.body;

  try {
    // Determine initial status based on target vs current amount
    const isCompleted = parseFloat(currentAmount) >= parseFloat(targetAmount);
    const status = isCompleted ? 'completed' : 'active';

    const result = await query(
      `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, targetAmount, currentAmount, targetDate || null, status]
    );

    const newGoal = await query('SELECT * FROM savings_goals WHERE id = ? LIMIT 1', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Savings goal created successfully.',
      data: newGoal[0]
    });
  } catch (error) {
    console.error('Error creating savings goal:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating savings goal.'
    });
  }
}

// Update settings or targets of an existing savings goal
async function update(req, res) {
  const userId = req.user.id;
  const goalId = req.params.id;
  const { name, targetAmount, targetDate, status } = req.body;

  try {
    // 1. Verify existence & ownership
    const goals = await query(
      'SELECT id, current_amount FROM savings_goals WHERE id = ? AND user_id = ? LIMIT 1',
      [goalId, userId]
    );

    if (goals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found or unauthorized.'
      });
    }

    const currentAmount = parseFloat(goals[0].current_amount);
    let resolvedStatus = status || 'active';

    // Auto-update status if targetAmount was updated
    if (targetAmount) {
      const isCompleted = currentAmount >= parseFloat(targetAmount);
      resolvedStatus = isCompleted ? 'completed' : (status || 'active');
    }

    await query(
      `UPDATE savings_goals 
       SET name = ?, target_amount = ?, target_date = ?, status = ? 
       WHERE id = ? AND user_id = ?`,
      [name, targetAmount, targetDate || null, resolvedStatus, goalId, userId]
    );

    const updatedGoal = await query('SELECT * FROM savings_goals WHERE id = ? LIMIT 1', [goalId]);

    return res.status(200).json({
      success: true,
      message: 'Savings goal updated successfully.',
      data: updatedGoal[0]
    });
  } catch (error) {
    console.error('Error updating savings goal:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating savings goal.'
    });
  }
}

// Log a deposit or withdrawal from the savings goal balance
async function adjustBalance(req, res) {
  const userId = req.user.id;
  const goalId = req.params.id;
  const { amount, action } = req.body; // action: 'deposit' | 'withdraw'

  try {
    // 1. Verify goal exists and user owns it
    const goals = await query(
      'SELECT * FROM savings_goals WHERE id = ? AND user_id = ? LIMIT 1',
      [goalId, userId]
    );

    if (goals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found or unauthorized.'
      });
    }

    const goal = goals[0];
    const currentVal = parseFloat(goal.current_amount);
    const targetVal = parseFloat(goal.target_amount);
    const adjustmentVal = parseFloat(amount);

    let newVal = currentVal;
    if (action === 'deposit') {
      newVal += adjustmentVal;
    } else if (action === 'withdraw') {
      if (adjustmentVal > currentVal) {
        return res.status(400).json({
          success: false,
          message: `Cannot withdraw ${adjustmentVal}. Current savings balance is only ${currentVal}.`
        });
      }
      newVal -= adjustmentVal;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be either 'deposit' or 'withdraw'."
      });
    }

    // Determine status
    const status = newVal >= targetVal ? 'completed' : 'active';

    // Update goal
    await query(
      'UPDATE savings_goals SET current_amount = ?, status = ? WHERE id = ? AND user_id = ?',
      [newVal, status, goalId, userId]
    );

    const updatedGoal = await query('SELECT * FROM savings_goals WHERE id = ? LIMIT 1', [goalId]);

    return res.status(200).json({
      success: true,
      message: `${action === 'deposit' ? 'Deposited' : 'Withdrew'} funds successfully.`,
      data: updatedGoal[0]
    });
  } catch (error) {
    console.error('Error adjusting savings balance:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating savings balance.'
    });
  }
}

// Remove a savings goal card
async function remove(req, res) {
  const userId = req.user.id;
  const goalId = req.params.id;

  try {
    const goals = await query(
      'SELECT id FROM savings_goals WHERE id = ? AND user_id = ? LIMIT 1',
      [goalId, userId]
    );

    if (goals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found or unauthorized.'
      });
    }

    await query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [goalId, userId]);

    return res.status(200).json({
      success: true,
      message: 'Savings goal deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting savings goal:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting savings goal.'
    });
  }
}

module.exports = {
  getAll,
  create,
  update,
  adjustBalance,
  remove
};
