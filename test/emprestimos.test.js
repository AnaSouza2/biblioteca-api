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

test("GET /emprestimos/abc deve rejeitar ID inválido", async () => {
    const resposta = await request(app)
        .get("/emprestimos/abc");

    assert.equal(resposta.status, 400);
    assert.equal(
        resposta.body.mensagem,
        "O ID deve ser um número inteiro positivo"
    );
});

test("GET /emprestimos/:id deve retornar o empréstimo", async () => {
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
        .get(`/emprestimos/${emprestimoId}`);

    assert.equal(resposta.status, 200);
    assert.equal(resposta.body.id, emprestimoId);
    assert.equal(resposta.body.livro_id, livroId);
    assert.equal(resposta.body.usuario_id, usuarioId);
    assert.equal(resposta.body.status, "ativo");
});
test("PATCH /emprestimos/:id/renovacao deve ampliar o prazo", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    const criacao = await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: gerarDataFutura(7)
        });

    const emprestimoId = criacao.body.id;
    const novaData = gerarDataFutura(14);

    const resposta = await request(app)
        .patch(`/emprestimos/${emprestimoId}/renovacao`)
        .send({
            data_prevista_devolucao: novaData
        });

    assert.equal(resposta.status, 200);
    assert.equal(resposta.body.id, emprestimoId);
    assert.equal(
        resposta.body.data_prevista_devolucao,
        novaData
    );
    assert.equal(resposta.body.status, "ativo");
});
test("PATCH renovacao deve exigir uma data posterior", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    const dataAtual = gerarDataFutura(7);

    const criacao = await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: dataAtual
        });

    const resposta = await request(app)
        .patch(`/emprestimos/${criacao.body.id}/renovacao`)
        .send({
            data_prevista_devolucao: dataAtual
        });

    assert.equal(resposta.status, 400);
    assert.equal(
        resposta.body.mensagem,
        "A nova data deve ser posterior ao prazo atual"
    );
});
test("PATCH renovacao deve rejeitar empréstimo devolvido", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    const criacao = await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: gerarDataFutura(7)
        });

    const emprestimoId = criacao.body.id;

    await request(app)
        .patch(`/emprestimos/${emprestimoId}/devolucao`);

    const resposta = await request(app)
        .patch(`/emprestimos/${emprestimoId}/renovacao`)
        .send({
            data_prevista_devolucao: gerarDataFutura(14)
        });

    assert.equal(resposta.status, 409);
    assert.equal(
        resposta.body.mensagem,
        "Empréstimo devolvido não pode ser renovado"
    );
});

test("GET /emprestimos deve rejeitar usuario_id inválido", async () => {
    const resposta = await request(app)
        .get("/emprestimos")
        .query({
            usuario_id: "abc"
        });

    assert.equal(resposta.status, 400);
    assert.equal(
        resposta.body.mensagem,
        "O ID do usuário deve ser um número inteiro positivo"
    );
});
test("GET /emprestimos deve filtrar pelo usuário e status", async () => {
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
            usuario_id: usuarioId,
            status: "ativo"
        });

    const emprestimo = resposta.body.find(
        item => item.id === emprestimoId
    );

    assert.equal(resposta.status, 200);
    assert.ok(emprestimo);

    assert.ok(
        resposta.body.every(
            item =>
                item.usuario_id === usuarioId &&
                item.status === "ativo"
        )
    );
});

test("GET /emprestimos deve rejeitar livro_id inválido", async () => {
    const resposta = await request(app)
        .get("/emprestimos")
        .query({
            livro_id: "abc"
        });

    assert.equal(resposta.status, 400);
    assert.equal(
        resposta.body.mensagem,
        "O ID do livro deve ser um número inteiro positivo"
    );
});

test("GET /emprestimos deve filtrar pelo livro e status", async () => {
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
            livro_id: livroId,
            status: "ativo"
        });

    const emprestimo = resposta.body.find(
        item => item.id === emprestimoId
    );

    assert.equal(resposta.status, 200);
    assert.ok(emprestimo);

    assert.ok(
        resposta.body.every(
            item =>
                item.livro_id === livroId &&
                item.status === "ativo"
        )
    );
});
test("livro deve refletir disponibilidade durante o empréstimo", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    const antes = await request(app)
        .get(`/livros/${livroId}`);

    assert.equal(antes.status, 200);
    assert.equal(antes.body.disponivel, true);

    const criacao = await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: gerarDataFutura()
        });

    const durante = await request(app)
        .get(`/livros/${livroId}`);

    assert.equal(durante.status, 200);
    assert.equal(durante.body.disponivel, false);

    await request(app)
        .patch(`/emprestimos/${criacao.body.id}/devolucao`);

    const depois = await request(app)
        .get(`/livros/${livroId}`);

    assert.equal(depois.status, 200);
    assert.equal(depois.body.disponivel, true);
});

test("GET /livros deve filtrar pela disponibilidade", async () => {
    const { livroId, usuarioId } =
        await prepararLivroEUsuario();

    await request(app)
        .post("/emprestimos")
        .send({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_prevista_devolucao: gerarDataFutura()
        });

    const indisponiveis = await request(app)
        .get("/livros")
        .query({
            disponivel: "false"
        });

    assert.equal(indisponiveis.status, 200);

    assert.ok(
        indisponiveis.body.some(
            livro => livro.id === livroId
        )
    );

    assert.ok(
        indisponiveis.body.every(
            livro => livro.disponivel === false
        )
    );

    const disponiveis = await request(app)
        .get("/livros")
        .query({
            disponivel: "true"
        });

    assert.equal(disponiveis.status, 200);

    assert.ok(
        disponiveis.body.every(
            livro => livro.disponivel === true
        )
    );

    assert.equal(
        disponiveis.body.some(
            livro => livro.id === livroId
        ),
        false
    );
});