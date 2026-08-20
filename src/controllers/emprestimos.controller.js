import client from "../config/database.js";
import {
    dataAnteriorAHoje,
    dataInvalida,
    idInvalido
} from "../utils/validacoes.js";

export async function listarEmprestimos(req, res) {
    try{
        const resultado = await client.query(`
            SELECT
                e.id,
                e.livro_id,
                l.titulo AS livro,
                e.usuario_id,
                u.nome AS usuario,
                e.data_emprestimo,
                TO_CHAR(
                e.data_prevista_devolucao,
                'YYYY-MM-DD'
                ) AS data_prevista_devolucao,
                e.data_devolucao,
                CASE
                    WHEN e.data_devolucao IS NULL THEN 'ativo'
                    ELSE 'devolvido'
                END AS status
            FROM emprestimos e 
            JOIN livros l ON l.id = e.livro_id
            JOIN usuarios u ON u.id = e.usuario_id
            ORDER BY e.id
        `);
            return res.json(resultado.rows);
    } catch(error){
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}
export async function criarEmprestimo(req, res) {
    try {
        const {
            livro_id,
            usuario_id,
            data_prevista_devolucao
        } = req.body;

        const livroId = Number(livro_id);
        const usuarioId = Number(usuario_id);

        if (idInvalido(livroId) || idInvalido(usuarioId)) {
            return res.status(400).json({
                mensagem: "Livro e usuário devem possuir IDs válidos"
            });
        }

        if (dataInvalida(data_prevista_devolucao)) {
            return res.status(400).json({
                mensagem: "A data deve estar no formato AAAA-MM-DD"
            });
        }

        if (dataAnteriorAHoje(data_prevista_devolucao)) {
            return res.status(400).json({
                mensagem: "A data prevista não pode estar no passado"
            });
        }

        const resultado = await client.query(
            `
            INSERT INTO emprestimos (
                livro_id,
                usuario_id,
                data_prevista_devolucao
            )
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [livroId, usuarioId, data_prevista_devolucao]
        );

        return res.status(201).json({
            ...resultado.rows[0],
            data_prevista_devolucao,
            status: "ativo"
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(404).json({
                mensagem: "Livro ou usuário não encontrado"
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({
                mensagem: "Este livro já está emprestado"
            });
        }

        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}

export async function devolverLivro(req, res) {
    try {
        const id = Number(req.params.id);

        if (idInvalido(id)) {
            return res.status(400).json({
                mensagem: "O ID deve ser um número inteiro positivo"
            });
        }

        const resultado = await client.query(
            `
            UPDATE emprestimos
            SET data_devolucao = CURRENT_TIMESTAMP
            WHERE id = $1
              AND data_devolucao IS NULL
            RETURNING
                id,
                livro_id,
                usuario_id,
                data_emprestimo,
                data_prevista_devolucao::text,
                data_devolucao
            `,
            [id]
        );

        if (resultado.rowCount > 0) {
            return res.json({
                ...resultado.rows[0],
                status: "devolvido"
            });
        }

        const existente = await client.query(
            `
            SELECT id, data_devolucao
            FROM emprestimos
            WHERE id = $1
            `,
            [id]
        );

        if (existente.rowCount === 0) {
            return res.status(404).json({
                mensagem: "Empréstimo não encontrado"
            });
        }

        return res.status(409).json({
            mensagem: "Empréstimo já foi devolvido"
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}