const elementos = {
    statusApi: document.querySelector("#api-status"),
    total: document.querySelector("#total-livros"),
    disponiveis: document.querySelector("#livros-disponiveis"),
    emprestados: document.querySelector("#livros-emprestados"),
    contagem: document.querySelector("#contagem-resultados"),
    contagemRodape: document.querySelector("#contagem-rodape"),
    lista: document.querySelector("#lista-livros"),
    atualizar: document.querySelector("#atualizar-livros"),
    formularioFiltros: document.querySelector("#filtros-livros"),
    filtroTitulo: document.querySelector("#filtro-titulo"),
    filtroStatus: document.querySelector("#filtro-status"),
    filtroDisponibilidade: document.querySelector("#filtro-disponibilidade"),
    limparFiltros: document.querySelector("#limpar-filtros"),
    mensagemPagina: document.querySelector("#mensagem-pagina"),
    novoLivro: document.querySelector("#novo-livro"),
    dialogo: document.querySelector("#dialog-livro"),
    fecharFormulario: document.querySelector("#fechar-formulario"),
    cancelarFormulario: document.querySelector("#cancelar-formulario"),
    tituloFormulario: document.querySelector("#titulo-formulario"),
    formularioLivro: document.querySelector("#formulario-livro"),
    titulo: document.querySelector("#livro-titulo"),
    autor: document.querySelector("#livro-autor"),
    status: document.querySelector("#livro-status"),
    mensagemFormulario: document.querySelector("#mensagem-formulario"),
    salvar: document.querySelector("#salvar-livro")
};

let livrosCarregados = [];
let livroEmEdicao = null;

async function buscarJson(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.mensagem || "Não foi possível concluir a operação"
        );
    }

    return dados;
}

function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function filtrarLivros() {
    const termo = normalizarTexto(elementos.filtroTitulo.value.trim());
    const status = elementos.filtroStatus.value;
    const disponibilidade = elementos.filtroDisponibilidade.value;

    return livrosCarregados.filter((livro) => {
        const correspondeBusca = !termo ||
            normalizarTexto(livro.titulo).includes(termo) ||
            normalizarTexto(livro.autor).includes(termo);
        const correspondeStatus = !status || livro.status === status;
        const correspondeDisponibilidade = !disponibilidade ||
            String(livro.disponivel) === disponibilidade;

        return correspondeBusca &&
            correspondeStatus &&
            correspondeDisponibilidade;
    });
}

function criarCelula(texto, classe) {
    const celula = document.createElement("td");
    celula.textContent = texto;

    if (classe) celula.classList.add(classe);
    return celula;
}

function criarEstado(texto, classes) {
    const estado = document.createElement("span");
    estado.className = classes;
    estado.textContent = texto;
    return estado;
}

function classeStatus(status) {
    const classes = {
        "quero ler": "is-wanted",
        "lendo": "is-reading",
        "lido": "is-read"
    };

    return classes[status] || "";
}

function criarBotaoAcao(texto, acao, id) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = `row-action is-${acao}`;
    botao.dataset.acao = acao;
    botao.dataset.id = id;
    botao.title = texto;
    botao.setAttribute("aria-label", texto);

    botao.innerHTML = acao === "editar"
        ? `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m4 20 4.2-1 10-10a2 2 0 0 0-2.8-2.8l-10 10L4 20Z"/>
                <path d="m14 7.5 2.8 2.8"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7"/>
                <path d="M10 11v5m4-5v5"/>
           </svg>`;

    return botao;
}

function preencherTabela(livros) {
    elementos.lista.replaceChildren();
    elementos.contagem.textContent =
        `${livros.length} ${livros.length === 1 ? "resultado" : "resultados"}`;
    elementos.contagemRodape.textContent =
        `Mostrando ${livros.length} de ${livrosCarregados.length} livros`;

    if (livros.length === 0) {
        const linha = document.createElement("tr");
        const celula = criarCelula(
            "Nenhum livro corresponde aos filtros.",
            "books-empty"
        );
        celula.colSpan = 5;
        linha.append(celula);
        elementos.lista.append(linha);
        return;
    }

    for (const livro of livros) {
        const linha = document.createElement("tr");
        const leitura = criarCelula("");
        const disponibilidade = criarCelula("");
        const acoes = criarCelula("");

        leitura.append(
            criarEstado(
                livro.status,
                `reading-status ${classeStatus(livro.status)}`
            )
        );
        disponibilidade.append(
            criarEstado(
                livro.disponivel ? "Disponível" : "Emprestado",
                livro.disponivel
                    ? "book-availability is-available"
                    : "book-availability is-unavailable"
            )
        );

        acoes.className = "row-actions";
        acoes.append(
            criarBotaoAcao(`Editar ${livro.titulo}`, "editar", livro.id),
            criarBotaoAcao(`Excluir ${livro.titulo}`, "excluir", livro.id)
        );

        linha.append(
            criarCelula(livro.titulo, "book-name"),
            criarCelula(livro.autor),
            leitura,
            disponibilidade,
            acoes
        );
        elementos.lista.append(linha);
    }
}

function preencherResumo(todos) {
    const disponiveis = todos.filter((livro) => livro.disponivel).length;
    elementos.total.textContent = todos.length;
    elementos.disponiveis.textContent = disponiveis;
    elementos.emprestados.textContent = todos.length - disponiveis;
}

function definirConexao(online, texto) {
    elementos.statusApi.classList.toggle("is-online", online);
    elementos.statusApi.classList.toggle("is-error", !online);
    elementos.statusApi.lastChild.textContent = ` ${texto}`;
}

function definirMensagemPagina(texto, tipo = "") {
    elementos.mensagemPagina.className = "page-feedback";
    if (tipo) elementos.mensagemPagina.classList.add(tipo);
    elementos.mensagemPagina.textContent = texto;
}

async function carregarLivros() {
    elementos.atualizar.disabled = true;
    definirConexao(true, "Atualizando");

    try {
        livrosCarregados = await buscarJson("/livros");
        preencherResumo(livrosCarregados);
        preencherTabela(filtrarLivros());
        definirConexao(true, "API online");
    } catch (error) {
        definirConexao(false, "Falha na conexão");
        definirMensagemPagina(error.message, "is-error");
    } finally {
        elementos.atualizar.disabled = false;
    }
}

function abrirNovoLivro() {
    livroEmEdicao = null;
    elementos.formularioLivro.reset();
    elementos.tituloFormulario.textContent = "Novo livro";
    elementos.salvar.textContent = "Cadastrar livro";
    elementos.mensagemFormulario.textContent = "";
    elementos.dialogo.showModal();
    elementos.titulo.focus();
}

function abrirEdicao(id) {
    const livro = livrosCarregados.find((item) => item.id === id);
    if (!livro) return;

    livroEmEdicao = livro.id;
    elementos.titulo.value = livro.titulo;
    elementos.autor.value = livro.autor;
    elementos.status.value = livro.status;
    elementos.tituloFormulario.textContent = "Editar livro";
    elementos.salvar.textContent = "Salvar alterações";
    elementos.mensagemFormulario.textContent = "";
    elementos.dialogo.showModal();
    elementos.titulo.focus();
}

function fecharFormulario() {
    elementos.dialogo.close();
    elementos.formularioLivro.reset();
    livroEmEdicao = null;
}

async function salvarLivro(evento) {
    evento.preventDefault();

    const url = livroEmEdicao
        ? `/livros/${livroEmEdicao}`
        : "/livros";
    const method = livroEmEdicao ? "PUT" : "POST";

    elementos.salvar.disabled = true;
    elementos.mensagemFormulario.className = "drawer-feedback";
    elementos.mensagemFormulario.textContent = "Salvando...";

    try {
        await buscarJson(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                titulo: elementos.titulo.value.trim(),
                autor: elementos.autor.value.trim(),
                status: elementos.status.value
            })
        });

        const mensagem = livroEmEdicao
            ? "Livro atualizado com sucesso."
            : "Livro cadastrado com sucesso.";

        fecharFormulario();
        definirMensagemPagina(mensagem, "is-success");
        await carregarLivros();
    } catch (error) {
        elementos.mensagemFormulario.classList.add("is-error");
        elementos.mensagemFormulario.textContent = error.message;
    } finally {
        elementos.salvar.disabled = false;
    }
}

async function excluirLivro(id) {
    const livro = livrosCarregados.find((item) => item.id === id);
    if (!livro) return;

    const confirmou = window.confirm(
        `Deseja realmente excluir “${livro.titulo}”?`
    );
    if (!confirmou) return;

    try {
        await buscarJson(`/livros/${id}`, { method: "DELETE" });
        definirMensagemPagina("Livro excluído com sucesso.", "is-success");
        await carregarLivros();
    } catch (error) {
        definirMensagemPagina(error.message, "is-error");
    }
}

elementos.novoLivro.addEventListener("click", abrirNovoLivro);
elementos.fecharFormulario.addEventListener("click", fecharFormulario);
elementos.cancelarFormulario.addEventListener("click", fecharFormulario);
elementos.formularioLivro.addEventListener("submit", salvarLivro);
elementos.atualizar.addEventListener("click", carregarLivros);

elementos.formularioFiltros.addEventListener("submit", (evento) => {
    evento.preventDefault();
    preencherTabela(filtrarLivros());
});

elementos.limparFiltros.addEventListener("click", () => {
    elementos.formularioFiltros.reset();
    preencherTabela(livrosCarregados);
});

elementos.lista.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    if (botao.dataset.acao === "editar") abrirEdicao(id);
    if (botao.dataset.acao === "excluir") excluirLivro(id);
});

carregarLivros();
