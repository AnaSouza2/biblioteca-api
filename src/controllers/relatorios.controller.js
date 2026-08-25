import client from "../config/database.js";

export async function obterResumo(req, res) {
    try{
        const resultado = await client.query(`
            SELECT
            (
                SELECT COUNT(*)::int
                FROM livros
            ) AS total_livros,

            (
                SELECT COUNT(*)::int
                FROM usuarios
            ) AS total_usuarios,

            (
                SELECT COUNT(*)::int
                FROM emprestimos
                WHERE data_devolucao IS NULL
                    AND data_prevista_devolucao >= CURRENT_DATE
            ) AS emprestimos_ativos,

            (
                SELECT COUNT(*)::int
                FROM emprestimos
                WHERE data_devolucao IS NULL
                    AND data_prevista_devolucao < CURRENT_DATE
            )AS emprestimos_atrasados,

            (
                SELECT COUNT(*)::int
                FROM emprestimos
                WHERE data_devolucao IS NOT NULL
            ) AS emprestimos_devolvidos
        `);

        return res.json(resultado.rows[0]);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro interno no servidor"
        });
    }
}
