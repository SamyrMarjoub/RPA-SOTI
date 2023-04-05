import puppeteer from "puppeteer";
import ftp from 'basic-ftp'
// const cron = require('node-cron');
import cron from 'node-cron'
// const fs = require('fs');
// const path = require('path');
import fs from 'fs'
import path from 'path'

function start() {
    (async () => {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        const dataAtual = new Date();
        const dataAtual2 = new Date();

        dataAtual2.setDate(1);
        const diaF = dataAtual2.getDate().toString().padStart(2, '0');
        const mesF = (dataAtual2.getMonth() + 1).toString().padStart(2, '0');
        const anoF = dataAtual2.getFullYear();
        const primeiroDiaDoMes = `${diaF}/${mesF}/${anoF}`;
        const dia = dataAtual.getDate().toString().padStart(2, '0');
        const mes = (dataAtual.getMonth() + 1).toString().padStart(2, '0');
        const ano = dataAtual.getFullYear();
        const dataFormatada = `${dia}/${mes}/${ano}`;

        await page.goto('http://192.168.7.226:8080/SOTI/');

        // Set screen size
        await page.setViewport({ width: 1080, height: 1024 });

        // Type into search box
        await page.type("[type='text']", 'rpa');
        await page.type("[type='password']", "oL1iEGu@hX4h0zv5Ly@q")
        await page.click("[type='submit']")
        await page.waitForNavigation()
        await page.goto("http://192.168.7.226:8080/SOTI/consultabilhetagemlazy.xhtml")
        await page.type("#dtIni_input", primeiroDiaDoMes)
        await page.type("#dtFim_input", dataFormatada)
        await page.type("#txtHoraInicial", "0000")
        await page.type("#txtHoraFinal", "0000")
        const gravarBtnref = "#btnGravar"
        await page.waitForSelector(gravarBtnref)
        await page.click(gravarBtnref)

        const intervalo = setInterval(async () => {
            // const sel = document.querySelector(".ui-dialog-content")
            const sel = await page.$eval("#j_idt239", el => el.ariaHidden)
            // console.log(sel)
            if (sel === "false") {
                console.log("Carregando...")
                return
            }
            else {
                setTimeout(async () => {
                    const ref = "[name='j_idt196:j_idt197']"
                    // await page.waitForSelector(ref)
                    await page.click(ref)
                    console.log("Baixado")
                    const client = new ftp.Client();
                    client.ftp.verbose = true;
                    try {
                        await client.access({
                            host: "57400550edb3.sn.mynetname.net/",
                            user: "soti",
                            password: "MZO&xU543wt#",
                            secure: true
                        });
                        const downloadDir = path.join(process.env.HOME, 'Downloads');
                        const files = fs.readdirSync(downloadDir);
                        const firstFile = files.find(file => fs.statSync(path.join(downloadDir, file)).isFile());

                        // fazer upload do arquivo encontrado
                        await client.uploadFrom(path.join(downloadDir, firstFile), `/${firstFile}`);

                    } catch (err) {
                        console.log(err);
                    }
                    client.close();
                    setTimeout(async () => {
                        await browser.close()
                    }, 10000);

                }, 1000)
                clearInterval(intervalo)
            }
        }, 1000)


    })();
}

start()

cron.schedule("0 7,11,17 * * *", ()=>{
    start()
})

// setInterval(() => {
//     start()
// }, 86400000 - 1)