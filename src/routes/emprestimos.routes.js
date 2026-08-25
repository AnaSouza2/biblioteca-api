import { Router } from "express";
import {
    buscarEmprestimoPorId,
    criarEmprestimo,
    devolverLivro,
    listarEmprestimos,
    renovarEmprestimo
} from "../controllers/emprestimos.controller.js";

const router = Router();

router.get("/emprestimos", listarEmprestimos);
router.post("/emprestimos", criarEmprestimo);
router.patch(
    "/emprestimos/:id/devolucao",
    devolverLivro
);
router.get("/emprestimos/:id", buscarEmprestimoPorId);
router.patch(
    "/emprestimos/:id/renovacao",
    renovarEmprestimo
);

export default router;