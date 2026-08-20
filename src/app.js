import express from "express"; 
import livrosRoutes from "./routes/livros.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import emprestimosRoutes from "./routes/emprestimos.routes.js";
const app = express();

app.use(express.json());
app.use(livrosRoutes);
app.use(usuariosRoutes);
app.use(emprestimosRoutes);

export default app;
