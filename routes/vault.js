const express = require("express");
const router = express.Router();
const pool = require("../models/db");
const authenticate = require("../middleware/auth");

// 🔐 Liste des mots de passe de l'utilisateur
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, site, login, password FROM "Vaults" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur récupération vault :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Ajout d'un mot de passe
router.post("/", authenticate, async (req, res) => {
  const { site, login, password } = req.body;

  if (!site || !login || !password) {
    return res.status(400).json({ error: "Champs requis" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO "Vaults"("userId", site, login, password) VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.userId, site, login, password]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Erreur ajout vault :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ❌ Suppression d'une entrée
router.delete("/:id", authenticate, async (req, res) => {
  const entryId = req.params.id;

  try {
    await pool.query(
      `DELETE FROM "Vaults" WHERE id = $1 AND "userId" = $2`,
      [entryId, req.userId]
    );
    res.json({ message: "Mot de passe supprimé" });
  } catch (err) {
    console.error("Erreur suppression vault :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
