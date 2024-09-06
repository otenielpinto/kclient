import { fb5 } from "../infra/fb5";

async function findAll() {
  let items = await fb5.openQuery("ADM_TENANT", "*", "", []);
  return items;
}

export const tenantRepository = {
  findAll,
};
