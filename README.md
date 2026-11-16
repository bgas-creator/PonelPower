# PonelPower
Creating a website for marketing and selling and buying products

## Authentication API

This repository includes a Node.js/Express authentication API backed by PostgreSQL.
Public registration creates buyer accounts only; roles are never accepted from
registration requests. Passwords are stored as bcrypt hashes and successful
registration or login returns a 24-hour JWT.

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and a random `JWT_SECRET`
   of at least 32 characters (generate one with
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`).
2. Create the database and apply `migrations/001_create_users.sql`.
3. Run `npm install`, then `npm start` (or `npm run dev` during development).

Endpoints:

- `POST /api/auth/register` with `{ "fullname", "email", "password", "country" }`
- `POST /api/auth/login` with `{ "email", "password" }`
- `GET /api/auth/me` with `Authorization: Bearer <token>`

Authentication endpoints are rate-limited. Requests use parameterized SQL, and
responses never include password hashes.
