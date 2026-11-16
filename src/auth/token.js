const jwt = require("jsonwebtoken");

const ISSUER = "ponelpower-api";
const AUDIENCE = "ponelpower-client";

function generateToken(user, secret) {
  return jwt.sign(
    { role: user.role },
    secret,
    {
      algorithm: "HS256",
      audience: AUDIENCE,
      expiresIn: "24h",
      issuer: ISSUER,
      subject: user.id,
    },
  );
}

function verifyToken(token, secret) {
  return jwt.verify(token, secret, {
    algorithms: ["HS256"],
    audience: AUDIENCE,
    issuer: ISSUER,
  });
}

module.exports = { generateToken, verifyToken };
