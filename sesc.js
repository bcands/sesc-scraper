const jquery = require('jquery');
const fs = require('fs');
const writeStream = fs.createWriteStream('tabela.csv');
const Nightmare = require('nightmare');
const vo = require('vo');
const carregar = true;
const escrever = true;

//Write headers
writeStream.write(`Titulo,Data,Local,Link \n`);

vo.pipeline(function* () {
    let result;
    let fullDate = new Date();
    let gigs = [];

    const nightmare = Nightmare({ show: true });
    yield nightmare
        .goto('https://www.sescsp.org.br/programacao/#/content=#47#/fdata=tag%3D%26atividades%3D%26type%3D47%26calendar_dates%3D%26remove_dates%3D%26unities%3D36%26unities%3D9%26unities%3D25%26unities%3D72%26unities%3D681%26unities%3D1%26unities%3D601%26unities%3D2%26unities%3D3%26unities%3D7%26unities%3D4%26unities%3D5%26unities%3D6%26unities%3D69%26unities%3D781%26unities%3D10%26unities%3D11%26unities%3D38%26unities%3D26%26unities%3D37%26unities%3D12%26unities%3D13%26maxResults%3D10')
        .wait(2000);
    if (carregar) {
        while (yield nightmare.visible('.disable-scroll > .clearfix > .main-filtros > .bt-carregar-fix')) {
            yield nightmare
                .click('.disable-scroll > .clearfix > .main-filtros > .bt-carregar-fix')
                .wait(2000);
        };
    }
    // pega os links
    let grabLinks = yield nightmare.evaluate(() => {
        tempLinks = [];
        $('article.block_agenda').each(function () {
            tempLinks.push('https://www.sescsp.org.br' + $(this).find('a').attr('href'));
        })
        return tempLinks
    });

    for (let i = 0; i < grabLinks.length; i++) {
        yield nightmare.goto(grabLinks[i])
        //se a data de venda existir, pega a data e converte em int
        if (yield nightmare.visible('section.block_content_09.clearfix div p span')) {
            let diaVenda = yield nightmare.evaluate(() => {
                return $('section.block_content_09.clearfix div p span').text().replace(/\s\s+/g, '').replace(',', ';').split(' ')[0].split('/');
            });
            for (let i = 0; i < diaVenda.length; i++) {
                diaVenda[i] = parseInt(diaVenda[i], 10);
            };

            //se a data de venda for amanha, adiciona no array
            if (diaVenda[1] == fullDate.getMonth() + 2 && diaVenda[0] == 2) {
                gigs.push(yield nightmare.evaluate(function () {
                    item = {};
                    $('section.half_content.right h1').find('span').remove();
                    item.titulo = $('section.half_content.right h1').text().replace(/\s\s+/g, '').replace(',', ';');
                    item.local = $('section.half_content.right header.programacao_unidades.clearfix span a').text().replace(/\s\s+/g, '');
                    item.diaShow = $('blockquote.txt_datas_horarios').find('span').text().replace(/\s\s+/g, '').replace(',', ';');
                    item.diaVenda = $('section.block_content_09.clearfix div p span').text().replace(/\s\s+/g, '').replace(',', ';').split(' ')[0].split('/');
                    return item
                }));
                gigs[gigs.length - 1].link = grabLinks[i];
            }
        }
    }

    yield nightmare.end();

    return gigs;
})(function (err, result) {
    if (err) return console.log(err);
    //escrever csv
    if (escrever) {
        for (item of result) {
            writeStream.write(`${item.titulo},${item.diaShow},${item.local},${item.link} \n`,'utf8');
        }
    } else {
        console.log(result);
    }

});