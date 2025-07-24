// src/services/idealSoftService.js
const axios = require('axios');
const crypto = require('crypto');
const Token = require('../models/Token');
const Produto = require('../models/Produto');

const IDEALSOFT_HOST = process.env.IDEALSOFT_HOST || 'http://168.90.51.22';
const IDEALSOFT_PORT = process.env.IDEALSOFT_PORT || '60000';
const IDEALSOFT_SECRET = process.env.IDEALSOFT_SECRET || 'encarte2025';

/**
 * Gera assinatura via HMAC-SHA256 em base64,
 * simulando a função em PHP:
 * hash_hmac('sha256', strtolower(method) + timestamp, secret, true)
 */
function gerarAssinatura(method, timestamp, secret) {
  const data = method.toLowerCase() + timestamp;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('base64');
}

class IdealSoftService {
  static async autenticar(serie, codFilial) {
    const method = 'GET';
    const timestamp = Date.now().toString();
    const signature = gerarAssinatura(method, timestamp, IDEALSOFT_SECRET);
    const url = `${IDEALSOFT_HOST}:${IDEALSOFT_PORT}/auth?serie=${encodeURIComponent(serie)}&codfilial=${encodeURIComponent(codFilial)}`;
    const headers = {
      Authorization: 'Basic xxxxxx',
      Timestamp: timestamp,
      Signature: signature,
      CodFilial: codFilial
    };

    try {
      const response = await axios.get(url, { headers });
      if (!response.data.sucesso) {
        throw new Error(response.data.mensagem || 'Falha ao autenticar');
      }
      const novoToken = await Token.create({
        token: response.data.dados.token,
        expireAt: response.data.dados.expireAt
      });
      return novoToken;
    } catch (error) {
      console.error('Erro ao autenticar:', error.message);
      throw error;
    }
  }

  static async obterTokenValido() {
    const agora = new Date();
    return Token.findOne({
      where: { expireAt: { $gt: agora } },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Busca produtos paginados e integra-os no banco.
   * Se o produto (identificado pelo SKU, representado por p.codigo) já existir,
   * compara os campos relevantes e atualiza o registro se houver divergências.
   * Caso contrário, cria o novo registro.
   *
   * No campo de preços, este método busca no array de preços o item cujo campo "tabela"
   * seja "TABELA 3" (comparado em uppercase) e utiliza o valor deste item para o campo
   * precoTabela3. Os demais preços (Tabela 1, Tabela 2, Preço Custo e Preço Custo Médio)
   * serão definidos como 0.
   */
  static async buscarProdutos(debug = false) {
    // Obtém token válido (ou autentica, se necessário)
    let tokenRow = await this.obterTokenValido();
    if (!tokenRow) {
      tokenRow = await this.autenticar('HIEAPA-606996-UVFS', 1);
    }
    const tokenValido = tokenRow.token;

    let pagina = 1;
    const todosProdutos = [];
    while (true) {
      const method = 'GET';
      const timestamp = Date.now().toString();
      const signature = gerarAssinatura(method, timestamp, IDEALSOFT_SECRET);
      const url = `${IDEALSOFT_HOST}:${IDEALSOFT_PORT}/produtos/${pagina}`;
      const headers = {
        Authorization: `Token ${tokenValido}`,
        Timestamp: timestamp,
        Signature: signature,
        CodFilial: '1'
      };

      try {
        const resp = await axios.get(url, { headers });
        const data = resp.data;
        if (!data.sucesso || data.tipo === 'FIM_DE_PAGINA' || !data.dados?.length) {
          break;
        }
        todosProdutos.push(...data.dados);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error.message);
        break;
      }
      pagina++;
    }

    // Integra os produtos no banco
    for (const p of todosProdutos) {
      // Usamos "codigo" como SKU único
      const sku = p.codigo;
      let produtoExistente = await Produto.findOne({ where: { codigo: sku } });

      if (produtoExistente) {
        let atualizar = false;
        // Lista de campos para verificação e atualização
        const campos = [
          'nome',
          'extra1',
          'extra2',
          'extra3',
          'observacao1',
          'observacao2',
          'observacao3',
          'tipo',
          'codigoClasse',
          'codigoSubclasse',
          'codigoGrupo',
          'codigoMoeda',
          'codigoFamilia',
          'codigoUnidadeVenda',
          'codigoPesquisa1',
          'codigoPesquisa2',
          'codigoPesquisa3',
          'pesoLiquido',
          'pesoBruto',
          'estoqueAtual',
          'codigoFabricante',
          'webObs1',
          'webObs2',
          'inativo',
          'altura',
          'largura',
          'comprimento',
          'codigoBarras',
          'urlDetalhe',
          'urlEstoqueDetalhe',
          'urlTabelaPreco',
          'urlPromocoes',
          'urlFotos',
          'nomeSite'
        ];
        for (const campo of campos) {
          if (produtoExistente[campo] != p[campo]) {
            produtoExistente[campo] = p[campo];
            atualizar = true;
          }
        }
        // Trata dos preços: buscamos no array de preços o item cuja tabela seja "TABELA 3"
        const precosIdeais = p.precos || [];
        let precoTabela3 = 0;
        for (const precoItem of precosIdeais) {
          if (precoItem.tabela && precoItem.tabela.toUpperCase() === "TABELA 3") {
            precoTabela3 = precoItem.preco;
            break;
          }
        }
        // Define os demais preços como 0
        const precoTabela1 = 0;
        const precoTabela2 = 0;
        const precoCusto = 0;
        const precoCustoMedio = 0;

        if (produtoExistente.precoTabela1 != precoTabela1) {
          produtoExistente.precoTabela1 = precoTabela1;
          atualizar = true;
        }
        if (produtoExistente.precoTabela2 != precoTabela2) {
          produtoExistente.precoTabela2 = precoTabela2;
          atualizar = true;
        }
        if (produtoExistente.precoTabela3 != precoTabela3) {
          produtoExistente.precoTabela3 = precoTabela3;
          atualizar = true;
        }
        if (produtoExistente.precoCusto != precoCusto) {
          produtoExistente.precoCusto = precoCusto;
          atualizar = true;
        }
        if (produtoExistente.precoCustoMedio != precoCustoMedio) {
          produtoExistente.precoCustoMedio = precoCustoMedio;
          atualizar = true;
        }
        if (atualizar) {
          await produtoExistente.save();
          console.log(`Produto ${sku} atualizado.`);
        } else {
          console.log(`Produto ${sku} sem alterações.`);
        }
      } else {
        // Cria o novo produto
        const precosIdeais = p.precos || [];
        let precoTabela3 = 0;
        for (const precoItem of precosIdeais) {
          if (precoItem.tabela && precoItem.tabela.toUpperCase() === "TABELA 3") {
            precoTabela3 = precoItem.preco;
            break;
          }
        }
        const precoTabela1 = 0;
        const precoTabela2 = 0;
        const precoCusto = 0;
        const precoCustoMedio = 0;

        await Produto.create({
          ordem: p.ordem,
          codigo: p.codigo,
          nome: p.nome,
          extra1: p.extra1,
          extra2: p.extra2,
          extra3: p.extra3,
          observacao1: p.observacao1,
          observacao2: p.observacao2,
          observacao3: p.observacao3,
          tipo: p.tipo,
          codigoClasse: p.codigoClasse,
          codigoSubclasse: p.codigoSubclasse,
          codigoGrupo: p.codigoGrupo,
          codigoMoeda: p.codigoMoeda,
          codigoFamilia: p.codigoFamilia,
          codigoUnidadeVenda: p.codigoUnidadeVenda,
          codigoPesquisa1: p.codigoPesquisa1,
          codigoPesquisa2: p.codigoPesquisa2,
          codigoPesquisa3: p.codigoPesquisa3,
          pesoLiquido: p.pesoLiquido,
          pesoBruto: p.pesoBruto,
          estoqueAtual: p.estoqueAtual,
          codigoFabricante: p.codigoFabricante,
          webObs1: p.webObs1,
          webObs2: p.webObs2,
          inativo: p.inativo,
          altura: p.altura,
          largura: p.largura,
          comprimento: p.comprimento,
          codigoBarras: p.codigoBarras,
          urlDetalhe: p.urlDetalhe,
          urlEstoqueDetalhe: p.urlEstoqueDetalhe,
          urlTabelaPreco: p.urlTabelaPreco,
          urlPromocoes: p.urlPromocoes,
          urlFotos: p.urlFotos,
          nomeSite: p.nomeSite,
          precoTabela1,
          precoTabela2,
          precoTabela3,
          precoCusto,
          precoCustoMedio
        });
        console.log(`Produto ${sku} inserido.`);
      }
    }

    if (debug) {
      console.log(`\n[SINC FINALIZADA] => Total de produtos integrados: ${todosProdutos.length}`);
    }

    return todosProdutos.length;
  }

  /**
   * Novo método para buscar fabricantes via integração.
   * Este método chama o endpoint /aux/fabricantes com as mesmas credenciais,
   * e retorna um array com os fabricantes. Cada item deve conter os campos
   * codigoFabricante e nomeFabricante.
   */
  static async buscarFabricantes(debug = false) {
    let tokenRow = await this.obterTokenValido();
    if (!tokenRow) {
      tokenRow = await this.autenticar('HIEAPA-606996-UVFS', 1);
    }
    const tokenValido = tokenRow.token;

    const method = 'GET';
    const timestamp = Date.now().toString();
    const signature = gerarAssinatura(method, timestamp, IDEALSOFT_SECRET);
    const url = `${IDEALSOFT_HOST}:${IDEALSOFT_PORT}/aux/fabricantes`;
    const headers = {
      Authorization: `Token ${tokenValido}`,
      Timestamp: timestamp,
      Signature: signature,
      CodFilial: '1'
    };

    try {
      const response = await axios.get(url, { headers });
      const data = response.data;
      if (!data.sucesso || !data.dados?.length) {
        if (debug) {
          console.log('Nenhum fabricante retornado pelo IdealSoft.');
        }
        return [];
      }
      if (debug) {
        console.log(`Fabricantes retornados: ${data.dados.length}`);
      }

      // Ajustamos pois o JSON vem com "codigo" e "nome"
      return data.dados.map(item => ({
        // Forçamos string e removemos espaços, caso existam
        codigoFabricante: String(item.codigo || '').trim(),
        nomeFabricante: String(item.nome || '').trim()
      }));
    } catch (error) {
      console.error('Erro ao buscar fabricantes:', error.message);
      throw error;
    }
  }


}

module.exports = IdealSoftService;
