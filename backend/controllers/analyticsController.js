const { query } = require('../config/db');

// Retrieve aggregate statistics for summary boxes
async function getSummary(req, res) {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
    let queryParams = [userId, userId];
    let dateFilter = '';

    if (startDate && endDate) {
      dateFilter = ' AND transaction_date >= ? AND transaction_date <= ?';
      queryParams.push(startDate, endDate);
    } else {
      // Default to current month
      dateFilter = " AND MONTH(transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(transaction_date) = YEAR(CURRENT_DATE())";
    }

    const statsSql = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0.00) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0.00) as total_expense
      FROM transactions
      WHERE user_id = ? ${dateFilter}
    `;

    // We also want to compute the net balance of the user's entire account (life-time)
    const balanceSql = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0.00) -
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0.00) as net_balance
      FROM transactions
      WHERE user_id = ?
    `;

    const [stats] = await query(statsSql, queryParams.slice(0, statsSql.includes('?') ? 3 : 1));
    const [balance] = await query(balanceSql, [userId]);

    const totalIncome = parseFloat(stats.total_income);
    const totalExpense = parseFloat(stats.total_expense);
    const netBalance = parseFloat(balance.net_balance);

    // Calculate savings rate: (Income - Expense) / Income * 100
    const savingsRate = totalIncome > 0 
      ? parseFloat((((totalIncome - totalExpense) / totalIncome) * 100).toFixed(2))
      : 0.00;

    return res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance,
        savingsRate
      }
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving analytics summary.'
    });
  }
}

// Retrieve category-wise expense allocations
async function getCategoryBreakdown(req, res) {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
    let queryParams = [userId];
    let dateFilter = '';

    if (startDate && endDate) {
      dateFilter = ' AND t.transaction_date >= ? AND t.transaction_date <= ?';
      queryParams.push(startDate, endDate);
    } else {
      // Default to current month
      dateFilter = " AND MONTH(t.transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(t.transaction_date) = YEAR(CURRENT_DATE())";
    }

    const sql = `
      SELECT c.id as category_id, c.name as category_name, c.color as category_color, c.icon as category_icon, 
             SUM(t.amount) as total_amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' ${dateFilter}
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY total_amount DESC
    `;

    const breakdown = await query(sql, queryParams);

    // Format output numeric values
    const formattedBreakdown = breakdown.map(item => ({
      ...item,
      total_amount: parseFloat(item.total_amount)
    }));

    return res.status(200).json({
      success: true,
      data: formattedBreakdown
    });
  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving category breakdown.'
    });
  }
}

// Retrieve 6-month historical cash flow trends
async function getMonthlyTrends(req, res) {
  const userId = req.user.id;

  try {
    const sql = `
      SELECT DATE_FORMAT(transaction_date, '%Y-%m') as month_key,
             COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0.00) as total_income,
             COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0.00) as total_expense
      FROM transactions
      WHERE user_id = ? AND transaction_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
      ORDER BY month_key ASC
    `;

    const trends = await query(sql, [userId]);

    const formattedTrends = trends.map(item => ({
      month: item.month_key, // e.g. "2026-05"
      income: parseFloat(item.total_income),
      expense: parseFloat(item.total_expense)
    }));

    return res.status(200).json({
      success: true,
      data: formattedTrends
    });
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving monthly trends.'
    });
  }
}

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends
};
