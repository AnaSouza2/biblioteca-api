BEGIN;

CREATE TABLE emprestimos (
    id SERIAL PRIMARY KEY,
    livro_id INTEGER NOT NULL
        REFERENCES livros(id)
        ON DELETE RESTRICT,
    usuario_id INTEGER NOT NULL
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,
    data_emprestimo TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_prevista_devolucao DATE NOT NULL,
    data_devolucao TIMESTAMPTZ
);

CREATE UNIQUE INDEX emprestimos_livro_ativo_unico
ON emprestimos (livro_id)
WHERE data_devolucao IS NULL;

COMMIT;