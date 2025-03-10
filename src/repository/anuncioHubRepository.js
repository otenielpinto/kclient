import { fb5 } from "../infra/fb5.js";
import { lib } from "../utils/lib.js";

async function updateAnuncioForcedSQL() {
  let cmd_sql = ` 
  SELECT * FROM MPK_UPDANUNCIOFORCED
  `;
  let rows = await fb5.executeQuery(cmd_sql, []);
  return rows;
}

async function enviarUltimosProdutosMovimentadoSQL() {
  let cmd_sql = ` 
  EXECUTE PROCEDURE MPK_PRODUTOMOVTO
  `;
  let rows = await fb5.executeQuery(cmd_sql, []);
  return rows;
}

async function updateFilaVariacaoEntradaSQL() {
  // Status 1 indica que o item foi enviado para fila de entrada
  let enviado_fila = 1;
  let cmd_sql = ` 
  UPDATE MPK_VARIACAO SET STATUS=${enviado_fila} WHERE STATUS=0
  `;

  //Executa o lote de comandos SQL
  return await fb5.executeQuery(cmd_sql, []);
}

async function updateFilaAnuncioEntradaSQL() {
  // Status 1 indica que o item foi enviado para fila de entrada
  let enviado_fila = 1;
  let cmd_sql = ` 
  UPDATE MPK_ANUNCIO SET STATUS=${enviado_fila} WHERE STATUS=0
  `;

  //Executa o lote de comandos SQL
  return await fb5.executeQuery(cmd_sql, []);
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

async function updateAnuncioSQL(items) {
  if (!items) return;
  if (items?.length == 0) return;
  let processado = 1; //processado

  let lote = [];
  for (let item of items) {
    lote.push({
      cmd_sql: `UPDATE MPK_ANUNCIO SET STATUS=${processado} WHERE ID=${item?.id} AND STATUS=0 ;\n`,
      params: [],
    });
  }
  await fb5.executeArraySQL(lote);
}

async function updateEstoqueSQL(items) {
  if (!items) return;
  if (items?.length == 0) return;
  let processado = 1; //processado
  let lote = [];

  for (let item of items) {
    lote.push({
      cmd_sql: `UPDATE MPK_VARIACAO SET STATUS=${processado} WHERE ID=${item?.id} AND STATUS=0 ;\n`,
      params: [],
    });
  }
  await fb5.executeArraySQL(lote);
}

async function gerenciarPromocaoSQL() {
  let cmd_sql = ` 
  EXECUTE PROCEDURE MPK_PROMOCAO_VALIDAR_SITE
  `;
  return await fb5.executeQuery(cmd_sql, []);
}

export const AnuncioHubRepository = {
  getEstoqueByStatus,
  getAnuncios,

  enviarUltimosProdutosMovimentadoSQL,
  updateFilaVariacaoEntradaSQL,
  updateFilaAnuncioEntradaSQL,
  updateAnuncioForcedSQL,

  gerenciarPromocaoSQL,
};
