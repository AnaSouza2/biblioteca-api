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

test("GET /usuarios deve retornar uma lista", async () => {
    const resposta = await request(app).get("/usuarios");

    assert.equal(resposta.status, 200);
    assert.ok(Array.isArray(resposta.body));
});

test("POST /usuarios deve rejeitar campos vazios", async () => {
    const resposta = await request(app)
        .post("/usuarios")
        .send({
            nome: "   ",
            email: "ana@example.com"
        });

    assert.equal(resposta.status, 400);
    assert.equal(
        resposta.body.mensagem,
        "Nome e e-mail são obrigatórios"
    );
});

test("POST /usuarios deve rejeitar e-mail inválido", async () => {
    const resposta = await request(app)
        .post("/usuarios")
        .send({
            nome: "Ana Souza",
            email: "email-invalido"
        });

    assert.equal(resposta.status, 400);
    assert.equal(resposta.body.mensagem, "E-mail inválido");
});

test("POST /usuarios deve cadastrar um usuário", async () => {
    const email = `teste.${Date.now()}@example.com`;

    const resposta = await request(app)
        .post("/usuarios")
        .send({
            nome: "  Usuária de teste  ",
            email: email.toUpperCase()
        });

    assert.equal(resposta.status, 201);
    assert.equal(resposta.body.nome, "Usuária de teste");
    assert.equal(resposta.body.email, email);
    assert.ok(resposta.body.id);
    assert.ok(resposta.body.criado_em);
});

test("POST /usuarios deve rejeitar e-mail repetido", async () => {
    const email = `repetido.${Date.now()}@example.com`;

    await request(app)
        .post("/usuarios")
        .send({
            nome: "Primeiro usuário",
            email
        });

    const resposta = await request(app)
        .post("/usuarios")
        .send({
            nome: "Segundo usuário",
            email
        });

    assert.equal(resposta.status, 409);
    assert.equal(resposta.body.mensagem, "E-mail já cadastrado");
});

test("GET /usuarios/abc deve rejeitar um ID inválido", async () => {
    const resposta = await request(app).get("/usuarios/abc");

    assert.equal(resposta.status, 400);
    assert.equal(
        resposta.body.mensagem,
        "O ID deve ser um número inteiro positivo"
    );
});

test("GET /usuarios/:id deve retornar o usuário", async () => {
    const criacao = await request(app)
        .post("/usuarios")
        .send({
            nome: "Usuário para buscar",
            email: `busca.${Date.now()}@example.com`
        });

    const id = criacao.body.id;
    const resposta = await request(app).get(`/usuarios/${id}`);

    assert.equal(resposta.status, 200);
    assert.equal(resposta.body.id, id);
    assert.equal(resposta.body.nome, "Usuário para buscar");
});

test("PUT /usuarios/:id deve atualizar o usuário", async () => {
    const criacao = await request(app)
        .post("/usuarios")
        .send({
            nome: "Nome original",
            email: `original.${Date.now()}@example.com`
        });

    const id = criacao.body.id;
    const novoEmail = `atualizado.${Date.now()}@example.com`;

    const resposta = await request(app)
        .put(`/usuarios/${id}`)
        .send({
            nome: "Nome atualizado",
            email: novoEmail
        });

    assert.equal(resposta.status, 200);
    assert.equal(resposta.body.id, id);
    assert.equal(resposta.body.nome, "Nome atualizado");
    assert.equal(resposta.body.email, novoEmail);
});

test("DELETE /usuarios/:id deve apagar o usuário", async () => {
    const criacao = await request(app)
        .post("/usuarios")
        .send({
            nome: "Usuário para apagar",
            email: `apagar.${Date.now()}@example.com`
        });

    const id = criacao.body.id;

    const exclusao = await request(app)
        .delete(`/usuarios/${id}`);

    assert.equal(exclusao.status, 200);
    assert.equal(
        exclusao.body.mensagem,
        "Usuário apagado com sucesso!"
    );

    const busca = await request(app).get(`/usuarios/${id}`);

    assert.equal(busca.status, 404);
});