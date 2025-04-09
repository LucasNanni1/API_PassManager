const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Vérifie que la clé correspond bien à celle que tu encodes dans le token
    req.userId = decoded.userId;

    next();
  } catch (err) {
    console.error("Erreur de décodage JWT :", err.message);
    return res.status(401).json({ error: "Token invalide" });
  }
};
