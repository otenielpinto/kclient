import { AnuncioRepository } from "../repository/anuncioRepository.js";
import { MpkIntegracaoRepository } from "../repository/mpkIntegracaoRepository.js";
import { AnuncioHubRepository } from "../repository/anuncioHubRepository.js";
import { EstoqueRepository } from "../repository/estoqueRepository.js";
import { lib } from "../utils/lib.js";
import { TMongo } from "../infra/mongoClient.js";

//pego os anuncios e envio para komache hub

async function init() {
  return;
  await enviarEstoque();
  await enviarAnunciosPendentes();
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
  } catch (error) {}
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

export const anuncioController = {
  init,
};
