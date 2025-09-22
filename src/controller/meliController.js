import { fb5 } from "../infra/fb5.js";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

let MELI_TOKEN =
  "colocar_seu_token_aqui"; /*`Bearer ${process.env.MELI_TOKEN}`;*/

async function getAnunciosMercadoLivre() {
  let cmd_sql = `
    SELECT distinct(w.token) token 
        FROM WPRODUCT w
    `;

  let items = await fb5.executeQuery(cmd_sql, []);
  return items;
}

async function deleteToken(items = []) {
  for (const item of items) {
    let cmd_sql = `
      DELETE FROM WPRODUCT WHERE token = ?
      `;
    await fb5.executeQuery(cmd_sql, [item.token]);
    console.log("Token deleted", item.token);
  }
}

async function init() {
  const items = await getAnunciosMercadoLivre();
  let index = 0;
  let aguarde = 0;
  let response = null;

  for (const item of items) {
    index++;
    aguarde++;
    let url = `https://api.mercadolibre.com/items/${item.token}`;
    console.log("url", url);
    if (aguarde > 50) {
      aguarde = 0;
      console.log("Aguarde 10 segundos...");
      await new Promise((resolve) => setTimeout(resolve, 10000)); //aguardar 10 segundos
    }

    try {
      response = await axios.get(url, {
        headers: {
          Authorization: MELI_TOKEN,
          "Content-Type": "application/json",
        },
        timeout: 90000, // 90 seconds timeout
      });
    } catch (error) {
      response = error?.response;
      console.error("Error encountered during GET:", error.message);
    }

    let anuncio = response?.data;
    if (anuncio?.status == 429) {
      console.log("Aguarde 10 segundos... (limite de requisições)");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    if (anuncio?.status == 404) {
      try {
        await deleteToken([item]);
      } catch (error) {
        console.error("Error encountered during DELETE:", error.message);
      }
    }

    console.log("status", anuncio?.status, index);
    if (
      anuncio?.status == "closed" ||
      anuncio?.status == "deleted" ||
      anuncio?.sub_status?.includes("deleted")
    ) {
      try {
        await deleteToken([item]);
        continue;
      } catch (error) {
        console.error("Error encountered during DELETE:", error.message);
      }
    }

    if (
      anuncio?.sub_status?.includes("forbidden") ||
      anuncio?.sub_status?.includes("deleted") ||
      anuncio?.sub_status?.includes("under_review")
    ) {
      response = await mudarStatus(url, "closed");
    } else {
      if (anuncio?.status != "closed" && anuncio?.status != "deleted") {
        response = await mudarStatus(url, "closed");
        console.log("response", response?.status);
      }
    }
  }
}

async function mudarStatus(url, status) {
  let response;
  let payload = {
    status: status,
  };

  if (status == "deleted") {
    payload = {
      deleted: true,
    };
  }

  try {
    response = await axios.put(url, payload, {
      headers: {
        Authorization: MELI_TOKEN,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    response = error?.response;
    console.error("Error encountered during PUT:", error.message);
    return null;
  }

  return response?.data;
}

export const MeliController = {
  getAnunciosMercadoLivre,
  init,
};
