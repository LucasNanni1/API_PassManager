const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: process.env.DATABASE_URL.includes('sqlite') ? 'sqlite' : 'postgres',
  logging: false
});
module.exports = sequelize;
