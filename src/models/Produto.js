// src/models/Produto.js

const { DataTypes } = require('sequelize');
const db = require('../config/db');
const Fabricante = require('./Fabricante');

const Produto = db.define('Produto', {
  // Ajuste principal: ID auto-incrementado
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  ordem: DataTypes.INTEGER,
  codigo: DataTypes.STRING,
  nome: DataTypes.STRING,
  extra1: DataTypes.STRING,
  extra2: DataTypes.STRING,
  extra3: DataTypes.STRING,
  observacao1: DataTypes.TEXT,
  observacao2: DataTypes.TEXT,
  observacao3: DataTypes.TEXT,

  // Se 'tipo', 'codigoClasse' etc. são numéricos, use DataTypes.INTEGER/DECIMAL
  // Aqui assumiremos que são strings, mas ajuste se for numérico
  tipo: DataTypes.STRING,
  codigoClasse: DataTypes.STRING,
  codigoSubclasse: DataTypes.STRING,
  codigoGrupo: DataTypes.STRING,
  codigoMoeda: DataTypes.STRING,
  codigoFamilia: DataTypes.STRING,
  codigoUnidadeVenda: DataTypes.STRING,

  codigoPesquisa1: DataTypes.STRING,
  codigoPesquisa2: DataTypes.STRING,
  codigoPesquisa3: DataTypes.STRING,

  // Se peso for numérico, use DECIMAL(10,2) ou FLOAT
  pesoLiquido: DataTypes.DECIMAL(10, 2),
  pesoBruto: DataTypes.DECIMAL(10, 2),
  estoqueAtual: DataTypes.DECIMAL(10, 2),

  codigoFabricante: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  webObs1: DataTypes.TEXT,
  webObs2: DataTypes.TEXT,
  inativo: DataTypes.BOOLEAN,

  // Dimensões como DECIMAL, caso queira casas decimais
  altura: DataTypes.DECIMAL(10, 2),
  largura: DataTypes.DECIMAL(10, 2),
  comprimento: DataTypes.DECIMAL(10, 2),

  codigoBarras: DataTypes.STRING,
  urlDetalhe: DataTypes.STRING,
  urlEstoqueDetalhe: DataTypes.STRING,
  urlTabelaPreco: DataTypes.STRING,
  urlPromocoes: DataTypes.STRING,
  urlFotos: DataTypes.STRING,
  nomeSite: DataTypes.STRING,

  // Preços como DECIMAL(10,2) (ou FLOAT) para valores monetários
  precoTabela1: DataTypes.DECIMAL(10, 2),
  precoTabela2: DataTypes.DECIMAL(10, 2),
  precoTabela3: DataTypes.DECIMAL(10, 2),
  precoCusto: DataTypes.DECIMAL(10, 2),
  precoCustoMedio: DataTypes.DECIMAL(10, 2)

}, {
  tableName: 'Produtos',  // opcional se quiser nome de tabela específico
  timestamps: true        // se não quiser createdAt/updatedAt, use timestamps: false
});


module.exports = Produto;
