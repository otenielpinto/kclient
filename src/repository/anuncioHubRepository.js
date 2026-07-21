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
  const novo_status = 1;
  const integracoes = lib.config_integracoes_habilitadas?.() || [];

  if (!integracoes.length) {
    const cmd_sql = `
      UPDATE MPK_VARIACAO SET STATUS=${novo_status} WHERE STATUS=0
    `;

    return await fb5.executeQuery(cmd_sql, []);
  }

  const resultados = [];

  for (const id_integracao of integracoes) {
    const cmd_sql = `
      UPDATE MPK_VARIACAO V
      SET V.STATUS = ${novo_status}
      WHERE V.STATUS = 0
        AND EXISTS (
          SELECT 1
          FROM MPK_ANUNCIO A
          WHERE A.ID = V.ID_ANUNCIO
            AND A.ID_INTEGRACAO = ${id_integracao}
        )
    `;
    resultados.push(await fb5.executeQuery(cmd_sql, []));
  }

  return resultados;
}

async function updateFilaAnuncioEntradaSQL() {
  // Status 1 indica que o item foi enviado para fila de entrada
  const novo_status = 1;
  const integracoes = lib.config_integracoes_habilitadas?.() || [];

  if (!integracoes.length) {
    const cmd_sql = `
      UPDATE MPK_ANUNCIO SET STATUS=${novo_status} WHERE STATUS=0
    `;

    return await fb5.executeQuery(cmd_sql, []);
  }

  const resultados = [];

  for (const id_integracao of integracoes) {
    const cmd_sql = `
      UPDATE MPK_ANUNCIO A
      SET A.STATUS = ${novo_status}
      WHERE A.STATUS = 0
        AND A.ID_INTEGRACAO = ${id_integracao}
    `;

    resultados.push(await fb5.executeQuery(cmd_sql, []));
  }

  return resultados;
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
  filter = "",
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
