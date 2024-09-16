import { AnuncioRepository } from "../repository/anuncioRepository.js";
import { MpkIntegracaoRepository } from "../repository/mpkIntegracaoRepository.js";
import { AnuncioHubRepository } from "../repository/anuncioHubRepository.js";
import { EstoqueRepository } from "../repository/estoqueRepository.js";
import { lib } from "../utils/lib.js";
import { TMongo } from "../infra/mongoClient.js";
import { TStorage } from "../services/storageService.js";
import { fbImage } from "../infra/fbImage.js";
import path from 'path';


//pego os anuncios e envio para komache hub
async function init() {
  //sim primeiro preciso receber oque foi processado , tem controle pra saber
  await AnuncioHubRepository.recebeAnunciosProcessado();

  await enviarEstoque();
  await enviarAnunciosPendentes();

  //sim estou repetindo o comando novamente ,
  await AnuncioHubRepository.recebeAnunciosProcessado();
}

async function enviarEstoque() {
  const estoqueRepository = new EstoqueRepository(
    await TMongo.connect(),
    lib.config_id_tenant()
  );
  let rows = await AnuncioHubRepository.getEstoqueByStatus({ status: 0 });

  if (!rows || !Array.isArray(rows)) return;
  try {
    await estoqueRepository.updateEstoqueMany(rows);
  } catch (error) { }
}

//isso aqui pode ser movido para outra camada
async function enviarAnunciosPendentes() {
  const anuncio = new AnuncioRepository(
    await TMongo.connect(),
    lib.config_id_tenant()
  );
  let integracoes = await MpkIntegracaoRepository.findAll();

  for (let integracao of integracoes) {
    let rows = await AnuncioHubRepository.getAnuncios(
      integracao.id,
      0,
      99,
      0,
      0,
      " WHERE STATUS=0 "
    );
    if (!rows || !Array.isArray(rows)) return;

    for (let row of rows) {
      await anuncio.update(row?.id, row); // Ganhar velocidade instanciando apenas 1 X
    }
  }
}

async function doEnviarImagensProduto(req, res) {

  let items = await enviarImagensProduto(req.body);
  res.send({ message: "OK", items });
}

async function sendImageToStorage(id_produto) {
  let rows = await fbImage.fbImageByIdProduto(id_produto);
  if (!rows || !Array.isArray(rows)) return;
  let local_path = path.join(process.cwd(), 'images');

  let position = 1;
  for (let row of rows) {
    let filename = String(row.id_produto) + "-" + position++ + ".jpg";
    fbImage.saveBase64AsJpg(row.imagem_base64, filename).then(
      (r) => {
        let fullFileName = path.join(local_path, filename);
        TStorage.upload(null, fullFileName);
      }
    );
  }
}

async function enviarImagensProduto(body) {
  let imagens_externas = body;
  if (!imagens_externas || !Array.isArray(imagens_externas)) return;
  let items = [];
  for (let imagem of imagens_externas) {
    await sendImageToStorage(imagem.id_produto);
    items.push({ id_produto: imagem.id_produto });
  }
  return items;
}

export const anuncioController = {
  init,
  doEnviarImagensProduto
};
