import app from "./app.js";
import client from "./config/database.js";


await client.connect();
console.log("Banco conectado com sucesso");



app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});







