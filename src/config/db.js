// src/config/db.js

const { Sequelize } = require('sequelize');

// Cria a conexão com o banco de dados
const db = new Sequelize(
  process.env.DB_NAME || 'encartes_db',
  process.env.DB_USER || 'yuri',
  process.env.DB_PASS || 'SeNhA_F0rTe!123',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false
  }
);

// Testa a conexão
db.authenticate()
  .then(() => {
    console.log('✅ Conexão ao banco de dados realizada com sucesso!');
  })
  .catch(err => {
    console.error('❌ Erro ao conectar no banco de dados:', err);
  });

// Sincroniza o banco ao iniciar
db.sync()
  .then(() => {
    console.log('✅ Tabelas sincronizadas com sucesso!');
  })
  .catch(err => {
    console.error('❌ Erro ao sincronizar tabelas:', err);
  });

module.exports = db;
