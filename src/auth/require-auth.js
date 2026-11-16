const { verifyToken } = require("./token");

function requireAuth(secret) {
  return (req, res, next) => {
    const authorization = req.get("authorization");
    const match = authorization && authorization.match(/^Bearer ([^\s]+)$/i);

    if (!match) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const claims = verifyToken(match[1], secret);
      req.auth = { userId: claims.sub, role: claims.role };
      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      return next(error);
    }
  };
}

module.exports = requireAuth;
