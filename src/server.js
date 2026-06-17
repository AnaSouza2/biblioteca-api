import express from "express";
import client from "./config/database.js";

await client.connect();
console.log("Banco conectado com sucesso");

const app = express();
app.use(express.json());

app.listen(3000, () =>{
    console.log("Servidor rodando na porta 3000");
});

app.get("/livros", async (req, res) => {
    const resultado = await client.query("SELECT * FROM livros");

    return res.json(resultado.rows);
});


app.get("/livros/:id", async (req, res) => {
    const id = Number(req.params.id);

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
});

app.post("/livros", async (req, res) => {
    const { titulo, autor, status } = req.body;

    if(!titulo || !autor || !status){
        return res.status(400).json({
            mensagem: "Título, autor e status são obrigatórios"
        });
    }

    const resultado = await client.query(
        `
        INSERT INTO livros(titulo, autor, status)
        VALUES($1, $2, $3)
        RETURNING *
        `,
        [titulo, autor, status]
    );

    return res.status(201).json(resultado.rows[0]);
});



app.put("/livros/:id", async(req, res) => {
    const { titulo, autor, status } = req.body;
    const id = Number(req.params.id);

    if(!titulo || !autor || !status){
        return res.status(400).json({
            mensagem: "Título, autor e status são obrigatórios"
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
        [titulo, autor, status, id]
    );


    
    if(resultado.rowCount === 0){
        return res.status(404).json({
            mensagem: "Livro não encontrado"
        });
    }
    
    return res.status(200).json(resultado.rows[0]);
  
});

app.delete("/livros/:id", async (req, res) =>{
    const id = Number(req.params.id);
    
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
    
});