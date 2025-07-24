const Encarte         = require('../../models/Encarte');
const EncarteProdutos = require('../../models/EncarteProdutos');
const Produto         = require('../../models/Produto');
const { Op }          = require('sequelize');

async function detalhar(req, res) {
  try {
    const { id } = req.params;

    // Busca o encarte
    const encarte = await Encarte.findByPk(id);
    if (!encarte) {
      return res.status(404).send('Encarte não encontrado');
    }

    // Busca só os produtos com quadroId > 0
    const produtos = await EncarteProdutos.findAll({
      where: {
        encarteId: id,
        quadroId:  { [Op.gt]: 0 }
      },
      include: [{ model: Produto }]
    });

    // Retorna encarte + produtos filtrados
    res.json({ encarte, produtos });
  } catch (error) {
    console.error('Erro ao detalhar encarte:', error);
    res.status(500).send('Erro ao detalhar encarte.');
  }
}

module.exports = { detalhar };
