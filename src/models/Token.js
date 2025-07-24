// src/models/Token.js
const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Token = db.define('Token', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expireAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  assinatura: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.STRING,
    allowNull: true
  }
  // Outros campos que deseje armazenar
});

module.exports = Token;
