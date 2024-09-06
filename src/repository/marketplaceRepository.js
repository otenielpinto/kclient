import { fb5 } from "../infra/fb5";

async function findAll() {
  let items = await fb5.openQuery("MPK_MARKETPLACE", "*", "", []);
  return items;
}

export const marketplaceRepository = {
  findAll,
};
