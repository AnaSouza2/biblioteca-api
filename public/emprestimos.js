const elementos = {
    statusApi: document.querySelector("#api-status"),
    ativos: document.querySelector("#emprestimos-ativos"),
    atrasados: document.querySelector("#emprestimos-atrasados"),
    devolvidos: document.querySelector("#emprestimos-devolvidos"),
    contagem: document.querySelector("#contagem-emprestimos"),
    contagemRodape: document.querySelector("#contagem-rodape"),
    lista: document.querySelector("#lista-emprestimos"),
    atualizar: document.querySelector("#atualizar-emprestimos"),
    filtros: document.querySelector("#filtros-emprestimos"),
    filtroStatus: document.querySelector("#filtro-status"),
    filtroUsuario: document.querySelector("#filtro-usuario"),
    filtroLivro: document.querySelector("#filtro-livro"),
    limpar: document.querySelector("#limpar-emprestimos"),
    mensagemPagina: document.querySelector("#mensagem-pagina"),
    novo: document.querySelector("#novo-emprestimo"),
    dialogo: document.querySelector("#dialog-emprestimo"),
    fechar: document.querySelector("#fechar-emprestimo"),
    cancelar: document.querySelector("#cancelar-emprestimo"),
    formulario: document.querySelector("#formulario-emprestimo"),
    usuario: document.querySelector("#emprestimo-usuario"),
    livro: document.querySelector("#emprestimo-livro"),
    data: document.querySelector("#emprestimo-data"),
    mensagemFormulario: document.querySelector("#mensagem-formulario"),
    salvar: document.querySelector("#salvar-emprestimo"),
    dialogoRenovacao: document.querySelector("#dialog-renovacao"),
    fecharRenovacao: document.querySelector("#fechar-renovacao"),
    cancelarRenovacao: document.querySelector("#cancelar-renovacao"),
    formularioRenovacao: document.querySelector("#formulario-renovacao"),
    descricaoRenovacao: document.querySelector("#descricao-renovacao"),
    dataRenovacao: document.querySelector("#renovacao-data"),
    mensagemRenovacao: document.querySelector("#mensagem-renovacao"),
    salvarRenovacao: document.querySelector("#salvar-renovacao")
};

let emprestimosCarregados = [];
let usuariosCarregados = [];
let livrosCarregados = [];
let emprestimoEmRenovacao = null;

async function buscarJson(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível concluir a operação");
    return dados;
}

function dataIsoLocal(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function somarDias(dataBase, dias) {
    const data = new Date(`${dataBase.slice(0, 10)}T12:00:00`);
    data.setDate(data.getDate() + dias);
    return dataIsoLocal(data);
}

function formatarData(valor) {
    if (!valor) return "—";
    const data = new Date(`${String(valor).slice(0, 10)}T12:00:00`);
    return new Intl.DateTimeFormat("pt-BR").format(data);
}

function criarCelula(texto, classe) {
    const celula = document.createElement("td");
    celula.textContent = texto;
    if (classe) celula.classList.add(classe);
    return celula;
}

function preencherSelect(select, itens, textoInicial, obterTexto) {
    const valorAtual = select.value;
    select.replaceChildren();
    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = textoInicial;
    select.append(inicial);
    for (const item of itens) {
        const opcao = document.createElement("option");
        opcao.value = item.id;
        opcao.textContent = obterTexto(item);
        select.append(opcao);
    }
    if ([...select.options].some((opcao) => opcao.value === valorAtual)) {
        select.value = valorAtual;
    }
}

function filtrarEmprestimos() {
    return emprestimosCarregados.filter((emprestimo) =>
        (!elementos.filtroStatus.value || emprestimo.status === elementos.filtroStatus.value) &&
        (!elementos.filtroUsuario.value || String(emprestimo.usuario_id) === elementos.filtroUsuario.value) &&
        (!elementos.filtroLivro.value || String(emprestimo.livro_id) === elementos.filtroLivro.value)
    );
}

function criarBotaoAcao(texto, acao, id) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = `row-action loan-action is-${acao}`;
    botao.dataset.acao = acao;
    botao.dataset.id = id;
    botao.title = texto;
    botao.setAttribute("aria-label", texto);
    botao.innerHTML = acao === "devolver"
        ? `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8"/><path d="M4 4v4h4"/><path d="M12 8v5l3 2"/></svg>`;
    return botao;
}

function preencherTabela(emprestimos) {
    elementos.lista.replaceChildren();
    elementos.contagem.textContent = `${emprestimos.length} ${emprestimos.length === 1 ? "resultado" : "resultados"}`;
    elementos.contagemRodape.textContent = `Mostrando ${emprestimos.length} de ${emprestimosCarregados.length} empréstimos`;

    if (emprestimos.length === 0) {
        const linha = document.createElement("tr");
        const celula = criarCelula("Nenhum empréstimo corresponde aos filtros.", "books-empty");
        celula.colSpan = 6;
        linha.append(celula);
        elementos.lista.append(linha);
        return;
    }

    for (const emprestimo of emprestimos) {
        const status = criarCelula("");
        const chip = document.createElement("span");
        chip.className = `loan-status is-${emprestimo.status}`;
        chip.textContent = emprestimo.status;
        status.append(chip);

        const acoes = criarCelula("");
        acoes.className = "row-actions";
        if (emprestimo.status === "devolvido") {
            const concluido = document.createElement("span");
            concluido.className = "completed-label";
            concluido.textContent = "Concluído";
            acoes.append(concluido);
        } else {
            acoes.append(
                criarBotaoAcao(`Devolver ${emprestimo.livro}`, "devolver", emprestimo.id),
                criarBotaoAcao(`Renovar ${emprestimo.livro}`, "renovar", emprestimo.id)
            );
        }

        const linha = document.createElement("tr");
        linha.append(
            criarCelula(emprestimo.livro, "book-name"),
            criarCelula(emprestimo.usuario),
            criarCelula(formatarData(emprestimo.data_emprestimo)),
            criarCelula(formatarData(emprestimo.data_prevista_devolucao)),
            status,
            acoes
        );
        elementos.lista.append(linha);
    }
}

function mensagemPagina(texto, tipo = "") {
    elementos.mensagemPagina.className = "page-feedback";
    if (tipo) elementos.mensagemPagina.classList.add(tipo);
    elementos.mensagemPagina.textContent = texto;
}

function definirConexao(online, texto) {
    elementos.statusApi.classList.toggle("is-online", online);
    elementos.statusApi.classList.toggle("is-error", !online);
    elementos.statusApi.lastChild.textContent = ` ${texto}`;
}

async function carregarDados() {
    elementos.atualizar.disabled = true;
    definirConexao(true, "Atualizando");
    try {
        const [emprestimos, usuarios, livros, resumo] = await Promise.all([
            buscarJson("/emprestimos"),
            buscarJson("/usuarios"),
            buscarJson("/livros"),
            buscarJson("/relatorios/resumo")
        ]);
        emprestimosCarregados = emprestimos;
        usuariosCarregados = usuarios;
        livrosCarregados = livros;

        elementos.ativos.textContent = resumo.emprestimos_ativos;
        elementos.atrasados.textContent = resumo.emprestimos_atrasados;
        elementos.devolvidos.textContent = resumo.emprestimos_devolvidos;

        preencherSelect(elementos.filtroUsuario, usuarios, "Todos", (usuario) => usuario.nome);
        preencherSelect(elementos.filtroLivro, livros, "Todos", (livro) => livro.titulo);
        preencherSelect(elementos.usuario, usuarios, "Selecione", (usuario) => usuario.nome);
        preencherSelect(elementos.livro, livros.filter((livro) => livro.disponivel), "Selecione", (livro) => livro.titulo);

        const podeCadastrar = usuarios.length > 0 && livros.some((livro) => livro.disponivel);
        elementos.novo.disabled = !podeCadastrar;
        elementos.novo.title = podeCadastrar ? "" : "Cadastre um usuário e tenha um livro disponível";

        preencherTabela(filtrarEmprestimos());
        definirConexao(true, "API online");
    } catch (error) {
        definirConexao(false, "Falha na conexão");
        mensagemPagina(error.message, "is-error");
    } finally {
        elementos.atualizar.disabled = false;
    }
}

function abrirNovo() {
    elementos.formulario.reset();
    const hoje = dataIsoLocal(new Date());
    elementos.data.min = hoje;
    elementos.data.value = somarDias(hoje, 14);
    elementos.mensagemFormulario.textContent = "";
    elementos.dialogo.showModal();
    elementos.usuario.focus();
}

function fecharNovo() {
    elementos.dialogo.close();
    elementos.formulario.reset();
}

async function salvarEmprestimo(evento) {
    evento.preventDefault();
    elementos.salvar.disabled = true;
    elementos.mensagemFormulario.className = "drawer-feedback";
    elementos.mensagemFormulario.textContent = "Registrando...";
    try {
        await buscarJson("/emprestimos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_id: elementos.usuario.value,
                livro_id: elementos.livro.value,
                data_prevista_devolucao: elementos.data.value
            })
        });
        fecharNovo();
        mensagemPagina("Empréstimo registrado com sucesso.", "is-success");
        await carregarDados();
    } catch (error) {
        elementos.mensagemFormulario.classList.add("is-error");
        elementos.mensagemFormulario.textContent = error.message;
    } finally {
        elementos.salvar.disabled = false;
    }
}

async function devolverEmprestimo(id) {
    const emprestimo = emprestimosCarregados.find((item) => item.id === id);
    if (!emprestimo || !window.confirm(`Confirmar a devolução de “${emprestimo.livro}”?`)) return;
    try {
        await buscarJson(`/emprestimos/${id}/devolucao`, { method: "PATCH" });
        mensagemPagina("Devolução registrada com sucesso.", "is-success");
        await carregarDados();
    } catch (error) {
        mensagemPagina(error.message, "is-error");
    }
}

function abrirRenovacao(id) {
    const emprestimo = emprestimosCarregados.find((item) => item.id === id);
    if (!emprestimo) return;
    emprestimoEmRenovacao = id;
    elementos.descricaoRenovacao.textContent = `${emprestimo.livro} — ${emprestimo.usuario}`;
    const prazoAtual = String(emprestimo.data_prevista_devolucao).slice(0, 10);
    elementos.dataRenovacao.min = somarDias(prazoAtual, 1);
    elementos.dataRenovacao.value = somarDias(prazoAtual, 7);
    elementos.mensagemRenovacao.textContent = "";
    elementos.dialogoRenovacao.showModal();
    elementos.dataRenovacao.focus();
}

function fecharRenovacao() {
    elementos.dialogoRenovacao.close();
    elementos.formularioRenovacao.reset();
    emprestimoEmRenovacao = null;
}

async function renovarEmprestimo(evento) {
    evento.preventDefault();
    elementos.salvarRenovacao.disabled = true;
    elementos.mensagemRenovacao.className = "drawer-feedback";
    elementos.mensagemRenovacao.textContent = "Renovando...";
    try {
        await buscarJson(`/emprestimos/${emprestimoEmRenovacao}/renovacao`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data_prevista_devolucao: elementos.dataRenovacao.value })
        });
        fecharRenovacao();
        mensagemPagina("Empréstimo renovado com sucesso.", "is-success");
        await carregarDados();
    } catch (error) {
        elementos.mensagemRenovacao.classList.add("is-error");
        elementos.mensagemRenovacao.textContent = error.message;
    } finally {
        elementos.salvarRenovacao.disabled = false;
    }
}

elementos.novo.addEventListener("click", abrirNovo);
elementos.fechar.addEventListener("click", fecharNovo);
elementos.cancelar.addEventListener("click", fecharNovo);
elementos.formulario.addEventListener("submit", salvarEmprestimo);
elementos.fecharRenovacao.addEventListener("click", fecharRenovacao);
elementos.cancelarRenovacao.addEventListener("click", fecharRenovacao);
elementos.formularioRenovacao.addEventListener("submit", renovarEmprestimo);
elementos.atualizar.addEventListener("click", carregarDados);
elementos.filtros.addEventListener("submit", (evento) => {
    evento.preventDefault();
    preencherTabela(filtrarEmprestimos());
});
elementos.limpar.addEventListener("click", () => {
    elementos.filtros.reset();
    preencherTabela(emprestimosCarregados);
});
elementos.lista.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;
    const id = Number(botao.dataset.id);
    if (botao.dataset.acao === "devolver") devolverEmprestimo(id);
    if (botao.dataset.acao === "renovar") abrirRenovacao(id);
});

carregarDados();
