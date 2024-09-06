import { fb5 } from "../infra/fb5.js";

async function findAll() {
  let items = await fb5.openQuery("MPK_INTEGRACAO", "*", "1=1", []);
  return items;
}

export const MpkIntegracaoRepository = {
  findAll,
};
