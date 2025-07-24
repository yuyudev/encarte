// src/controllers/produtoController.js
const IdealSoftService = require('../services/idealSoftService');
const Produto = require('../models/Produto');
const Fabricante = require('../models/Fabricante');
const fs = require('fs');
const path = require('path');

const produtoController = {

  listar: async (req, res) => {
    try {
      const produtos = await Produto.findAll();
      res.json(produtos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  atualizarProdutos: async (req, res) => {
    try {
      const total = await IdealSoftService.buscarProdutos();
      res.json({ message: `Produtos atualizados. Total obtido: ${total}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  exibirTabela: async (req, res) => {
    try {
      const produtos = await Produto.findAll();
      const fabricantesList = await Fabricante.findAll({ order: [['nomeFabricante', 'ASC']] });
      const dirPath = path.join(__dirname, '..', 'public', 'img', 'produtos');
      let arquivos = [];
      try {
        arquivos = fs.readdirSync(dirPath);
      } catch (err) {
        console.error('Erro ao ler o diretório de imagens:', err);
      }

      res.render('tabela-produtos', { 
        produtos, 
        fabricantes: fabricantesList,
        arquivos
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao gerar tabela de produtos.');
    }
  },

  atualizarInfoProduto: async (req, res) => {
    try {
      const { id, precoTabela3, extra3 } = req.body;
      const produto = await Produto.findByPk(id);
      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      produto.precoTabela3 = precoTabela3;
      produto.extra3 = extra3;
      await produto.save();
      return res.json({ message: 'Produto atualizado com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro ao atualizar produto' });
    }
  }
};

module.exports = produtoController;
