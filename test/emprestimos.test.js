import test, {
    before,
    after,
    beforeEach,
    afterEach
} from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";
import client from "../src/config/database.js";

before(async () => {
    await client.connect();
});

after(async () => {
    await client.end();
});

beforeEach(async () => {
    await client.query("BEGIN");
});

afterEach(async () => {
    await client.query("ROLLBACK");
});


function gerarDataFutura(dias = 7) {
    const data = new Date();
    data.setDate(data.getDate() + dias);

    return data.toISOString().slice(0, 10);
}

async function prepararLivroEUsuario() {
    const livro = await request(app)
        .post("/livros")
        .send({
            titulo: "Livro para empréstimo",
            autor: "Autor do teste",
            status: "lido"
        });

    const usuario = await request(app)
        .post("/usuarios")
        .send({
            nome: "Usuário do empréstimo",
            email: `emprestimo.${Date.now()}@example.com`
        });

    return {
        livroId: livro.body.id,
        usuarioId: usuario.body.id
    };
}

test("GET /emprestimos deve retornar uma lista", async () => {
    const resposta = await request(app).get("/emprestimos");

    assert.equal(resposta.status, 200);
    assert.ok(Array.isArray(resposta.body));
});
test("POST /emprestimos deve rejeitar uma data inválida", async () => {
    const resposta = await request(app)
        .post("/emprestimos")
        .send({
            livro_id: 1,
            usuario_id: 1,
            data_prevista_devolucao: "data-invalida"
        });

    assert.equal(resposta.status, 400);
    assert.equal(
        resposta.body.mensagem,
        "A data deve estar no formato AAAA-MM-DD"
    );
});

test("POST /emprestimos deve criar um empréstimo", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    const dataPrevista = gerarDataFutura();

    const resposta = await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: dataPrevista
        });

    assert.equal(resposta.status, 201);
    assert.equal(resposta.body.livro_id, livroId);
    assert.equal(resposta.body.usuario_id, usuarioId);
    assert.equal(
        resposta.body.data_prevista_devolucao,
        dataPrevista
    );
    assert.equal(resposta.body.status, "ativo");
    assert.equal(resposta.body.data_devolucao, null);
});
test("POST /emprestimos deve rejeitar livro já emprestado", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    const dados = {
        livro_id: livroId,
        usuario_id: usuarioId,
        data_prevista_devolucao: gerarDataFutura()
    };

    const primeiroEmprestimo = await request(app)
        .post("/emprestimos")
        .send(dados);

    assert.equal(primeiroEmprestimo.status, 201);

    const segundoEmprestimo = await request(app)
        .post("/emprestimos")
        .send(dados);

    assert.equal(segundoEmprestimo.status, 409);
    assert.equal(
        segundoEmprestimo.body.mensagem,
        "Este livro já está emprestado"
    );
});
test("PATCH /emprestimos/:id/devolucao deve devolver o livro", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    const criacao = await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: gerarDataFutura()
        });

    const emprestimoId = criacao.body.id;

    const devolucao = await request(app)
        .patch(`/emprestimos/${emprestimoId}/devolucao`);

    assert.equal(devolucao.status, 200);
    assert.equal(devolucao.body.id, emprestimoId);
    assert.equal(devolucao.body.status, "devolvido");
    assert.ok(devolucao.body.data_devolucao);
    
    const listagem = await request(app)
    .get("/emprestimos")
    .query({
        status: "devolvido"
    });

    const emprestimoDevolvido = listagem.body.find(
        item => item.id === emprestimoId
    );

    assert.equal(listagem.status, 200);
    assert.ok(emprestimoDevolvido);
    assert.ok(
        listagem.body.every(
            item => item.status === "devolvido"
        )
);




    const novoEmprestimo = await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: gerarDataFutura(14)
        });

    assert.equal(novoEmprestimo.status, 201);
});
test("DELETE /livros/:id deve preservar livro com empréstimo", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: gerarDataFutura()
        });

    const resposta = await request(app)
        .delete(`/livros/${livroId}`);

    assert.equal(resposta.status, 409);
    assert.equal(
        resposta.body.mensagem,
        "Livro não pode ser apagado porque possui empréstimos"
    );
});
test("DELETE /usuarios/:id deve preservar usuário com empréstimo", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: gerarDataFutura()
        });

    const resposta = await request(app)
        .delete(`/usuarios/${usuarioId}`);

    assert.equal(resposta.status, 409);
    assert.equal(
        resposta.body.mensagem,
        "Usuário não pode ser apagado porque possui empréstimos"
    );
});

test("GET /emprestimos deve identificar empréstimo atrasado", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    const criacao = await client.query(
        `
        INSERT INTO emprestimos (
            livro_id,
            usuario_id,
            data_prevista_devolucao
        )
        VALUES ($1, $2, CURRENT_DATE - 1)
        RETURNING id
        `,
        [livroId, usuarioId]
    );

    const emprestimoId = criacao.rows[0].id;

    const resposta = await request(app)
        .get("/emprestimos")
        .query({
            status: "atrasado"
    });

    const emprestimo = resposta.body.find(
        item => item.id === emprestimoId
    );

    assert.equal(resposta.status, 200);
    assert.ok(emprestimo);
    assert.equal(emprestimo.status, "atrasado");
    assert.ok(
    resposta.body.every(item => item.status === "atrasado")
    );
});
test("GET /emprestimos deve rejeitar filtro de status inválido", async () => {
    const resposta = await request(app)
        .get("/emprestimos")
        .query({
            status: "cancelado"
        });

    assert.equal(resposta.status, 400);
    assert.equal(
        resposta.body.mensagem,
        "Status inválido. Use: ativo, atrasado ou devolvido"
    );
});
test("GET /emprestimos deve filtrar empréstimos ativos", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    const criacao = await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: gerarDataFutura()
        });

    const emprestimoId = criacao.body.id;

    const resposta = await request(app)
        .get("/emprestimos")
        .query({
            status: "ativo"
        });

    const emprestimo = resposta.body.find(
        item => item.id === emprestimoId
    );

    assert.equal(resposta.status, 200);
    assert.ok(emprestimo);
    assert.equal(emprestimo.status, "ativo");
    assert.ok(
        resposta.body.every(item => item.status === "ativo")
    );
});