// src/models/Fabricante.js

const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Fabricante = db.define('Fabricante', {
  codigoFabricante: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    // Se quiser que seja auto-increment, adicione:
    // autoIncrement: true,
  },
  nomeFabricante: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imagemFabricante: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Fabricantes',
  timestamps: false
});

module.exports = Fabricante;
