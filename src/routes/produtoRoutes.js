// src/routes/produtoRoutes.js
const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

router.get('/', produtoController.listar);

router.get('/atualizar', produtoController.atualizarProdutos);
router.post('/update-info', produtoController.atualizarInfoProduto);
router.get('/tabela', produtoController.exibirTabela);

  

module.exports = router;
