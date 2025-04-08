const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");
const router = express.Router();

// GET all
router.get("/", auth, async (req, res) => {
  const result = await db.query(`SELECT * FROM "Vaults" WHERE "userId" = $1`, [req.userId]);
  res.json(result.rows);
});

// POST
router.post("/", auth, async (req, res) => {
  const { site, login, password } = req.body;
  await db.query(
    `INSERT INTO "Vaults" ("userId", site, login, password)
     VALUES ($1, $2, $3, $4)`,
    [req.userId, site, login, password]
  );
  res.status(201).json({ message: "Ajouté" });
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
  await db.query(`DELETE FROM "Vaults" WHERE id = $1 AND "userId" = $2`, [
    req.params.id,
    req.userId,
  ]);
  res.json({ message: "Supprimé" });
});

module.exports = router;
