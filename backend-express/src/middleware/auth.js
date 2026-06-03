const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkeyforexpressapplicaton54321!";

const getAuthUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Not authenticated" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { email: decoded.sub }
    });
    if (!user) {
      return res.status(401).json({ detail: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Invalid token" });
  }
};

const checkRole = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ detail: "Not enough permissions" });
  }
  next();
};

module.exports = {
  getAuthUser,
  checkRole
};
