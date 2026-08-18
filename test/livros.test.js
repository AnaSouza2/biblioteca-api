import test, {before, after} from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";
import client from "../src/config/database.js";

before(async () => {
    await client.connect();
    await client.query("BEGIN");
});

after(async () => {
    await client.query("ROLLBACK");
    await client.end();
});

test("GET /livros deve retornar uma lista", async () => {
    const resposta = await request(app).get("/livros");

    assert.equal(resposta.status, 200);
    assert.ok(Array.isArray(resposta.body));
});

test("GET /livros/abc deve rejeitar um ID inválido", async () => {
    const resposta = await request(app).get("/livros/abc");

    assert.equal(resposta.status, 400);
    assert.equal(
        resposta.body.mensagem,
        "O ID deve ser um número inteiro positivo"
    );
});

test("POST /livros deve rejeitar campos vazios", async () => {
    const resposta = await request(app)
        .post("/livros")
        .send({
            titulo: "   ",
            autor: "Machado de Assis",
            status: "lido"
        });

    assert.equal(resposta.status, 400);
    assert.equal(
        resposta.body.mensagem,
        "Título, autor e status são obrigatórios"
    );
});

test("POST /livros deve rejeitar um status inválido", async () => {
    const resposta = await request(app)
        .post("/livros")
        .send({
            titulo: "Dom Casmurro",
            autor: "Machado de Assis",
            status: "comprado"
        });

    assert.equal(resposta.status, 400);
    assert.match(resposta.body.mensagem, /Status inválido/);
});

test("POST /livros deve cadastrar um livro válido", async () => {
    const resposta = await request(app)
        .post("/livros")
        .send({
            titulo: "Livro criado pelo teste",
            autor: "Autor do teste",
            status: "quero ler"
        });

    assert.equal(resposta.status, 201);
    assert.equal(resposta.body.titulo, "Livro criado pelo teste");
    assert.equal(resposta.body.autor, "Autor do teste");
    assert.equal(resposta.body.status, "quero ler");
    assert.ok(resposta.body.id);
});

test("PUT /livros/:id deve atualizar um livro", async () => {
    const criacao = await request(app)
        .post("/livros")
        .send({
            titulo: "Título original",
            autor: "Autor original",
            status: "quero ler"
        });

    const id = criacao.body.id;

    const resposta = await request(app)
        .put(`/livros/${id}`)
        .send({
            titulo: "Título atualizado",
            autor: "Autor atualizado",
            status: "lido"
        });

    assert.equal(resposta.status, 200);
    assert.equal(resposta.body.id, id);
    assert.equal(resposta.body.titulo, "Título atualizado");
    assert.equal(resposta.body.autor, "Autor atualizado");
    assert.equal(resposta.body.status, "lido");
});

test("DELETE /livros/:id deve apagar um livro", async () => {
    const criacao = await request(app)
        .post("/livros")
        .send({
            titulo: "Livro para apagar",
            autor: "Autor do teste",
            status: "quero ler"
        });

    const id = criacao.body.id;

    const exclusao = await request(app)
        .delete(`/livros/${id}`);

    assert.equal(exclusao.status, 200);
    assert.equal(
        exclusao.body.mensagem,
        "Livro apagado com sucesso!"
    );

    const busca = await request(app)
        .get(`/livros/${id}`);

    assert.equal(busca.status, 404);
});