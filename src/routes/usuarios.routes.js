import { Router } from "express";
import {
    criarUsuario,
    buscarUsuarioPorId,
    atualizarUsuario,
    deletarUsuario,
    listarUsuarios
} from "../controllers/usuarios.controller.js";

const router = Router();

router.get("/usuarios", listarUsuarios);
router.post("/usuarios", criarUsuario);
router.get("/usuarios/:id", buscarUsuarioPorId);
router.put("/usuarios/:id", atualizarUsuario);
router.delete("/usuarios/:id", deletarUsuario);

export default router;