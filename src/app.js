const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const createAuthRouter = require("./routes/auth");

function createApp({ pool, jwtSecret }) {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "10kb" }));
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: true,
      legacyHeaders: false,
    }),
    createAuthRouter({ pool, jwtSecret }),
  );

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      return res.status(400).json({ error: "Request body must be valid JSON" });
    }

    console.error("Request failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = createApp;
