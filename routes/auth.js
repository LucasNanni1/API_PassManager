const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../models/db");

// 🔐 Inscription
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }

  try {
    // Vérifie si l'utilisateur existe déjà
    const existingUser = await db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Email déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO "Users" (email, password) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );

    res.status(201).json({ message: "Compte créé.", userId: result.rows[0].id });
  } catch (err) {
    console.error("Erreur inscription :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// 🔐 Connexion
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }

  try {
    const userResult = await db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user || !user.password) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    res.status(200).json({ message: "Connexion réussie.", userId: user.id });
  } catch (err) {
    console.error("Erreur connexion :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// 🔐 Changement de mot de passe
router.post("/change-password", async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const userResult = await db.query('SELECT * FROM "Users" WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE "Users" SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);

    res.status(200).json({ message: "Mot de passe mis à jour." });
  } catch (err) {
    console.error("Erreur changement mot de passe :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

module.exports = router;
