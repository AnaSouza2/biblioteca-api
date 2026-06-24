import { Router } from "express";
import { 
    atualizarLivro,
    buscarLivroPorId, 
    criarLivro, 
    deletarLivro, 
    listarLivros
} from "../controllers/livros.controller.js";

const router = Router();

router.get("/livros",listarLivros);
router.get("/livros/:id", buscarLivroPorId);
router.post("/livros", criarLivro);
router.put("/livros/:id", atualizarLivro)
router.delete("/livros/:id", deletarLivro);


export default router;