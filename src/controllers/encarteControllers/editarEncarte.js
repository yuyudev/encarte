/*  ==================================================================
    CONTROLLER – EDITAR ENCARTE
    ==================================================================*/
const { Op } = require('sequelize');
const Encarte = require('../../models/Encarte');
const EncarteProduto = require('../../models/EncarteProdutos');
const Fabricante = require('../../models/Fabricante');
const Produto = require('../../models/Produto');


/* ------------------------------------------------------------------
   GET  /encartes/editar/:id   –  formulário de edição
   ------------------------------------------------------------------*/
async function mostrarFormularioEdicao(req, res) {
  try {
    const { id } = req.params;

    /* 1) ---------------------------------------------------------------- */
    const encarte = await Encarte.findByPk(id);
    if (!encarte) return res.status(404).send('Encarte não encontrado');

    /* 2) ---------------------------------------------------------------- *
     * Busca todos os registros pivot - vamos ignorar quadroId <= 0
     * e já carregar largura  (1 = simples, 2 = duplo, 3 = triplo)         */
    const pivots = await EncarteProduto.findAll({
      where: { encarteId: id },
      order: [['quadroId', 'ASC']]
    });

    /* 3) ---------------------------------------------------------------- *
     * Construímos:
     *   → selectedProductIds :  Set<string>
     *   → quadroInfoMap      :  { [groupId]: { order, timestamp, largura } }
     */
    const selectedProductIds = new Set();
    const quadroInfoMap = {};
    let tsCounter = 1;

    for (const ep of pivots) {
      if (ep.quadroId <= 0) continue;                // ignora “lixo” de versões antigas

      const prod = await Produto.findByPk(ep.produtoId);
      if (!prod) continue;

      selectedProductIds.add(String(prod.id));

      /* monta o mesmo groupId usado na view (prod-<fab>-<extra1-slug>) */
      const fabCode = prod.codigoFabricante || 'nao-identificado';
      const extraKey = prod.extra1 || 'Sem Identificação';
      const slug = extraKey.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]+/g, '');

      const groupId = fabCode === 'nao-identificado'
        ? `prod-nao-identificado-${slug}`
        : `prod-${fabCode}-${slug}`;

      quadroInfoMap[groupId] = {
        order: ep.quadroId,              // posição final (quadroId > 0)
        timestamp: tsCounter++,              // preserva ordem de gravação
        largura: ep.largura || 1           // 1,2 ou 3  (triplo = 3)
      };
    }

    /* 4) ---------------------------------------------------------------- *
     * Catálogo de fabricantes / produtos para montar os acordeões         */
    const fabricantes = await Fabricante.findAll({ order: [['nomeFabricante', 'ASC']] });
    const produtos = await Produto.findAll({ order: [['nome', 'ASC']] });

    /* 5) ---------------------------------------------------------------- *
     * Monta:  fabricantesMap[ codigo ] = { fabricante, produtos:{ extra1:[] } }
     */
    const fabricantesMap = {};
    fabricantes.forEach(f => {
      fabricantesMap[f.codigoFabricante] = { fabricante: f, produtos: {} };
    });

    produtos.forEach(p => {
      const code = p.codigoFabricante;
      if (!fabricantesMap[code]) return;           // ficará em “sem fab”
      const key = p.extra1 || 'Sem Identificação';
      fabricantesMap[code].produtos[key] ??= [];
      fabricantesMap[code].produtos[key].push(p);
    });

    /* 6) ---------------------------------------------------------------- *
     * Produtos sem fabricante                                             */
    const gruposSemFab = {};
    produtos.filter(p => !fabricantesMap[p.codigoFabricante])
      .forEach(p => {
        const key = p.extra1 || 'Sem Identificação';
        gruposSemFab[key] ??= [];
        gruposSemFab[key].push(p);
      });

    /* 7) ---------------------------------------------------------------- */
    res.render('editar', {
      encarte,
      fabricantesMap,
      gruposSemFab,
      selectedProductIds: Array.from(selectedProductIds),
      quadroInfoMap
    });

  } catch (err) {
    console.error('Erro ao mostrar edição:', err);
    res.status(500).send('Erro ao carregar formulário de edição.');
  }
}


/* ------------------------------------------------------------------
   POST /encartes/editar/:id    –  grava a edição
   ------------------------------------------------------------------*/
async function editarEncarte(req, res) {
  try {
    const { id } = req.params;
    const { titulo, textoLegal, textoLegalCapa } = req.body;

    /* 1) ---------------------------------------------------------------- */
    const encarte = await Encarte.findByPk(id);
    if (!encarte) return res.status(404).send('Encarte não encontrado');

    /* 2) ---------------------------------------------------------------- */
    encarte.titulo = titulo;
    encarte.textoLegal = textoLegal;
    encarte.textoLegalCapa = textoLegalCapa;
    await encarte.save();

    /* 3) ---------------------------------------------------------------- *
     * Limpamos tudo e re-gravamos apenas dados válidos (>0)               */
    await EncarteProduto.destroy({ where: { encarteId: id } });

    let produtosSelecionados = req.body.produtosSelecionados || [];
    if (!Array.isArray(produtosSelecionados))
      produtosSelecionados = [produtosSelecionados];

    for (const sel of produtosSelecionados) {
      const [prodIdStr, groupId] = sel.split('|');
      const produtoId = parseInt(prodIdStr, 10);

      const quadroId = Number(req.body[`quadroId_${groupId}`]) || 0;
      const largura = Number(req.body[`largura_${groupId}`] || 1);

      if (quadroId > 0) {
        await EncarteProduto.create({
          encarteId: encarte.id,
          produtoId,
          quadroId,
          largura
        });
      }
    }

    /* 4) ---------------------------------------------------------------- *
     * Segurança extra: remove qualquer item com quadroId <= 0             */
    await EncarteProduto.destroy({
      where: {
        encarteId: id,
        quadroId: { [Op.lte]: 0 }
      }
    });

    /* 5) ---------------------------------------------------------------- */
    res.redirect('/encartes');

  } catch (err) {
    console.error('Erro ao editar encarte:', err);
    res.status(500).send('Erro ao editar encarte.');
  }
}


module.exports = {
  mostrarFormularioEdicao,
  editarEncarte
};
