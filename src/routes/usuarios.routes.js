import { Router } from "express";
import {
    criarUsuario,
    listarUsuarios
} from "../controllers/usuarios.controller.js";

const router = Router();

router.get("/usuarios", listarUsuarios);
router.post("/usuarios", criarUsuario);

export default router;