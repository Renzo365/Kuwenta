# Kuwenta Deployment Guide

This guide details instructions for compiling and deploying the Kuwenta Budget Tracker application to production cloud environments.

## Architecture Topology

- **Frontend:** React SPA built with Vite and Tailwind CSS v4, hosted on **Vercel**.
- **Backend:** Express API running on Node.js, hosted on **Railway** or **Render**.
- **Database:** Managed MySQL instance running on **Railway**, **Render**, or **Aiven**.

---

## 1. Database Deployment

You will need a hosted MySQL 8.x instance. 
1. Create a MySQL database instance using a cloud provider (e.g. Railway's MySQL template or AWS RDS).
2. Connect to the database using a database client (e.g. TablePlus or DBeaver) or standard CLI tools.
3. If not utilizing our self-bootstrapping script, you can execute the raw DDL schema queries located in [backend/config/initDb.js](file:///C:/Users/ralph/Documents/Kuwenta/backend/config/initDb.js).
   *Note: Our backend automatically runs these scripts and seeds default categories on the very first successful connection.*

---

## 2. Backend Deployment (Railway or Render)

### Environment Variables
Configure the following variables in your cloud provider's dashboard:

| Variable Name | Example Value | Description |
|---|---|---|
| `PORT` | `5000` | Port Express server binds to (assigned automatically by cloud hosts) |
| `DB_HOST` | `mysql.railway.internal` | Hosted MySQL server address |
| `DB_PORT` | `3306` | Hosted MySQL port |
| `DB_USER` | `root` | Database username |
| `DB_PASS` | `your_secure_password` | Database user password |
| `DB_NAME` | `kuwenta_db` | Target database name |
| `JWT_SECRET` | `a_very_long_secure_random_string_xyz_123` | Secret key used to sign access tokens |
| `JWT_REFRESH_SECRET` | `another_long_secure_random_string_abc_456` | Secret key used to sign refresh tokens |
| `NODE_ENV` | `production` | Enables production optimizations |
| `FRONTEND_URL` | `https://kuwenta.vercel.app` | Production URL of your React frontend (crucial for CORS) |

### Deployment Steps
1. Push your code repository to GitHub.
2. Link the repository to your hosting account (Railway/Render).
3. Select the `/backend` subfolder as the root directory of the build, or configure the build settings to run:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Confirm server health by requesting `GET https://your-backend.railway.app/api/v1/health`.

---

## 3. Frontend Deployment (Vercel)

### Environment Variables
Configure the following in the Vercel project dashboard:

| Variable Name | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://your-backend.railway.app/api/v1` | URL pointing to your production backend API |

### Deployment Steps
1. Create a new project in Vercel and link your GitHub repository.
2. Configure project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. We have created [frontend/vercel.json](file:///C:/Users/ralph/Documents/Kuwenta/frontend/vercel.json) containing URL rewrite rules. This instructs Vercel to route all subpaths back to `index.html` to allow React Router to handle client-side routing on refreshes.
4. Click **Deploy**.
