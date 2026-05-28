# Kuwenta — Budget Tracker

Kuwenta is a modern, student-centric personal finance management and budget tracking application. It features a minimalist, responsive dashboard tailored for young adults to track transactions, define category budgets, monitor savings goals, and visualize spending habits via interactive charts.

---

## Tech Stack

- **Frontend:** React, Tailwind CSS v4, Zustand, React Query, React Router DOM, Chart.js, Lucide Icons.
- **Backend:** Node.js, Express.js, MySQL (database client `mysql2`), JWT (Authentication).
- **Environment Management:** dotenv, express-validator, bcryptjs.

---

## Key Features

- **Dashboard Panel:** Real-time account balances, net income/expense sums, savings goals completion progress, and quick ledgers.
- **Transaction Ledger:** Complete CRUD (Create, Read, Update, Delete) capability with filters for transaction type, categories, and date ranges.
- **Automated Budgeting:** Monthly budget limit configurations per category. Includes progress meters that transition warning states (green $\rightarrow$ amber $\rightarrow$ red) as spending nears thresholds.
- **Savings Goals Tracker:** Goal visual cards with percentage calculations, target dates, and quick balance adjustment buttons (deposits/withdrawals).
- **Visual Analytics:** Interactive Doughnut plots (displaying category allocations using database colors) and Line area charts (rendering 6-month historical cash flows).
- **Silent JWT Refresh:** In-memory short-lived access tokens paired with rotated HttpOnly refresh cookies to protect user session state against XSS/CSRF.
- **CSV Data Exporter:** One-click download utility that compiles logged transactions into clean CSV spreadsheets.

---

## Project Structure

```text
Kuwenta/
├── backend/
│   ├── config/             # DB configurations & schema initialization
│   ├── controllers/        # Express request controllers
│   ├── middleware/         # Auth guards, request validators, error handlers
│   ├── routes/             # API routing endpoints
│   ├── tests/              # Native node integration test suite
│   ├── server.js           # Server start entry point
│   └── .env                # Local backend environment variables (not in git)
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components & form modals
│   │   ├── layouts/        # Dashboard layout with desktop sidebar & mobile bar
│   │   ├── pages/          # Login, Register, Dashboard, Ledger, Budgets, Analytics
│   │   ├── services/       # Axios API client & endpoints
│   │   ├── store/          # Zustand global states (authStore)
│   │   ├── App.jsx         # Router & QueryClient configurations
│   │   └── main.jsx        # Entry point
│   ├── vercel.json         # Vercel deployment rewrite rules
│   └── .env                # Local frontend environment variables (not in git)
├── DEPLOYMENT.md           # Cloud hosting deployment configurations
└── README.md               # User manual
```

---

## Local Development Setup

Follow these instructions to run Kuwenta on your local machine using **XAMPP**:

### Prerequisites
- Install **Node.js** (v18 or higher is recommended).
- Install **XAMPP** (or any local environment that runs a MySQL Server).

---

### Step 1: Start the MySQL Database
1. Open the **XAMPP Control Panel**.
2. Click the **Start** button next to **MySQL**. (MySQL should be running on the default port `3306`).

---

### Step 2: Configure and Start the Backend API
1. Navigate to the `backend` directory in your terminal:
   ```bash
   cd backend
   ```
2. Start the Express development server:
   ```bash
   npm run dev
   ```
   *Note: On its very first startup, the backend server will automatically connect to your XAMPP MySQL, create a database named `kuwenta_db`, build all required tables (`users`, `transactions`, `categories`, `budgets`, `savings_goals`), and seed standard categories.*

---

### Step 3: Configure and Start the Frontend React App
1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Start the Vite development build server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to the local server URL provided (usually **`http://localhost:5173`**).

---

## Verification & Testing

To run the backend integration test suite:
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Run the Node.js native test runner:
   ```bash
   npm test
   ```
This will run the validation and authentication API route tests.
