import express from "express"; 
import livrosRoutes from "./routes/livros.routes.js";

const app = express();

app.use(express.json());
app.use(livrosRoutes);

export default app;
