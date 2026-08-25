import { Router } from "express";
import {
    obterResumo
}from "../controllers/relatorios.controller.js"

const router = Router();

router.get("/relatorios/resumo", obterResumo);

export default router;