const elementos = {
    statusApi: document.querySelector("#api-status"),
    totalLivros: document.querySelector("#total-livros"),
    totalUsuarios: document.querySelector("#total-usuarios"),
    emprestimosAtivos: document.querySelector("#emprestimos-ativos"),
    emprestimosAtrasados: document.querySelector("#emprestimos-atrasados"),
    emprestimosDevolvidos: document.querySelector("#emprestimos-devolvidos"),
    atualizar: document.querySelector("#atualizar-resumo")
};

async function buscarResumo() {
    const resposta = await fetch("/relatorios/resumo");
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.mensagem || "Não foi possível carregar o resumo"
        );
    }

    return dados;
}

function preencherResumo(resumo) {
    elementos.totalLivros.textContent = resumo.total_livros;
    elementos.totalUsuarios.textContent = resumo.total_usuarios;
    elementos.emprestimosAtivos.textContent = resumo.emprestimos_ativos;
    elementos.emprestimosAtrasados.textContent = resumo.emprestimos_atrasados;
    elementos.emprestimosDevolvidos.textContent = resumo.emprestimos_devolvidos;
}

async function carregarPainel() {
    elementos.atualizar.disabled = true;
    elementos.statusApi.className = "books-connection";
    elementos.statusApi.lastChild.textContent = " Atualizando";

    try {
        const resumo = await buscarResumo();
        preencherResumo(resumo);
        elementos.statusApi.classList.add("is-online");
        elementos.statusApi.lastChild.textContent = " API online";
    } catch (error) {
        elementos.statusApi.classList.add("is-error");
        elementos.statusApi.lastChild.textContent = " Falha na conexão";
    } finally {
        elementos.atualizar.disabled = false;
    }
}

elementos.atualizar.addEventListener("click", carregarPainel);
carregarPainel();
