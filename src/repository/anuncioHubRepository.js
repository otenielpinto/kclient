import { fb5 } from "../infra/fb5.js";
import { lib } from "../utils/lib.js";
import { TMongo } from "../infra/mongoClient.js";
import { AnuncioRepository } from "./anuncioRepository.js";
import { anuncioTypes } from "../types/anuncioTypes.js";

let LISTA_OF_CATEGORIAS = [];
const MAX_CMD_SQL = 100;
const MAX_RECORDS_LOTE = 300; //quantidade de registros por lote

//fiz separado para poder compartilhar esse repositorio

async function getEstoqueByStatus({ status, id_produto }) {
  let cmd_sql = `
  WITH ESTOQUE AS
  (
      SELECT
        V.ID ,
        V.CODIGO,
        A.CODIGO AS COD_ANUNCIO ,
        V.ID_ANUNCIO,
        V.ID_VARIACAO,
        V.ID_ANUNCIO_MKTPLACE ,
        V.ID_VARIANT_MKTPLACE ,
        V.ID_PRODUTO ,
        V.STATUS ,
        COALESCE( SUM(X.QTD),0)  AS RESERVA
      FROM
        MPK_VARIACAO V
      LEFT JOIN MPK_ANUNCIO A ON (A.ID =V.ID_ANUNCIO)
      LEFT JOIN PRODUTO_RESERVA X ON(X.ID = V.ID_PRODUTO)
      WHERE
       V.STATUS =${status}
      GROUP BY
        V.ID ,
        V.CODIGO,
        A.CODIGO ,
        V.ID_ANUNCIO,
        V.ID_VARIACAO,
        V.ID_ANUNCIO_MKTPLACE ,
        V.ID_VARIANT_MKTPLACE ,
        V.ID_PRODUTO,
        V.STATUS
  )
  SELECT
    E.* ,   
   COALESCE(SUM(R.estoque),0) - E.RESERVA  AS ESTOQUE
  FROM
    ESTOQUE E
  LEFT JOIN PRODUTO_REDE  R ON (R.id = E.ID_PRODUTO)
  GROUP  BY
    E.ID ,
    E.CODIGO,
    E.COD_ANUNCIO,
    E.ID_ANUNCIO,
    E.ID_VARIACAO,
    E.ID_ANUNCIO_MKTPLACE,
    E.ID_VARIANT_MKTPLACE,
    E.ID_PRODUTO,
    E.STATUS,
    E.RESERVA  
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

async function recebeAnunciosProcessado() {
  const anuncio = new AnuncioRepository(
    await TMongo.connect(),
    lib.config_id_tenant()
  );

  let processado = anuncioTypes.processado;
  let items = await anuncio.findAllByIds({
    status: processado,
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
    } catch (error) {}
    lote = [];
  }

  try {
    await updateAnuncioSQL(lote);
    lote = [];
  } catch (error) {}

  //revisar isso aqui 05-09-2024
  await anuncio.updateMany(
    { status: processado, id_tenant: lib.config_id_tenant() },
    { status: anuncioTypes.concluido }
  );
}

async function updateAnuncioSQL(items) {
  if (!items) return;
  if (items?.length == 0) return;
  let cmd_sql = "";
  let processado = 1; //processado

  //pegar o id do anuncio no ecommerce para importar o codigo
  for (let item of items) {
    cmd_sql += `UPDATE MPK_ANUNCIO SET STATUS=${processado} WHERE ID=${item?.id} AND STATUS=0 ;\n`;
  }

  let execute_block_sql = `EXECUTE BLOCK
    AS
    BEGIN 
      ${cmd_sql}
    END
  `;

  fb5.firebird.attach(fb5.dboptions, (err, db) => {
    if (err) {
      console.log(err);
      return;
    }
    db.query(execute_block_sql, [], (err, result) => {
      db.detach();
      if (err) {
        console.log(err);
      }
    });
  }); // fb5.firebird
}

export const AnuncioHubRepository = {
  getEstoqueByStatus,
  getAnuncios,
  recebeAnunciosProcessado,
};
