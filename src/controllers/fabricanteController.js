// src/controllers/fabricanteController.js
const IdealSoftService = require('../services/idealSoftService');
const Fabricante = require('../models/Fabricante');

const fabricanteController = {

  atualizarFabricantes: async (req, res) => {
    try {
      const dadosFabricantes = await IdealSoftService.buscarFabricantes();

      for (const fab of dadosFabricantes) {
        // Ajuste: se não houver código, pule
        const codigo = fab.codigoFabricante;
        const nome = fab.nomeFabricante;
        if (!codigo) {
          console.log('Registro de fabricante sem "codigo", ignorado.');
          continue;
        }

        let fabricanteExistente = await Fabricante.findOne({
          where: { codigoFabricante: codigo }
        });

        if (fabricanteExistente) {
          // Se o nome mudou, atualiza
          if (fabricanteExistente.nomeFabricante !== nome) {
            fabricanteExistente.nomeFabricante = nome;
            await fabricanteExistente.save();
            console.log(`Fabricante ${codigo} atualizado: agora chama-se "${nome}".`);
          } else {
            console.log(`Fabricante ${codigo} sem alterações.`);
          }
        } else {
          // Cria o novo
          await Fabricante.create({
            codigoFabricante: codigo,
            nomeFabricante: nome,
            imagemFabricante: ''
          });
          console.log(`Fabricante ${codigo} inserido com nome "${nome}".`);
        }
      }

      res.json({ message: 'Tabela de fabricantes atualizada com sucesso.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao atualizar fabricantes.' });
    }
  },

  exibirTabelaFabricantes: async (req, res) => {
    try {
      const fabricantes = await Fabricante.findAll({
        order: [['nomeFabricante', 'ASC']]
      });
      res.render('tabela-fabricantes', { fabricantes });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao exibir tabela de fabricantes.');
    }
  },

  exibirFormularioUpload: async (req, res) => {
    try {
      const { codigo } = req.params;
      // Busca o fabricante
      const fabricante = await Fabricante.findOne({ where: { codigoFabricante: codigo } });
      if (!fabricante) {
        return res.status(404).send('Fabricante não encontrado.');
      }
      // Renderiza um form básico para envio da imagem
      res.render('upload-logo-fabricante', { fabricante });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao exibir formulário de upload.');
    }
  },

  processarUpload: async (req, res) => {
    try {
      const { codigo } = req.params;
      // Busca o fabricante
      const fabricante = await Fabricante.findOne({ where: { codigoFabricante: codigo } });
      if (!fabricante) {
        return res.status(404).send('Fabricante não encontrado.');
      }

      // Se o arquivo não existe (multer falhou ou não foi enviado)
      if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
      }

      // Atualiza o campo imagemFabricante com o nome do arquivo
      fabricante.imagemFabricante = req.file.filename;
      await fabricante.save();

      // Redireciona de volta à lista de fabricantes (ou onde quiser)
      res.redirect('/fabricantes/tabela');
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao salvar logotipo do fabricante.');
    }
  }

};

module.exports = fabricanteController;
