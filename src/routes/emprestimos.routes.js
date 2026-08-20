import { Router } from "express";
import {
    criarEmprestimo,
    devolverLivro,
    listarEmprestimos
} from "../controllers/emprestimos.controller.js";

const router = Router();

router.get("/emprestimos", listarEmprestimos);
router.post("/emprestimos", criarEmprestimo);
router.patch(
    "/emprestimos/:id/devolucao",
    devolverLivro
);

export default router;