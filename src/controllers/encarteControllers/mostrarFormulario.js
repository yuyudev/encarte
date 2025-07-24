
const Produto = require('../../models/Produto');
const Fabricante = require('../../models/Fabricante');

async function mostrarFormulario(req, res) {
  try {
    // Carrega fabricantes e produtos ordenados
    const fabricantes = await Fabricante.findAll({ order: [['nomeFabricante', 'ASC']] });
    const produtos = await Produto.findAll({ order: [['nome', 'ASC']] });

    // Monta fabricantesMap
    const fabricantesMap = {};
    fabricantes.forEach((fab) => {
      fabricantesMap[fab.codigoFabricante] = {
        fabricante: fab,
        produtos: {}
      };
    });

    // Distribui produtos dentro de cada fabricante
    produtos.forEach((p) => {
      if (!fabricantesMap[p.codigoFabricante]) return;
      const extra1Key = p.extra1 || 'Sem Identificação';
      if (!fabricantesMap[p.codigoFabricante].produtos[extra1Key]) {
        fabricantesMap[p.codigoFabricante].produtos[extra1Key] = [];
      }
      fabricantesMap[p.codigoFabricante].produtos[extra1Key].push(p);
    });

    // Produtos sem fabricante
    const produtosSemFab = produtos.filter(p => !fabricantesMap.hasOwnProperty(p.codigoFabricante));
    const gruposSemFab = {};
    produtosSemFab.forEach(psf => {
      const k = psf.extra1 || 'Sem Identificação';
      if (!gruposSemFab[k]) {
        gruposSemFab[k] = [];
      }
      gruposSemFab[k].push(psf);
    });

    // Se você quiser pré-marcar algum produto, defina aqui.
    // Caso não queira nenhum pré-selecionado, basta manter array vazio:
    let selectedProductIds = []; 
    // Exemplo: se no req.query viesse algo, você poderia popular:
    // if (req.query.preSelecao) { selectedProductIds = [...]; }

    // Render da view "cadastro.ejs"
    res.render('cadastro', {
      fabricantesMap,
      gruposSemFab,
      selectedProductIds // passa como array para o EJS
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar formulário de encarte.');
  }
}

module.exports = {
  mostrarFormulario
};