const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../models/db");
const authenticate = require("../middleware/auth");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// ✅ Enregistrement utilisateur
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Champs requis" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO "Users"(email, "passwordHash", "createdAt", "updatedAt") 
       VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
      [email, hashed]
    );

    const token = jwt.sign({ userId: result.rows[0].id }, JWT_SECRET, {
      expiresIn: "12h",
    });

    res.json({ token });
  } catch (err) {
    console.error("Erreur inscription :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Connexion utilisateur
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM "Users" WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: "Identifiants invalides" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match)
      return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "12h",
    });

    res.json({ token });
  } catch (err) {
    console.error("Erreur login :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Changement de mot de passe
router.post("/change-password", authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM "Users" WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];
    const match = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!match)
      return res.status(403).json({ error: "Mot de passe actuel incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE "Users" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [hashed, userId]
    );

    res.json({ message: "Mot de passe mis à jour" });
  } catch (err) {
    console.error("Erreur changement mdp :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Envoi du lien de réinitialisation
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requis" });

  try {
    const result = await pool.query(`SELECT id FROM "Users" WHERE email = $1`, [email]);
    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Si cet email existe, un lien a été envoyé." });
    }

    const userId = result.rows[0].id;
    const token = crypto.randomBytes(32).toString("hex");

    await pool.query(`
      UPDATE "Users" 
      SET "resetToken" = $1, "resetTokenExpiry" = NOW() + INTERVAL '1 hour'
      WHERE id = $2
    `, [token, userId]);

    const resetLink = `https://reset-password-xxxx.onrender.com/reset-password.html?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Réinitialisation de mot de passe",
      html: `<p>Clique ici pour réinitialiser ton mot de passe :</p><a href="${resetLink}">${resetLink}</a>`
    });

    res.json({ message: "Lien envoyé." });
  } catch (err) {
    console.error("Erreur forgot-password :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Réinitialisation du mot de passe via lien
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: "Champs requis" });

  try {
    const result = await pool.query(
      `SELECT id FROM "Users" WHERE "resetToken" = $1 AND "resetTokenExpiry" > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Lien invalide ou expiré." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(`
      UPDATE "Users"
      SET "passwordHash" = $1, "resetToken" = NULL, "resetTokenExpiry" = NULL, "updatedAt" = NOW()
      WHERE id = $2
    `, [hashed, result.rows[0].id]);

    res.json({ message: "Mot de passe mis à jour !" });
  } catch (err) {
    console.error("Erreur reset-password :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
