# MERN Authentication + Authorization (No Scaffolding Tools)

This project is a **study-focused MERN app** that demonstrates how to build authentication and role-based authorization manually:

- **M**ongoDB (official Node driver)
- **E**xpress
- **R**eact (loaded via CDN, no bundler)
- **N**ode.js

No Maven, no CRA/Vite, and no scaffolding automation.

## Features

- User registration (`name`, `email`, `password`)
- Login with JWT issuance
- Password hashing with bcrypt
- Authenticated profile endpoint
- Authorization with `user` and `admin` roles
- Admin-only route example
- React single-page UI served by Express

## Project Structure

- `server.js` - Express API + static hosting
- `middleware/auth.js` - JWT verification + role guard middleware
- `db.js` - MongoDB connection and index setup
- `public/index.html` - React app (no build step)

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

```bash
cp .env.example .env
```

Set:
- `MONGODB_URI`
- `JWT_SECRET`
- optional `PORT`

## 3) Run

```bash
npm start
```

Open `http://localhost:5000`.

## API Endpoints

### Public
- `POST /api/auth/register`
- `POST /api/auth/login`

### Protected
- `GET /api/auth/me` (any logged-in user)
- `GET /api/admin/stats` (admin role only)

## Seed an Admin (for study)

After registering a normal user, promote it in MongoDB shell:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

Then log in again and call the admin route.

---

This is intentionally minimal and educational to show manual MERN wiring.
