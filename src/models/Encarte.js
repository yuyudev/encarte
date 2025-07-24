// src/models/Encarte.js
const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Encarte = db.define('Encarte', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  textoLegal: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  textoLegalCapa: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  criadoEm: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  pdfPath: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Encarte;
