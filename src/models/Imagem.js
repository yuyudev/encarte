// src/models/Imagem.js
const { DataTypes } = require('sequelize');
const db = require('../config/db');

/**
 * Tabela de imagens de produtos
 * - codigoProduto: string que identifica o produto
 * - nomeImagem: nome do arquivo de imagem
 *   (varios produtos podem compartilhar, se repetirem a mesma string)
 */
const Imagem = db.define('Imagem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  codigoProduto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nomeImagem: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Imagem;
