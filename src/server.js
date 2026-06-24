import express from "express";
import client from "./config/database.js";
import livrosRoutes from "./routes/livros.routes.js";

await client.connect();
console.log("Banco conectado com sucesso");

const app = express();

app.use(express.json());
app.use(livrosRoutes);

app.listen(3000, () =>{
    console.log("Servidor rodando na porta 3000");
});








