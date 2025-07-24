// src/models/EncarteProdutos.js
const { DataTypes } = require('sequelize');
const db           = require('../config/db');

const EncarteProdutos = db.define('EncarteProdutos', {
  id: {
    type         : DataTypes.INTEGER,
    primaryKey   : true,
    autoIncrement: true
  },
  encarteId: {
    type      : DataTypes.INTEGER,
    allowNull : false,
    references: { model: 'Encartes', key: 'id' },
    onUpdate  : 'CASCADE',
    onDelete  : 'CASCADE'
  },
  produtoId: {
    type      : DataTypes.INTEGER,
    allowNull : false,
    references: { model: 'Produtos', key: 'id' },
    onUpdate  : 'CASCADE',
    onDelete  : 'CASCADE'
  },

  /** ordem de clique (você pode remover se já não usa) */
  ordemSelecao: {
    type     : DataTypes.INTEGER,
    allowNull: true
  },

  /** índice do(s) quadro(s) ocupado(s) pelo grupo */
  quadroId: {
    type     : DataTypes.INTEGER,
    allowNull: true
  },

  /** NOVO — largura do bloco (1 = simples, 2 = duplo, 3 = triplo) */
  largura: {
    type        : DataTypes.TINYINT,
    allowNull   : false,
    defaultValue: 1
  }
}, {
  tableName : 'EncarteProdutos',
  underscored: false   // mantenha como já está no seu projeto
});

module.exports = EncarteProdutos;
