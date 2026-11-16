const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const requireAuth = require("../auth/require-auth");
const { generateToken } = require("../auth/token");
const { validateLogin, validateRegistration } = require("../auth/validation");

function createAuthRouter({ pool, jwtSecret }) {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    const { errors, values } = validateRegistration(req.body);
    if (errors.length) {
      return res.status(400).json({ error: "Invalid registration details", details: errors });
    }

    try {
      const passwordHash = await bcrypt.hash(values.password, 12);
      const result = await pool.query(
        `INSERT INTO users (id, fullname, email, password_hash, role, country)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, fullname, email, role, country, created_at`,
        [randomUUID(), values.fullname, values.email, passwordHash, "buyer", values.country],
      );
      const user = result.rows[0];

      return res.status(201).json({
        token: generateToken(user, jwtSecret),
        user,
      });
    } catch (error) {
      if (error.code === "23505" && error.constraint === "users_email_unique") {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      return next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    const { errors, values } = validateLogin(req.body);
    if (errors.length) {
      return res.status(400).json({ error: "Invalid login details", details: errors });
    }

    try {
      const result = await pool.query(
        `SELECT id, fullname, email, password_hash, role, country, created_at
         FROM users
         WHERE LOWER(email) = $1`,
        [values.email],
      );
      const user = result.rows[0];
      const passwordMatches = user
        ? await bcrypt.compare(values.password, user.password_hash)
        : false;

      if (!passwordMatches) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const publicUser = {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        country: user.country,
        created_at: user.created_at,
      };
      return res.json({
        token: generateToken(user, jwtSecret),
        user: publicUser,
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/me", requireAuth(jwtSecret), async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT id, fullname, email, role, country, created_at
         FROM users
         WHERE id = $1`,
        [req.auth.userId],
      );
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      return res.json({ user });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createAuthRouter;
