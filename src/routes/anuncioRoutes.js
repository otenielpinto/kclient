import express from "express";
const router = express.Router();
import { anuncioController } from "../controller/anuncioController.js";

//add images to a product
router.post("/imagens_produto", anuncioController.doEnviarImagensProduto);


const anuncioRoutes = router;
export { anuncioRoutes };
