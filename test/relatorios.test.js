import test, {
    before,
    after
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

test("GET /relatorios/resumo deve retornar os totais", async () => {
    const resposta = await request(app)
        .get("/relatorios/resumo");

    assert.equal(resposta.status, 200);

    assert.ok(Number.isInteger(
        resposta.body.total_livros
    ));

    assert.ok(Number.isInteger(
        resposta.body.total_usuarios
    ));

    assert.ok(Number.isInteger(
        resposta.body.emprestimos_ativos
    ));

    assert.ok(Number.isInteger(
        resposta.body.emprestimos_atrasados
    ));

    assert.ok(Number.isInteger(
        resposta.body.emprestimos_devolvidos
    ));
});