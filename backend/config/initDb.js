const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  const host = process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQLUSER || process.env.DB_USER || 'root';
  const password = process.env.MYSQLPASSWORD !== undefined ? process.env.MYSQLPASSWORD : (process.env.DB_PASS || '');
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME || 'kuwenta_db';
  const port = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10);

  console.log('Starting database initialization...');

  // 1. Connect without database to ensure it exists
  let connection;
  try {
    connection = await mysql.createConnection({ host, user, password, port });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${database}' verified/created.`);
  } catch (error) {
    console.error('Error creating database:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }

  // 2. Connect with database to create tables
  try {
    connection = await mysql.createConnection({ host, user, password, database, port });
    
    // Disable foreign key checks temporarily to avoid dependency order issues during create
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        theme ENUM('light', 'dark') NOT NULL DEFAULT 'light',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_email (email)
      ) ENGINE=InnoDB;
    `);
    console.log("Verified 'users' table.");

    // Create categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        name VARCHAR(50) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        color VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
        icon VARCHAR(50) NOT NULL DEFAULT 'tag',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uq_user_category_name_type (user_id, name, type),
        INDEX idx_category_user (user_id)
      ) ENGINE=InnoDB;
    `);
    console.log("Verified 'categories' table.");

    // Create transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT NULL,
        amount DECIMAL(12,2) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        description VARCHAR(255) NULL,
        transaction_date DATE NOT NULL,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_transaction_amount CHECK (amount > 0),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_transaction_user_date (user_id, transaction_date),
        INDEX idx_transaction_category (category_id)
      ) ENGINE=InnoDB;
    `);
    console.log("Verified 'transactions' table.");

    // Create budgets table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        limit_amount DECIMAL(12,2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_budget_limit CHECK (limit_amount > 0),
        CONSTRAINT chk_budget_dates CHECK (start_date < end_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        UNIQUE KEY uq_user_category_date_range (user_id, category_id, start_date),
        INDEX idx_budget_user (user_id),
        INDEX idx_budget_category (category_id)
      ) ENGINE=InnoDB;
    `);
    console.log("Verified 'budgets' table.");

    // Create savings_goals table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        target_amount DECIMAL(12,2) NOT NULL,
        current_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        target_date DATE NULL,
        status ENUM('active', 'completed', 'paused') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_savings_target CHECK (target_amount > 0),
        CONSTRAINT chk_savings_current CHECK (current_amount >= 0),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_savings_user (user_id)
      ) ENGINE=InnoDB;
    `);
    console.log("Verified 'savings_goals' table.");

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Seed default categories if empty
    const [existingCategories] = await connection.query('SELECT COUNT(*) as count FROM categories WHERE user_id IS NULL');
    if (existingCategories[0].count === 0) {
      console.log('Seeding default categories...');
      const defaultCategories = [
        [null, 'Food & Drinks', 'expense', '#F59E0B', 'utensils'],
        [null, 'Rent & Housing', 'expense', '#EF4444', 'home'],
        [null, 'Education', 'expense', '#3B82F6', 'graduation-cap'],
        [null, 'Entertainment', 'expense', '#EC4899', 'film'],
        [null, 'Transportation', 'expense', '#10B981', 'car'],
        [null, 'Shopping', 'expense', '#8B5CF6', 'shopping-bag'],
        [null, 'Utilities', 'expense', '#6B7280', 'zap'],
        [null, 'Salary', 'income', '#10B981', 'briefcase'],
        [null, 'Allowance', 'income', '#3B82F6', 'gift'],
        [null, 'Investments', 'income', '#F59E0B', 'trending-up']
      ];

      await connection.query(
        'INSERT INTO categories (user_id, name, type, color, icon) VALUES ?',
        [defaultCategories]
      );
      console.log('Successfully seeded default categories.');
    } else {
      console.log('Default categories already seeded.');
    }

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error during database schema execution:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = initializeDatabase;
