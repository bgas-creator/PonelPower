require("dotenv").config();

const createApp = require("./app");
const pool = require("./db");

const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set to a secret of at least 32 characters");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const app = createApp({ pool, jwtSecret });
const server = app.listen(port, () => {
  console.log(`PonelPower API listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
