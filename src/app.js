import express from "express"; 
import livrosRoutes from "./routes/livros.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import emprestimosRoutes from "./routes/emprestimos.routes.js";
import relatoriosRoutes from "./routes/relatorios.routes.js"
const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use(livrosRoutes);
app.use(usuariosRoutes);
app.use(emprestimosRoutes);
app.use(relatoriosRoutes);

export default app;
