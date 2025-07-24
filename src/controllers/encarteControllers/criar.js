const Encarte = require('../../models/Encarte');
const EncarteProdutos = require('../../models/EncarteProdutos');
const { Op } = require('sequelize');


async function criar(req, res) {
    try {
        const { titulo, textoLegal, textoLegalCapa } = req.body;

        // 1) Cria o encarte
        const encarte = await Encarte.create({ titulo, textoLegal, textoLegalCapa });

        // 2) Extrai e insere apenas os produtos com quadroId > 0
        let produtosSelecionados = req.body.produtosSelecionados || [];
        if (!Array.isArray(produtosSelecionados)) {
            produtosSelecionados = [produtosSelecionados];
        }

        for (const sel of produtosSelecionados) {
            const [prodIdStr, groupId] = sel.split('|');
            const prodId = parseInt(prodIdStr, 10);
            const quadroOrd = Number(req.body[`quadroId_${groupId}`]) || 0;
            const largura = Number(req.body[`largura_${groupId}`] || 1);
            // só insere se a posição for válida (> 0)
            if (quadroOrd > 0) {
                await EncarteProdutos.create({
                      encarteId : encarte.id,
                      produtoId : prodId,
                      quadroId  : quadroOrd,
                      largura   : largura      // ← campo novo na tabela
                    });
            }
        }

        // 3) Limpeza extra: remove qualquer linha que tenha escapado com quadroId <= 0
        await EncarteProdutos.destroy({
            where: {
                encarteId: encarte.id,
                quadroId: { [Op.lte]: 0 }
            }
        });

        // 4) Conclui
        res.redirect('/encartes');
    } catch (error) {
        console.error('Erro ao criar encarte:', error);
        res.status(500).send('Erro ao criar encarte.');
    }
}

module.exports = {
    criar
};