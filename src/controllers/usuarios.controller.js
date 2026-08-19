import client from "../config/database.js";
import {
    emailInvalido,
    idInvalido,
    textoInvalido
} from "../utils/validacoes.js";

export async function listarUsuarios(req, res) {
    try {
        const resultado = await client.query(`
            SELECT id, nome, email, criado_em
            FROM usuarios
            ORDER BY id
        `);

        return res.json(resultado.rows);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}

export async function buscarUsuarioPorId(req, res) {
    try {
        const id = Number(req.params.id);

        if (idInvalido(id)) {
            return res.status(400).json({
                mensagem: "O ID deve ser um número inteiro positivo"
            });
        }

        const resultado = await client.query(
            `
            SELECT id, nome, email, criado_em
            FROM usuarios
            WHERE id = $1
            `,
            [id]
        );

        const usuario = resultado.rows[0];

        if (!usuario) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado"
            });
        }

        return res.json(usuario);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}

export async function criarUsuario(req, res) {
    try {
        const { nome, email } = req.body;

        if (textoInvalido(nome) || textoInvalido(email)) {
            return res.status(400).json({
                mensagem: "Nome e e-mail são obrigatórios"
            });
        }

        if (emailInvalido(email)) {
            return res.status(400).json({
                mensagem: "E-mail inválido"
            });
        }

        const resultado = await client.query(
            `
            INSERT INTO usuarios (nome, email)
            VALUES ($1, $2)
            RETURNING id, nome, email, criado_em
            `,
            [nome.trim(), email.trim().toLowerCase()]
        );

        return res.status(201).json(resultado.rows[0]);
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                mensagem: "E-mail já cadastrado"
            });
        }

        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}
export async function atualizarUsuario(req, res) {
    try {
        const id = Number(req.params.id);
        const { nome, email } = req.body;

        if (idInvalido(id)) {
            return res.status(400).json({
                mensagem: "O ID deve ser um número inteiro positivo"
            });
        }

        if (textoInvalido(nome) || textoInvalido(email)) {
            return res.status(400).json({
                mensagem: "Nome e e-mail são obrigatórios"
            });
        }

        if (emailInvalido(email)) {
            return res.status(400).json({
                mensagem: "E-mail inválido"
            });
        }

        const resultado = await client.query(
            `
            UPDATE usuarios
            SET nome = $1,
                email = $2
            WHERE id = $3
            RETURNING id, nome, email, criado_em
            `,
            [
                nome.trim(),
                email.trim().toLowerCase(),
                id
            ]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado"
            });
        }

        return res.json(resultado.rows[0]);
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                mensagem: "E-mail já cadastrado"
            });
        }

        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}

export async function deletarUsuario(req, res) {
    try {
        const id = Number(req.params.id);

        if (idInvalido(id)) {
            return res.status(400).json({
                mensagem: "O ID deve ser um número inteiro positivo"
            });
        }

        const resultado = await client.query(
            `
            DELETE FROM usuarios
            WHERE id = $1
            `,
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado"
            });
        }

        return res.json({
            mensagem: "Usuário apagado com sucesso!"
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}