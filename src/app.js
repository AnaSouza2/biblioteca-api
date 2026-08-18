import express from "express"; 
import livrosRoutes from "./routes/livros.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
const app = express();

app.use(express.json());
app.use(livrosRoutes);
app.use(usuariosRoutes);

export default app;
