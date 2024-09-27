import { fb5 } from "../infra/fb5.js";
import { lib } from "../utils/lib.js";
import { TMongo } from "../infra/mongoClient.js";
import { AnuncioRepository } from "./anuncioRepository.js";
import { anuncioTypes } from "../types/anuncioTypes.js";
import { estoqueTypes } from "../types/estoqueTypes.js";
import { EstoqueRepository } from "./estoqueRepository.js";
let LISTA_OF_CATEGORIAS = [];
const MAX_CMD_SQL = 100;
const MAX_RECORDS_LOTE = 300; //quantidade de registros por lote

async function updateAnuncioForced() {
  let cmd_sql = ` 
  SELECT * FROM MPK_UPDANUNCIOFORCED
  `;
  let rows = await fb5.executeQuery(cmd_sql, []);
  return rows;
}

//fiz separado para poder compartilhar esse repositorio
async function getEstoqueByStatus({ status }) {
  let cmd_sql = ` 
  SELECT * FROM MPK_GETESTOQUEBYSTATUS(${status})
  `;
  let rows = await fb5.executeQuery(cmd_sql, []);
  return rows;
}

async function getAnuncios(
  id_integracao = 0,
  id_variacao = 0,
  id_flag = 99,
  id_produto = 0,
  id_anuncio = 0,
  filter = ""
) {
  let cmd_sql = `SELECT * FROM MPK_GETANUNCIO(?,?,?,?,?) ${filter}`;
  return await fb5.executeQuery(cmd_sql, [
    id_integracao,
    id_variacao,
    id_flag,
    id_produto,
    id_anuncio,
  ]);
}

async function recebeEstoqueProcessado() {
  const estoque = new EstoqueRepository(
    await TMongo.connect(),
    lib.config_id_tenant()
  );
  let items = await estoque.findAllByIds({
    status: estoqueTypes.processado,
    id_tenant: lib.config_id_tenant(),
  });

  console.log("Recebendo estoque processados", items?.length);
  if (!items) return;
  let lote = [];

  for (let item of items) {
    lote.push(item);
    if (lote.length < MAX_CMD_SQL) continue;
    try {
      await updateEstoqueSQL(lote);
    } catch (error) { }
    lote = [];
  }

  try {
    await updateEstoqueSQL(lote);
    lote = [];
  } catch (error) { }

  await estoque.updateMany(
    { status: estoqueTypes.processado, id_tenant: lib.config_id_tenant() },
    { status: estoqueTypes.concluido }
  );
}

async function recebeAnunciosProcessado() {
  const anuncio = new AnuncioRepository(
    await TMongo.connect(),
    lib.config_id_tenant()
  );

  let items = await anuncio.findAllByIds({
    status: anuncioTypes.processado,
    id_tenant: lib.config_id_tenant(),
  });

  console.log("Recebendo produtos processados", items?.length);

  if (!items) return;
  let lote = [];

  for (let item of items) {
    lote.push(item);
    if (lote.length < MAX_CMD_SQL) continue;
    try {
      await updateAnuncioSQL(lote);
    } catch (error) { }
    lote = [];
  }

  try {
    await updateAnuncioSQL(lote);
    lote = [];
  } catch (error) { }


  await anuncio.updateMany(
    { status: anuncioTypes.processado, id_tenant: lib.config_id_tenant() },
    { status: anuncioTypes.concluido }
  );
}

async function updateAnuncioSQL(items) {
  if (!items) return;
  if (items?.length == 0) return;
  let processado = 1; //processado

  let lote = [];
  for (let item of items) {
    lote.push({ cmd_sql: `UPDATE MPK_ANUNCIO SET STATUS=${processado} WHERE ID=${item?.id} AND STATUS=0 ;\n`, params: [] });
  }
  await fb5.executeArraySQL(lote);
}

async function updateEstoqueSQL(items) {
  if (!items) return;
  if (items?.length == 0) return;
  let processado = 1; //processado
  let lote = [];

  for (let item of items) {
    lote.push({ cmd_sql: `UPDATE MPK_VARIACAO SET STATUS=${processado} WHERE ID=${item?.id} AND STATUS=0 ;\n`, params: [] });
  }
  await fb5.executeArraySQL(lote);
}

export const AnuncioHubRepository = {
  getEstoqueByStatus,
  getAnuncios,
  updateAnuncioForced,
  recebeAnunciosProcessado,
  recebeEstoqueProcessado,
};
