import puppeteer from "puppeteer";
import ftp from 'basic-ftp'
import cron from 'node-cron'
import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv' 
dotenv.config()

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

        await page.goto(process.env.BASE_URL);

        // Set screen size
        await page.setViewport({ width: 1080, height: 1024 });

        // Type into search box
        await page.type("[type='text']", process.env.RPA_LOGIN);
        await page.type("[type='password']", process.env.RPA_PASSWORD)
        await page.click("[type='submit']")
        await page.waitForNavigation()
        await page.goto(process.env.URL_TWO)
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

                    setTimeout(async () => {

                        const client = new ftp.Client();
                        client.ftp.verbose = true;

                        try {
                            await client.access({
                                host: process.env.HOST,
                                user: process.env.USER,
                                password: process.env.PASS,
                                secure: true,
                                secureOptions: {
                                    rejectUnauthorized: false
                                },
                                connTimeout: 60000 // aumentar o tempo limite de conexão,
                            });

                            const downloadDir = path.join(process.env.HOME, 'Downloads');
                            const files = fs.readdirSync(downloadDir);
                            const firstFile = files.find(file => fs.statSync(path.join(downloadDir, file)).isFile());
                            const newFileName = `${mes}${ano}.csv`;
                            fs.renameSync(path.join(downloadDir, firstFile), path.join(downloadDir, newFileName));

                            // esperar um pouco para garantir que o arquivo foi baixado completamente
                            await new Promise(resolve => setTimeout(resolve, 10000));

                            // fazer upload do arquivo encontrado
                            await client.uploadFrom(path.join(downloadDir, newFileName), `/${newFileName}`);
                            console.log("Arquivo enviado com sucesso");
                            client.close();

                        } catch (err) {
                            console.log(err);
                        }




                        await browser.close()
                    }, 10000);

                }, 1000)
                clearInterval(intervalo)
            }
        }, 1000)


    })();
}

start()

cron.schedule("0 7 * * *", () => {
    start()
})

