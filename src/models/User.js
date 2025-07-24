// src/models/User.js
const { DataTypes } = require('sequelize');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = db.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Hook para criptografar a senha antes de salvar no banco
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.senha = await bcrypt.hash(user.senha, salt);
});

module.exports = User;
