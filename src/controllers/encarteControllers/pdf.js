const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const Encarte = require('../../models/Encarte');
const Produto = require('../../models/Produto');
const Fabricante = require('../../models/Fabricante');
const EncarteProdutos = require('../../models/EncarteProdutos');


async function gerarPDFInterno(encarte, baseUrl) {
    console.log("Encarte recebido:", baseUrl);
    // Tente extrair a chave primária de forma genérica:
    const encarteId = encarte.id || encarte.codigo || encarte.encarteId;

    const pivot = await EncarteProdutos.findAll({
        where: { encarteId: encarteId },
        order: [['quadroId', 'ASC']]
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
            produtosCompletos.push(produtoObj);
        }
    }
    const grupos = groupByExtra1InOrder(produtosCompletos);
    const { capaGroups, internasGroups, contracapaGroups } = paginarGrupos(grupos);
    let html = await montarHTMLCompleto(capaGroups, internasGroups, contracapaGroups, encarte);

    html = html
        .replace(/src="\/img\/produtos\/(.*?)"/g, (match, imgPath) => `src="${baseUrl}/img/produtos/${imgPath}"`)
        .replace(/src="\/img\/logos\/(.*?)"/g, (match, imgPath) => `src="${baseUrl}/img/logos/${imgPath}"`)
        .replace(/src="\/img\/logo-santista\.png"/g, () => `src="${baseUrl}/img/logo-santista.png"`)
        .replace(/url\(['"]?\/img\/fundo-capa\.png['"]?\)/g, () => `url("${baseUrl}/img/fundo-capa.png")`)
        .replace(/url\(['"]?\/img\/blue-line-interna\.png['"]?\)/g, () => `url("${baseUrl}/img/blue-line-interna.png")`)
        .replace(/src="\/img\/rodape-capa\.png"/g, () => `src="${baseUrl}/img/rodape-capa.png"`)
        .replace(/src="\/img\/logo-interno\.png"/g, () => `src="${baseUrl}/img/logo-interno.png"`)
        .replace(/src="\/img\/rodape-contracapa\.png"/g, () => `src="${baseUrl}/img/rodape-contracapa.png"`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.setContent(html, { waitUntil: 'load', timeout: 0 });
    await page.evaluate(async () => {
        const images = document.images;
        for (let img of images) {
            await new Promise((resolve) => {
                if (img.complete) resolve();
                else img.onload = img.onerror = resolve;
            });
        }
    });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const pdfName = `encarte-${encarte.id}-${Date.now()}.pdf`;
    const pdfFolder = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(pdfFolder)) {
        fs.mkdirSync(pdfFolder, { recursive: true });
    }
    const pdfPath = path.join(pdfFolder, pdfName);
    fs.writeFileSync(pdfPath, pdfBuffer);
    encarte.pdfPath = pdfName;
    await encarte.save();

    console.log("PDF gerado com sucesso:", pdfPath);
    return pdfBuffer; // Retorno opcional (caso precise do buffer)
}

async function gerarPDF(req, res) {
    try {
        const { id } = req.params;
        const encarte = await Encarte.findByPk(id);
        if (!encarte) return res.status(404).send('Encarte não encontrado');

        const baseUrl = req.protocol + '://' + req.get('host');
        const pdfBuffer = await gerarPDFInterno(encarte, baseUrl);

        res.contentType('application/pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        res.status(500).send('Erro ao gerar PDF.');
    }
}

module.exports = {
    gerarPDFInterno,
    gerarPDF
};