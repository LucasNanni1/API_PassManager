const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require('../models/db');
const auth = require("../middleware/auth");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      `INSERT INTO "Users"(email, password_hash, created_at)
       VALUES ($1, $2, NOW())
       RETURNING id`,
      [email, hash]
    );
    res.status(201).json({ userId: result.rows[0].id });
  } catch (e) {
    res.status(400).json({ error: "Email déjà utilisé" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await db.query(`SELECT * FROM "Users" WHERE email = $1`, [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Utilisateur inconnu" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// 🔐 Change password
router.post("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userRes = await db.query(`SELECT * FROM "Users" WHERE id = $1`, [req.userId]);
  const user = userRes.rows[0];

  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Ancien mot de passe incorrect" });

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.query(`UPDATE "Users" SET password_hash = $1 WHERE id = $2`, [newHash, req.userId]);

  res.json({ message: "Mot de passe mis à jour" });
});

module.exports = router;
