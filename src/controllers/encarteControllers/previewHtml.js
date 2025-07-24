const fs = require('fs');
const path = require('path');

const Encarte = require('../../models/Encarte');
const Produto = require('../../models/Produto');
const Fabricante = require('../../models/Fabricante');
const EncarteProdutos = require('../../models/EncarteProdutos');

function montarLinhas(blocosData) {
  const linhas = [];
  let i = 0;

  while (i < blocosData.length) {
    const blocoAtual = blocosData[i];

    // SE for 'novo' ou 'triplo' => linha ocupa 3 col.
    if (blocoAtual.tipo === 'novo' || blocoAtual.tipo === 'triplo') {
      linhas.push({
        lineType: '1-row-3-col-novo',
        blocos: [blocoAtual]
      });
      i++; // Avança apenas 1 (não mistura nada na mesma linha)

    // SE for 'duplo'
    } else if (blocoAtual.tipo === 'duplo') {
      // Se o próximo também for 'duplo' => 4 col em uma linha
      if (i + 1 < blocosData.length && blocosData[i + 1].tipo === 'duplo') {
        linhas.push({
          lineType: '1-row-4-col-duplos',
          blocos: [blocoAtual, blocosData[i + 1]]
        });
        i += 2;
      } else {
        // Caso contrário, tenta encaixar com simples/duplo dentro de 3 col
        let linha = [blocoAtual];
        let colunasOcupadas = 2;
        i++;
        while (
          i < blocosData.length &&
          (blocosData[i].tipo === 'simples' || blocosData[i].tipo === 'duplo') &&
          colunasOcupadas < 3
        ) {
          const cand = blocosData[i];
          const precisa = (cand.tipo === 'duplo') ? 2 : 1;
          if (colunasOcupadas + precisa <= 3) {
            linha.push(cand);
            colunasOcupadas += precisa;
            i++;
          } else {
            break;
          }
        }
        linhas.push({
          lineType: '1-row-3-col',
          blocos: linha
        });
      }

    // SE for 'simples'
    } else {
      let linha = [blocoAtual];
      let colunasOcupadas = 1;
      i++;
      while (
        i < blocosData.length &&
        (blocosData[i].tipo === 'simples' || blocosData[i].tipo === 'duplo') &&
        colunasOcupadas < 3
      ) {
        const cand = blocosData[i];
        const precisa = (cand.tipo === 'duplo') ? 2 : 1;
        if (colunasOcupadas + precisa <= 3) {
          linha.push(cand);
          colunasOcupadas += precisa;
          i++;
        } else {
          break;
        }
      }
      linhas.push({
        lineType: '1-row-3-col',
        blocos: linha
      });
    }
  }

  return linhas;
}

function renderLinhas(linhas) {
  let html = '';

  for (const { lineType, blocos } of linhas) {
    // 1) Linha comum de até 3 colunas
    if (lineType === '1-row-3-col') {
      html += `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr);">
      `;
      for (const bloco of blocos) {
        if (bloco.tipo === 'duplo') {
          // Duplo ocupa 2 colunas
          html += `<div style="grid-column: span 2;">${bloco.html}</div>`;
        } else {
          // Simples ocupa 1 coluna
          html += `<div>${bloco.html}</div>`;
        }
      }
      html += `</div>`;

    // 2) Dois duplos em sequência => 4 col
    } else if (lineType === '1-row-4-col-duplos') {
      html += `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr);">
        <div style="grid-column: span 2;">${blocos[0].html}</div>
        <div style="grid-column: span 2;">${blocos[1].html}</div>
      </div>
      `;

    // 3) NOVO/TRIPLO => linha única ocupando 3 colunas
    } else if (lineType === '1-row-3-col-novo') {
      // Esse bloco sozinho preenche as 3 colunas
      const blocoNovo = blocos[0];
      html += `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr);">
        <!-- Faz o bloco 'novo' ocupar as 3 colunas -->
        <div style="grid-column: 1 / span 3;max-height:190px;">
          ${blocoNovo.html}
        </div>
      </div>
      `;
    }
  }

  return html;
}

async function montarBlocoGrupo(group) {
  try {
    const products = group.products;
    // Ordena os produtos com base no quadroId (ou 0 se não definido)
    products.sort((a, b) => (a.quadroId || 0) - (b.quadroId || 0));

    const blocoNome = group.extra1;
    const varCount  = products.length;
    const largura = products[0].largura || 1;     
    let   tipo    = 'simples';
    
    if (largura === 3) {
      tipo = 'triplo';
    } else if (varCount > 17) {
      tipo = 'novo';       
    } else if (largura === 2 || varCount > 6) {
      tipo = 'duplo';
    }

    // Primeiro produto para referência
    const firstProd = products[0];
    const fabricante = firstProd.codigoFabricante
      ? await Fabricante.findOne({ where: { codigoFabricante: firstProd.codigoFabricante } })
      : null;
    const logoFabricante = (fabricante && fabricante.imagemFabricante)
      ? `/img/logos/${fabricante.imagemFabricante}`
      : '/img/logos/no-image.png';

    // Coleta os SKUs de todas as variações deste grupo
    const skus = products.map(p => p.codigo);
    // Busca a imagem dinamicamente: verifica cada SKU conforme a regra definida
    const imagemProduto = await buscarImagemPorSKU(skus);

    // Função auxiliar para gerar as linhas da tabela
    function gerarLinhas(prods) {
      return prods.map(prod => {
        let precoTabela3 = prod.precoTabela3 ? parseFloat(prod.precoTabela3) : 0;
        if (isNaN(precoTabela3)) precoTabela3 = 0;
        return `
          <tr>
            <td style="width:8%;">${prod.codigo}</td>
            <td style="width:76%;">${prod.extra2 || ''}</td>
            <td style="width:8%;">${!isNaN(parseInt(prod.extra3, 10)) ? parseInt(prod.extra3, 10) : 0}</td>
            <td style="width:8%; color:#fff; background-color:#00a650;">${precoTabela3.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }

    // Função auxiliar para calcular a altura da área de imagem com base no número de linhas
    function calcAlturaImg(rowCount) {
      switch (rowCount) {
        case 1: return 70;
        case 2: return 65;
        case 3: return 50;
        case 4: return 50;
        case 5: return 40;
        case 6: return 40;
        default: return 20;
      }
    }

    let html;
    if (tipo === 'novo') {
      // Para "novo": layout com 3 colunas internas
      const col1 = products.slice(0, 5);
      const col2 = products.slice(5, 17);
      const col3 = products.slice(17);
      const alturaImg = calcAlturaImg(5);

      html = `
        <div class="quadro-novo" style="border: 1px solid #ddd; border-radius: 5px;">
          <div class="header-quadro">
            <p>${blocoNome}</p>
          </div>
          <span class="blue-line" style="display: block; width: 100%; height: 5px; background-color: #193c69;"></span>
          <div class="box-infos novo" style="
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 5px;
            padding: 5px;
          ">
            <!-- Coluna 1: Imagens + primeiras 5 variações -->
            <div style="border: 1px solid #ccc; padding: 5px;">
              <div style="display: flex; height: ${alturaImg}%; text-align: center; margin-bottom: 5px;">
                <div style="width:30%;">
                  <img style="max-height:100%; max-width:100%;" src="${logoFabricante}" alt="Fabricante" />
                </div>
                <div style="width:70%;">  
                  <img style="max-height:100%; max-width:100%;" src="${imagemProduto}" alt="Produto" />
                </div>
              </div>
              <table style="width:100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                  <tr style="background:#e6e7e8;">
                    <th style="width:8%;">CÓD</th>
                    <th style="width:79%;">DESCRIÇÃO</th>
                    <th style="width:8%;">QTD.</th>
                    <th style="width:5%;">R$/UND.</th>
                  </tr>
                </thead>
                <tbody>
                  ${gerarLinhas(col1)}
                </tbody>
              </table>
            </div>
            <!-- Coluna 2: Variações da 6ª até a 17ª -->
            <div style="border: 1px solid #ccc; padding: 5px;">
              <table style="width:100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                  <tr style="background:#e6e7e8;">
                    <th style="width:8%;">CÓD</th>
                    <th style="width:79%;">DESCRIÇÃO</th>
                    <th style="width:8%;">QTD.</th>
                    <th style="width:5%;">R$/UND.</th>
                  </tr>
                </thead>
                <tbody>
                  ${gerarLinhas(col2)}
                </tbody>
              </table>
            </div>
            <!-- Coluna 3: Variações a partir da 18ª -->
            <div style="border: 1px solid #ccc; padding: 5px;">
              <table style="width:100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                  <tr style="background:#e6e7e8;">
                    <th style="width:8%;">CÓD</th>
                    <th style="width:79%;">DESCRIÇÃO</th>
                    <th style="width:8%;">QTD.</th>
                    <th style="width:5%;">R$/UND.</th>
                  </tr>
                </thead>
                <tbody>
                  ${gerarLinhas(col3)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else if (tipo === 'duplo') {
      // Para "duplo": layout conforme implementação anterior
      const firstFive = products.slice(0, 5);
      const remaining = products.slice(5);
      const alturaImg = calcAlturaImg(varCount);
      
      html = `
        <div class="quadro-double" style="height:100%; border: 1px solid #ddd; border-radius: 5px;">
          <div class="header-quadro">
            <p>${blocoNome}</p>
          </div>
          <span class="blue-line" style="display: block; width: 100%; height: 5px; background-color: #193c69;"></span>
          <div class="box-infos double" style="display: flex; flex-direction: row;">
            <div style="width:50%; border-right: 1px solid #ccc; padding: 5px;">
              <div style="display: flex; height: ${alturaImg}%; text-align: center; margin-bottom: 5px;">
                <div style="width:30%;">
                  <img style="max-height:100%; max-width:100%;" src="${logoFabricante}" alt="Fabricante" />
                </div>
                <div style="width:70%;">  
                  <img style="max-height:100%; max-width:100%;" src="${imagemProduto}" alt="Produto" />
                </div>
              </div>
              <table style="width:100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                  <tr style="background:#e6e7e8;">
                    <th style="width:8%;">CÓD</th>
                    <th style="width:79%;">DESCRIÇÃO</th>
                    <th style="width:8%;">QTD.</th>
                    <th style="width:5%;">R$/UND.</th>
                  </tr>
                </thead>
                <tbody>
                  ${gerarLinhas(firstFive)}
                </tbody>
              </table>
            </div>
            <div style="width:50%; padding: 5px;">
              <table style="width:100%; border-collapse: collapse; font-size: 10px;">
                <thead>
                  <tr style="background:#e6e7e8;">
                    <th style="width:8%;">CÓD</th>
                    <th style="width:79%;">DESCRIÇÃO</th>
                    <th style="width:8%;">QTD.</th>
                    <th style="width:5%;">R$/UND.</th>
                  </tr>
                </thead>
                <tbody>
                  ${gerarLinhas(remaining)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else if (tipo === 'triplo') {

      const total      = products.length;
      const perCol     = Math.ceil(total / 3);
      const col1       = products.slice(0,  perCol);
      const col2       = products.slice(perCol, perCol * 2);
      const col3       = products.slice(perCol * 2);
      const alturaImg  = calcAlturaImg(perCol); 

      html = `
        <div class="quadro-triplo" style="border:1px solid #ddd;border-radius:5px;">
          <div class="header-quadro">
            <p>${blocoNome}</p>
          </div>
          <span class="blue-line" style="display:block;width:100%;height:5px;background-color:#193c69;"></span>
    
          <!-- PRIMEIRA LINHA (logo + foto) -->
          <div style="padding:5px;background-color:#fff;">
            <div style="display:flex;height:${alturaImg}%;text-align:center;margin-bottom:5px;">
              <div style="width:30%;"><img style="max-height:100%;max-width:100%;" src="${logoFabricante}" alt="" /></div>
              <div style="width:70%;"><img style="max-height:100%;max-width:100%;" src="${imagemProduto}"  alt="" /></div>
            </div>
    
            <!-- SEGUNDA LINHA – 3 tabelas iguais -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;">
              ${[col1, col2, col3].map(col=>`
                <table style="width:100%;border-collapse:collapse;font-size:10px;">
                  <thead>
                    <tr style="background:#e6e7e8;">
                      <th style="width:8%;">CÓD</th>
                      <th style="width:79%;">DESCRIÇÃO</th>
                      <th style="width:8%;">QTD.</th>
                      <th style="width:5%;">R$/UND.</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${gerarLinhas(col)}
                  </tbody>
                </table>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      const alturaImg = calcAlturaImg(varCount);
      html = `
        <div class="quadro" style="border: 1px solid #ddd; border-radius: 5px;">
          <div class="header-quadro">
            <p>${blocoNome}</p>
          </div>
          <span class="blue-line" style="display: block; width: 100%; height: 5px; background-color: #193c69;"></span>
          <div class="box-infos" style="padding: 5px;">
            <div style="display: flex; height: ${alturaImg}%; text-align: center; margin-bottom: 5px;">
              <div style="width:30%;">
                <img style="max-height:100%; max-width:100%;" src="${logoFabricante}" alt="Fabricante" />
              </div>
              <div style="width:70%;">  
                <img style="max-height:100%; max-width:100%;" src="${imagemProduto}" alt="Produto" />
              </div>
            </div>
            <table style="width:100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr style="background:#e6e7e8;">
                  <th style="width:8%;">CÓD</th>
                  <th style="width:79%;">DESCRIÇÃO</th>
                  <th style="width:8%;">QTD.</th>
                  <th style="width:5%;">R$/UND.</th>
                </tr>
              </thead>
              <tbody>
                ${gerarLinhas(products)}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    return { html, tipo };
  } catch (error) {
    console.error("Erro ao montar bloco do grupo:", error);
    return { html: `<div class="quadro erro">Erro ao carregar bloco</div>`, tipo: 'simples' };
  }
}

function groupByExtra1InOrder(produtos) {
  const groups = [];
  const map = new Map();

  for (const p of produtos) {
    // Usa "SemFab" para fabricante indefinido e "Sem Identificação" para extra1 indefinido
    const fabricanteKey = p.codigoFabricante || 'SemFab';
    const extraKey = p.extra1 || 'Sem Identificação';
    const key = `${fabricanteKey}|${extraKey}`;

    if (!map.has(key)) {
      const newGroup = { extra1: extraKey, codigoFabricante: fabricanteKey, products: [] };
      map.set(key, newGroup);
      groups.push(newGroup);
    }
    map.get(key).products.push(p);
  }

  // Ordena os grupos com base no menor quadroId encontrado em cada grupo
  groups.sort((a, b) => {
    const minA = Math.min(...a.products.map(p => p.quadroId || Infinity));
    const minB = Math.min(...b.products.map(p => p.quadroId || Infinity));
    return minA - minB;
  });

  return groups;
}

function paginarGrupos(groups) {
  function peso(g) {
      const largura = g.products[0].largura || 1;
      if (largura === 3) return 3;          // triplo (3 col.)
      if (largura === 2) return 2;          // duplo  (2 col.)
      const varCount = g.products.length;
      if (varCount > 17) return 3;          // layout “novo”
      if (varCount > 6)  return 2;          // duplo por quantidade
      return 1;                             // simples
    }

  let capaGroups = [];
  let capaWeight = 0;
  let i = 0;

  // CAPA (até 9 pontos)
  for (; i < groups.length; i++) {
    const w = peso(groups[i]);
    if (capaWeight + w <= 9) {
      capaGroups.push(groups[i]);
      capaWeight += w;
    } else {
      break;
    }
  }

  // CONTRACAPA (até 12 pontos)
  let contracapaGroups = [];
  let contracapaWeight = 0;
  let j = groups.length - 1;
  for (; j >= i; j--) {
    const w = peso(groups[j]);
    if (contracapaWeight + w <= 12) {
      contracapaGroups.unshift(groups[j]);
      contracapaWeight += w;
    } else {
      break;
    }
  }

  // INTERNAS (até 15 pontos por página)
  const internasFlat = groups.slice(i, j + 1);
  const internasGroups = [];
  let currentPage = [];
  let currentPageWeight = 0;

  for (const grupo of internasFlat) {
    const w = peso(grupo);
    if (currentPageWeight + w <= 15) {
      currentPage.push(grupo);
      currentPageWeight += w;
    } else {
      internasGroups.push(currentPage);
      currentPage = [grupo];
      currentPageWeight = w;
    }
  }
  if (currentPage.length > 0) {
    internasGroups.push(currentPage);
  }

  return { capaGroups, internasGroups, contracapaGroups };
}

async function buscarImagemPorSKU(skuOrArray) {
  const pasta = path.join(__dirname, '..', '..', 'public', 'img', 'produtos');
  try {
    const arquivos = await fs.promises.readdir(pasta);
    // Converte para array se necessário
    const skus = Array.isArray(skuOrArray) ? skuOrArray : [skuOrArray];
    for (const sku of skus) {
      // O lookbehind (?<=^|[-]) garante que o SKU seja precedido do início da string ou de um hífen
      // O lookahead (?=$|[-.]) garante que após o SKU venha o fim da string, um hífen ou um ponto.
      const regex = new RegExp('(?<=^|[-])' + sku + '(?=$|[-.])');
      const encontrado = arquivos.find(file => regex.test(file));
      if (encontrado) {
        return `/img/produtos/${encontrado}`;
      }
    }
  } catch (error) {
    console.error("Erro ao ler a pasta de produtos:", error);
  }
  return '/img/produtos/no-image.png';
}

async function montarHTMLCompleto(capaGroups = [], internasGroups = [], contracapaGroups = [], encarte) {
  const css = `
    @font-face {
        font-family: "Arial Narrow";
        src: url("https://db.onlinewebfonts.com/t/7c6661efce01eac269383bac79303c1b.eot");
        src: url("https://db.onlinewebfonts.com/t/7c6661efce01eac269383bac79303c1b.eot?#iefix")format("embedded-opentype"),
        url("https://db.onlinewebfonts.com/t/7c6661efce01eac269383bac79303c1b.woff2")format("woff2"),
        url("https://db.onlinewebfonts.com/t/7c6661efce01eac269383bac79303c1b.woff")format("woff"),
        url("https://db.onlinewebfonts.com/t/7c6661efce01eac269383bac79303c1b.ttf")format("truetype"),
        url("https://db.onlinewebfonts.com/t/7c6661efce01eac269383bac79303c1b.svg#Arial Narrow")format("svg");
    }
    * {
        font-family: 'Arial Narrow';
    }
    body { margin:0; padding:0; font-family: 'Arial Narrow'; }

    .titulo-encarte {
      font-size: 13px;
      position: absolute;
      top: 110px;
      right: 0;
      transform: rotate(270deg);
    }
    .texto-legal {
      color:#fff;
      position: absolute;
      right: 15px;
      writing-mode: vertical-rl;
      white-space: nowrap;
      font-size: 10px; 
    }
    .pagina { page-break-after: always; position: relative; min-height: 1000px; }
    .box-grids { padding: 30px 30px 0; }
    .capa {
      background-image: url('/img/fundo-capa.png');
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      min-height: 100vh;
    }
  .box-interna, .box-contracapa {
    width: 90%;
    /* Subtrai eventuais margens ou rodapés para manter o conteúdo dentro do "limite" da página */
    height: calc(100% - 60px);
    background-color: #f1f1f2;
    border-radius: 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

    .interna, .contracapa {
      min-height: 100vh;
      background-color: #00366d;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .quadro, .quadro-double { page-break-inside: avoid; background-color: #fff; border-radius: 10px; }
    .header-quadro {
      font-size: 17px;
      background-color: #c51e24; color: #fff;
      height: 30px; display: flex; justify-content: center; align-items: center;
      border-radius: 10px 10px 0 0;
    }
    .interna .header-quadro,
    .contracapa .header-quadro {
      font-size: 13px;
      background-color: #fff;
      color: #000;
      height: 20px;
      font-weight: 600;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 5px 5px 0 0;
    }
    .blue-line { display: block; width: 100%; height: 7px; background-color: #193c69; }
    .interna .blue-line { background-image: url('/img/blue-line-interna.png') }
    .contracapa .blue-line { background-image: url('/img/blue-line-interna.png') }
    .box-infos { height: 186.5px; display: flex; flex-direction: column; justify-content: space-between; }
    .interna .box-infos { height: 145px; }
    .contracapa .box-infos { height: 145px; }
    .logo-fabricante { height: 25px; }
    .box-tabela { width: 100%; display: flex; justify-content: center; align-items: center; }
    .tabela { border-collapse: collapse; width: 95%; margin-bottom: 5px; }
    th, td { color: rgb(0,0,0); border: 1px solid #ddd; text-align: center; background-color: #fff; }
    th {font-size: 9px; background: #e6e7e8; font-weight: 100;}
    
    td {font-size: 12px;padding: 0;margin: 0; line-height: 10px;font-weight: bold;}
    .logo-interno { width: 100%; text-align: center; }
    .logo-interno img { height: 50px; border-radius: 10px; border-color: gray; }
    .info-left { display: flex; flex-direction: column; justify-content: space-between; }
    .info-right .box-tabela { margin-top: 5px; }
    .rodape-contracapa { width: 100%; display: flex; justify-content: center; }
    .rodape-contracapa img { width: 100%; padding-top: 20px; }

    .texto-legal-capa {
        background-color: #00366d;
        color: #fff;
        width: 100%;
        display: flex;
        justify-content: center;
        text-align: center;
        font-size: 16px;
        height: 92px;
    }

    .texto-legal-capa p {
      width: 90%;
    }
  `;
  let totalPaginas = 0;
  if (capaGroups.length > 0) totalPaginas++;
  totalPaginas += internasGroups.length;
  if (contracapaGroups.length > 0) totalPaginas++;
  let currentPage = 1;
  let finalHTML = `<html lang="en" translate="no"><head><meta charset="UTF-8"><title>${encarte.titulo}</title><style>${css}</style></head><body>`;
  // CAPA
  if (capaGroups.length > 0) {
    const blocosData = await Promise.all(capaGroups.map(montarBlocoGrupo));
    const linhas = montarLinhas(blocosData);
    const blocosHTML = renderLinhas(linhas);
    finalHTML += `
      <div class="pagina capa">
        <div><img style="width:100%" src="/img/logo-santista.png" alt="Logo Santista"></div>
        <strong class="titulo-encarte">${encarte.titulo}</strong>
        <div class="box-grids">
          ${blocosHTML}
        </div>
        <div><img style="width:100%" src="/img/rodape-capa.png" alt="Rodape"></div>
        <div class="texto-legal-capa"><p>${encarte.textoLegalCapa || ''}</p></div>

      </div>
    `;
    currentPage++;
  }
  // INTERNAS
  for (const pageGroups of internasGroups) {
    const blocosData = await Promise.all(pageGroups.map(montarBlocoGrupo));
    const linhas = montarLinhas(blocosData);
    const blocosHTML = renderLinhas(linhas);
    const isPar = (currentPage % 2 === 0);
    const footerStyle = `
    position: absolute;
    bottom: 0px;
    font-size: 25px;
    color: #fff;
    font-weight: 700;
    background-color: #000;
    width: 20mm;
    height: 20mm;
      ${isPar ? 'border-radius: 0 200px 0 0;' : 'border-radius: 200px 0 0 0;'}
    display: flex;
    justify-content: center;
    align-items: center;
      ${isPar ? 'left: 1;' : 'right: 1;'}
    `;
    finalHTML += `
      <div class="pagina interna">
        <div class="box-interna">
          <p class="texto-legal">${encarte.textoLegal}</p>
          <div class="logo-interno"><img src="/img/logo-interno.png"></div>
          ${blocosHTML}
          <h3 style="text-align:left; margin: 0 0 10px 15px;"><strong>Televendas Santista: (41) 3607-0776</strong></h3>
        </div>
        <div style="${footerStyle}">${currentPage}</div>
      </div>
    `;
    currentPage++;
  }
  // CONTRACAPA
  if (contracapaGroups.length > 0) {
    const blocosData = await Promise.all(contracapaGroups.map(montarBlocoGrupo));
    const linhas = montarLinhas(blocosData);
    const blocosHTML = renderLinhas(linhas);
    finalHTML += `
      <div class="pagina contracapa">
        <p class="texto-legal">${encarte.textoLegal}</p>
        <div class="box-contracapa">
          ${blocosHTML}
        </div>
        <div class="rodape-contracapa">
          <img src="/img/rodape-contracapa.png" alt="Rodape Contracapa" />
        </div>
      </div>
    `;
    currentPage++;
  }
  finalHTML += `</body></html>`;
  return finalHTML;
}

async function previewHtml(req, res) {
  try {
    const { id } = req.params;
    const encarte = await Encarte.findByPk(id);
    if (!encarte) return res.status(404).send('Encarte não encontrado');

    const pivot = await EncarteProdutos.findAll({
      where : { encarteId: id },
      order : [['quadroId','ASC']],
      attributes : ['produtoId','quadroId','largura']   // ← inclui largura
    });
    const produtosCompletos = [];
    for (const row of pivot) {
      const p = await Produto.findByPk(row.produtoId);
      if (p) {
        const fabricante = p.codigoFabricante 
          ? await Fabricante.findOne({ where: { codigoFabricante: p.codigoFabricante } })
          : null;
        const produtoObj = p.toJSON();
        produtoObj.fabricante = fabricante ? fabricante.toJSON() : null;

        produtoObj.quadroId = row.quadroId;
        produtoObj.largura  = row.largura || 1;
        produtosCompletos.push(produtoObj);
      }
    }
    const grupos = groupByExtra1InOrder(produtosCompletos);
    const { capaGroups, internasGroups, contracapaGroups } = paginarGrupos(grupos);
    const conteudoHtml = await montarHTMLCompleto(capaGroups, internasGroups, contracapaGroups, encarte);

    // CSS para simular uma página A4
    const cssA4 = `
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        background: #ccc;
      }
      .a4-page {
        width: 215mm;
        margin: 0 auto;
        background: white;
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
        overflow: hidden;
        position: relative;
      }
    `;

    // Envolve o conteúdo gerado em um contêiner que simula o tamanho A4
    const previewHTML = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Preview Encarte</title>
        <style>
          ${cssA4}
          /* Você pode incluir outros estilos globais aqui, se necessário */
        </style>
      </head>
      <body>
        <div class="a4-page">
          ${conteudoHtml}
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(previewHTML);
  } catch (error) {
    console.error("Erro ao gerar preview HTML:", error);
    res.status(500).send('Erro ao gerar preview HTML.');
  }
}

module.exports = {
  previewHtml
}