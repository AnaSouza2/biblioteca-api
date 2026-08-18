import client from "../config/database.js";

const STATUS_PERMITIDOS = [ "quero ler", "lendo", "lido"];

function idInvalido(id){
    return !Number.isInteger(id) || id <= 0;

}

function textoInvalido(valor){
    return typeof valor !== "string" || valor.trim().length === 0;
}

export async function listarLivros(req, res) {
    try {
        const { status, titulo } = req.query;

        let sql = "SELECT * FROM livros";
        const filtros = [];
        const valores = [];

        if (status) {
            valores.push(status);
            filtros.push(`status = $${valores.length}`);
        }

        if (titulo) {
            valores.push(`%${titulo}%`);
            filtros.push(`titulo ILIKE $${valores.length}`);
        }

        if (filtros.length > 0) {
            sql += ` WHERE ${filtros.join(" AND ")}`;
        }

        const resultado = await client.query(sql, valores);

        return res.json(resultado.rows);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: error.message
        });
    }
}

export async function buscarLivroPorId(req, res) {
    try {
        const id = Number(req.params.id);

        if(idInvalido(id)){
            return res.status(400).json({
                mensagem: "O ID deve ser um número inteiro positivo"
            });
        }

        const resultado = await client.query(
            "SELECT * FROM livros WHERE id = $1",
            [id]
        );

        const livro = resultado.rows[0];

        if(!livro){
            return res.status(404).json({
                mensagem: "Livro não encontrado"
            });
        }

        return res.json(livro);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}

export async function criarLivro(req, res) {
    try {
        const { titulo, autor, status } = req.body;

        if( textoInvalido(titulo) ||
            textoInvalido(autor) ||
            textoInvalido(status)
            ) {

            return res.status(400).json({
                mensagem: "Título, autor e status são obrigatórios"
            });
        }

        

        if(!STATUS_PERMITIDOS.includes(status.toLowerCase())){
            return res.status(400).json({
                mensagem: `Status inválido. Use: ${STATUS_PERMITIDOS.join(", ")}`
            });
        }

        const resultado = await client.query(
            `
            INSERT INTO livros(titulo, autor, status)
            VALUES($1, $2, $3)
            RETURNING *
            `,
            [titulo.trim(), autor.trim(), status.toLowerCase()]
        );

        return res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        }); 
    }
}

export async function atualizarLivro(req, res) {
    try {
        const { titulo, autor, status } = req.body;
        const id = Number(req.params.id);

        if (idInvalido(id)) {
            return res.status(400).json({
                mensagem: "O ID deve ser um número inteiro positivo"
            });
        }

        if( textoInvalido(titulo) ||
            textoInvalido(autor) ||
            textoInvalido(status)
            ) {
            return res.status(400).json({
                mensagem: "Título, autor e status são obrigatórios"
            });
        }

        

        if (!STATUS_PERMITIDOS.includes(status.toLowerCase())) {
            return res.status(400).json({
                mensagem: `Status inválido. Use: ${STATUS_PERMITIDOS.join(", ")}`
        });
}

        const resultado = await client.query(
            `
            UPDATE livros
            SET titulo = $1,
                autor = $2,
                status = $3
            WHERE id = $4
            RETURNING *
            `,
            [titulo.trim(), autor.trim(), status.toLowerCase(), id]
        );


        
        if(resultado.rowCount === 0){
            return res.status(404).json({
                mensagem: "Livro não encontrado"
            });
        }
        
        return res.status(200).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}

export async function deletarLivro(req, res) {
    try {
        const id = Number(req.params.id);
    
        if (idInvalido(id)) {
            return res.status(400).json({
                mensagem: "O ID deve ser um número inteiro positivo"
            });
        }
        const resultado = await client.query(
            `
            DELETE FROM livros
            WHERE id = $1
            `,
            [id]
        );

        if(resultado.rowCount === 0){
            return res.status(404).json({
                mensagem: "Livro não encontrado"
            });
        }

        return res.status(200).json({
            mensagem: "Livro apagado com sucesso!"
    });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        }); 
    }
}