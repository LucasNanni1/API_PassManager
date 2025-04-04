const express = require('express');
const { DataTypes } = require('sequelize');
const sequelize = require('../models/db');
const router = express.Router();

const Vault = sequelize.define('Vault', {
  userId: DataTypes.INTEGER,
  site: DataTypes.STRING,
  login: DataTypes.STRING,
  password: DataTypes.TEXT
});

Vault.sync();

router.get('/', async (req, res) => {
  const entries = await Vault.findAll({ where: { userId: req.user.id } });
  res.json(entries);
});

router.post('/', async (req, res) => {
  const { site, login, password } = req.body;
  const entry = await Vault.create({ userId: req.user.id, site, login, password });
  res.status(201).json(entry);
});

router.delete('/:id', async (req, res) => {
  await Vault.destroy({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ message: 'Supprimé' });
});

module.exports = router;
