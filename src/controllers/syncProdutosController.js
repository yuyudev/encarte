// scripts/syncProducts.js
require('dotenv').config();
const db = require('../config/db');
const IdealSoftService = require('../services/idealSoftService');


const syncProdutosController = {
  syncProducts:async (req, res) =>   {
    try {
      await db.authenticate();
      console.log('Conectado ao banco de dados com sucesso!\n');

      const novoToken = await IdealSoftService.autenticar('HIEAPA-606996-UVFS', 1);
      console.log('Token gerado manualmente:');
      console.log(`  token: ${novoToken.token}`);
      console.log(`  expira em: ${novoToken.expireAt}\n`);

      const totalProdutos = await IdealSoftService.buscarProdutos(true);
      console.log(`\nSincronização finalizada! Total de produtos: ${totalProdutos}\n`);
  
      return totalProdutos;
    } catch (error) {
      console.error('Erro durante a sincronização manual:', error);
      throw error;
    }
  }
};


module.exports = syncProdutosController;
