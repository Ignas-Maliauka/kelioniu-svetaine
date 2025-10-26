import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ message: "No token" });

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
}