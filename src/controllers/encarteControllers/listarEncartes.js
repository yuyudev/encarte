const Encarte = require('../../models/Encarte');
const EncarteProdutos = require('../../models/EncarteProdutos');

async function listarEncartes(req, res) {
  try {
    const encartes = await Encarte.findAll({ order: [['id', 'DESC']] });
    res.render('listar', { encartes });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao listar encartes.');
  }
}

async function excluirEncarte(req, res) {
  try {
    const { id } = req.params;
    await EncarteProdutos.destroy({ where: { encarteId: id } });
    await Encarte.destroy({ where: { id } });
    res.redirect('/encartes');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao excluir encarte.');
  }
}

module.exports = { listarEncartes, excluirEncarte };
