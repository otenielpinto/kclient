import { AnuncioRepository } from "../repository/anuncioRepository.js";
import { MpkIntegracaoRepository } from "../repository/mpkIntegracaoRepository.js";
import { AnuncioHubRepository } from "../repository/anuncioHubRepository.js";
import { lib } from "../utils/lib.js";
import { TMongo } from "../infra/mongoClient.js";
import { TStorage } from "../services/storageService.js";
import { fbImage } from "../infra/fbImage.js";
import path from "path";
import { started } from "../services/systemService.js";
import { FilaEstoqueRepository } from "../repository/FilaEstoqueRepository.js";

async function tarefasDiarias() {
  //Envio a movimentacao dos produtos foram sincronizados dos ultimos dias 1 x ao dia
  await enviarMovimentoUltimosDias();
  await gerenciarPromocao();
}

async function init() {
  await tarefasDiarias();

  try {
    //Isso aqui precisa ser bem rapido
    await AnuncioHubRepository.updateAnuncioForcedSQL();
    await enviarParaFilaEstoque();
  } catch (error) {
    console.log("Houve um erro durante a preparacao dados", error?.message);
  }
  await enviarAnunciosPendentes();
}

async function enviarMovimentoUltimosDias() {
  let id_tenant = lib.config_id_tenant();
  try {
    if ((await started(id_tenant, "EnviarUltimos7DiasMovto")) == 0) {
      await AnuncioHubRepository.enviarUltimosProdutosMovimentadoSQL();
    }
  } catch (error) {
    console.log("O processamento retornou erro", error?.message);
  }
}

async function enviarParaFilaEstoque() {
  let rows = await AnuncioHubRepository.getEstoqueByStatus({ status: 0 });
  if (!rows || rows.length == 0) {
    console.log("Nenhum anuncio para enviar");
    return;
  }
  console.log("Enviando anuncios para atualizar " + rows?.length);

  //Envio o lote inteiro para gravar no servidor
  const filaEntrada = new FilaEstoqueRepository(await TMongo.connect());
  let retorno = await filaEntrada.insertMany(rows);

  if (retorno?.insertedCount > 0) {
    console.log(`${retorno.insertedCount} registros foram inseridos.`);

    // Atualiza status dos produtos enviados para fila
    await AnuncioHubRepository.updateFilaVariacaoEntradaSQL();
  } else {
    console.log("Nenhum registro foi inserido.");
  }
}

//isso aqui pode ser movido para outra camada
async function enviarAnunciosPendentes() {
  const anuncio = new AnuncioRepository(
    await TMongo.connect(),
    lib.config_id_tenant()
  );
  let integracoes = await MpkIntegracaoRepository.findAll();

  //Todo : Mudar esse procedimento , isso aqui é muito lento ...
  let recordCount = 0;
  for (let integracao of integracoes) {
    let rows = await AnuncioHubRepository.getAnuncios(
      integracao.id,
      0,
      99,
      0,
      0,
      " WHERE STATUS=0 "
    );
    if (!rows || !Array.isArray(rows)) {
      console.log("Nenhum anuncio pendente para enviar");
      return;
    }

    //Todo : Enviar em lote , diminuir a quantidade de chamadas , latencia
    // await anuncio.insertMany(rows);
    // continue;
    for (let row of rows) {
      recordCount++;
      await anuncio.updateByCodigo(row.codigo, row); // Ganhar velocidade instanciando apenas 1 X
    }
  }

  if (recordCount > 0) {
    console.log(`Foram atualizados ${recordCount} registros.`);
    let r = await AnuncioHubRepository.updateFilaAnuncioEntradaSQL();
  }
}

async function doEnviarImagensProduto(req, res) {
  let items = await enviarImagensProduto(req.body);
  res.send({ message: "OK", items });
}

async function sendImageToStorage(id_produto) {
  let rows = await fbImage.fbImageByIdProduto(id_produto);
  if (!rows || !Array.isArray(rows)) return;
  let local_path = path.join(process.cwd(), "images");

  let position = 1;
  for (let row of rows) {
    let filename = String(row.id_produto) + "-" + position++ + ".jpg";
    fbImage.saveBase64AsJpg(row.imagem_base64, filename).then((r) => {
      let fullFileName = path.join(local_path, filename);
      TStorage.upload(null, fullFileName);
    });
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

async function gerenciarPromocao() {
  let id_tenant = lib.config_id_tenant();
  try {
    if ((await started(id_tenant, "gerenciar_promocao")) == 1) return;

    await AnuncioHubRepository.gerenciarPromocaoSQL();
  } catch (error) {
    console.log("O processamento retornou erro", error?.message);
  }
}

export const anuncioController = {
  init,
  doEnviarImagensProduto,
};
