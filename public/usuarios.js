const elementos = {
    statusApi: document.querySelector("#api-status"),
    total: document.querySelector("#total-usuarios"),
    comEmprestimo: document.querySelector("#usuarios-com-emprestimo"),
    semEmprestimo: document.querySelector("#usuarios-sem-emprestimo"),
    contagem: document.querySelector("#contagem-usuarios"),
    contagemRodape: document.querySelector("#contagem-rodape"),
    lista: document.querySelector("#lista-usuarios"),
    atualizar: document.querySelector("#atualizar-usuarios"),
    filtros: document.querySelector("#filtros-usuarios"),
    filtro: document.querySelector("#filtro-usuario"),
    limpar: document.querySelector("#limpar-usuarios"),
    mensagemPagina: document.querySelector("#mensagem-pagina"),
    novo: document.querySelector("#novo-usuario"),
    dialogo: document.querySelector("#dialog-usuario"),
    fechar: document.querySelector("#fechar-formulario"),
    cancelar: document.querySelector("#cancelar-formulario"),
    tituloFormulario: document.querySelector("#titulo-formulario"),
    formulario: document.querySelector("#formulario-usuario"),
    nome: document.querySelector("#usuario-nome"),
    email: document.querySelector("#usuario-email"),
    mensagemFormulario: document.querySelector("#mensagem-formulario"),
    salvar: document.querySelector("#salvar-usuario")
};

let usuariosCarregados = [];
let usuarioEmEdicao = null;

async function buscarJson(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json();
    if (!resposta.ok) {
        throw new Error(dados.mensagem || "Não foi possível concluir a operação");
    }
    return dados;
}

function normalizar(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatarData(data) {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(data));
}

function criarCelula(texto, classe) {
    const celula = document.createElement("td");
    celula.textContent = texto;
    if (classe) celula.classList.add(classe);
    return celula;
}

function criarBotao(texto, acao, id) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = `row-action is-${acao}`;
    botao.dataset.acao = acao;
    botao.dataset.id = id;
    botao.title = texto;
    botao.setAttribute("aria-label", texto);
    botao.innerHTML = acao === "editar"
        ? `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 20 4.2-1 10-10a2 2 0 0 0-2.8-2.8l-10 10L4 20Z"/><path d="m14 7.5 2.8 2.8"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7"/><path d="M10 11v5m4-5v5"/></svg>`;
    return botao;
}

function filtrarUsuarios() {
    const termo = normalizar(elementos.filtro.value.trim());
    if (!termo) return usuariosCarregados;
    return usuariosCarregados.filter((usuario) =>
        normalizar(usuario.nome).includes(termo) ||
        normalizar(usuario.email).includes(termo)
    );
}

function preencherTabela(usuarios) {
    elementos.lista.replaceChildren();
    elementos.contagem.textContent = `${usuarios.length} ${usuarios.length === 1 ? "resultado" : "resultados"}`;
    elementos.contagemRodape.textContent = `Mostrando ${usuarios.length} de ${usuariosCarregados.length} usuários`;

    if (usuarios.length === 0) {
        const linha = document.createElement("tr");
        const celula = criarCelula("Nenhum usuário corresponde à busca.", "books-empty");
        celula.colSpan = 4;
        linha.append(celula);
        elementos.lista.append(linha);
        return;
    }

    for (const usuario of usuarios) {
        const acoes = criarCelula("");
        acoes.className = "row-actions";
        acoes.append(
            criarBotao(`Editar ${usuario.nome}`, "editar", usuario.id),
            criarBotao(`Excluir ${usuario.nome}`, "excluir", usuario.id)
        );

        const linha = document.createElement("tr");
        linha.append(
            criarCelula(usuario.nome, "book-name"),
            criarCelula(usuario.email),
            criarCelula(formatarData(usuario.criado_em)),
            acoes
        );
        elementos.lista.append(linha);
    }
}

function preencherResumo(usuarios, emprestimos) {
    const ativos = new Set(
        emprestimos
            .filter((emprestimo) => emprestimo.status !== "devolvido")
            .map((emprestimo) => emprestimo.usuario_id)
    );
    elementos.total.textContent = usuarios.length;
    elementos.comEmprestimo.textContent = ativos.size;
    elementos.semEmprestimo.textContent = usuarios.length - ativos.size;
}

function definirConexao(online, texto) {
    elementos.statusApi.classList.toggle("is-online", online);
    elementos.statusApi.classList.toggle("is-error", !online);
    elementos.statusApi.lastChild.textContent = ` ${texto}`;
}

function mensagemPagina(texto, tipo = "") {
    elementos.mensagemPagina.className = "page-feedback";
    if (tipo) elementos.mensagemPagina.classList.add(tipo);
    elementos.mensagemPagina.textContent = texto;
}

async function carregarUsuarios() {
    elementos.atualizar.disabled = true;
    definirConexao(true, "Atualizando");
    try {
        const [usuarios, emprestimos] = await Promise.all([
            buscarJson("/usuarios"),
            buscarJson("/emprestimos")
        ]);
        usuariosCarregados = usuarios;
        preencherResumo(usuarios, emprestimos);
        preencherTabela(filtrarUsuarios());
        definirConexao(true, "API online");
    } catch (error) {
        definirConexao(false, "Falha na conexão");
        mensagemPagina(error.message, "is-error");
    } finally {
        elementos.atualizar.disabled = false;
    }
}

function abrirNovo() {
    usuarioEmEdicao = null;
    elementos.formulario.reset();
    elementos.tituloFormulario.textContent = "Novo usuário";
    elementos.salvar.textContent = "Cadastrar usuário";
    elementos.mensagemFormulario.textContent = "";
    elementos.dialogo.showModal();
    elementos.nome.focus();
}

function abrirEdicao(id) {
    const usuario = usuariosCarregados.find((item) => item.id === id);
    if (!usuario) return;
    usuarioEmEdicao = id;
    elementos.nome.value = usuario.nome;
    elementos.email.value = usuario.email;
    elementos.tituloFormulario.textContent = "Editar usuário";
    elementos.salvar.textContent = "Salvar alterações";
    elementos.mensagemFormulario.textContent = "";
    elementos.dialogo.showModal();
    elementos.nome.focus();
}

function fecharFormulario() {
    elementos.dialogo.close();
    elementos.formulario.reset();
    usuarioEmEdicao = null;
}

async function salvarUsuario(evento) {
    evento.preventDefault();
    const url = usuarioEmEdicao ? `/usuarios/${usuarioEmEdicao}` : "/usuarios";
    const method = usuarioEmEdicao ? "PUT" : "POST";
    elementos.salvar.disabled = true;
    elementos.mensagemFormulario.className = "drawer-feedback";
    elementos.mensagemFormulario.textContent = "Salvando...";

    try {
        await buscarJson(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome: elementos.nome.value.trim(),
                email: elementos.email.value.trim()
            })
        });
        const texto = usuarioEmEdicao ? "Usuário atualizado com sucesso." : "Usuário cadastrado com sucesso.";
        fecharFormulario();
        mensagemPagina(texto, "is-success");
        await carregarUsuarios();
    } catch (error) {
        elementos.mensagemFormulario.classList.add("is-error");
        elementos.mensagemFormulario.textContent = error.message;
    } finally {
        elementos.salvar.disabled = false;
    }
}

async function excluirUsuario(id) {
    const usuario = usuariosCarregados.find((item) => item.id === id);
    if (!usuario || !window.confirm(`Deseja realmente excluir “${usuario.nome}”?`)) return;
    try {
        await buscarJson(`/usuarios/${id}`, { method: "DELETE" });
        mensagemPagina("Usuário excluído com sucesso.", "is-success");
        await carregarUsuarios();
    } catch (error) {
        mensagemPagina(error.message, "is-error");
    }
}

elementos.novo.addEventListener("click", abrirNovo);
elementos.fechar.addEventListener("click", fecharFormulario);
elementos.cancelar.addEventListener("click", fecharFormulario);
elementos.formulario.addEventListener("submit", salvarUsuario);
elementos.atualizar.addEventListener("click", carregarUsuarios);
elementos.filtros.addEventListener("submit", (evento) => {
    evento.preventDefault();
    preencherTabela(filtrarUsuarios());
});
elementos.limpar.addEventListener("click", () => {
    elementos.filtros.reset();
    preencherTabela(usuariosCarregados);
});
elementos.lista.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;
    const id = Number(botao.dataset.id);
    if (botao.dataset.acao === "editar") abrirEdicao(id);
    if (botao.dataset.acao === "excluir") excluirUsuario(id);
});

carregarUsuarios();
