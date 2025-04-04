const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true },
  passwordHash: DataTypes.STRING
});

module.exports = User;
