import app from "./app.js";
import client from "./config/database.js";

const PORTA = 3000;

async function iniciarServidor() {
    try {
        await client.connect();
        console.log("Banco conectado com sucesso");

        app.listen(PORTA, () => {
            console.log(`Servidor rodando na porta ${PORTA}`);
        });
    } catch (error) {
        console.error("Erro ao iniciar o servidor:", error.message);
        process.exit(1);
    }
}

iniciarServidor();







