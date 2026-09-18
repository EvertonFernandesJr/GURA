let aulaSelecionada = null;

const creditosMaterias = {
    "Cálculo": 6,
    "Robótica": 4,
    "Teologia": 2,
    "PI: Des. Sistemas Web": 6,
    "PI: Des. Sistemas Web.P": 6,
    "Org. de Sistemas de Comp.P": 6,
    "Org. de Sistemas de Comp.": 6,
    "Livre": 0
};

// --- GERENCIAMENTO DOS MODAIS DE PERÍODO ---
function abrirModalId(idModal) {
    document.getElementById(idModal).style.display = "flex";
}

function fecharModalId(idModal) {
    document.getElementById(idModal).style.display = "none";
}

function salvarPeriodo(modalId, inputId, labelId) {
    const dataValor = document.getElementById(inputId).value;
    
    if (!dataValor) {
        alert("Por favor, selecione uma data válida.");
        return;
    }

    const [ano, mes, dia] = dataValor.split("-");
    document.getElementById(labelId).innerText = `${dia}/${mes}/${ano}`;
    fecharModalId(modalId);
}

// --- GERENCIAMENTO DE AULAS ---
function alterarAula(celula) {
    aulaSelecionada = celula;
    let materiaAtual = celula.innerText.trim();
    let linha = celula.parentElement;
    let horario = linha.cells[0].innerText.trim();
    let coluna = celula.cellIndex;
    let tabela = celula.closest("table");
    let cabecalho = tabela.querySelectorAll("thead tr")[1];
    let dia = cabecalho.cells[coluna - 1].innerText.trim();

    document.getElementById("materiaAtual").innerText = materiaAtual;
    document.getElementById("diaAula").innerText = dia;
    document.getElementById("horarioAula").innerText = horario;
    document.getElementById("novaMateria").value = materiaAtual;

    const creditoText = creditosMaterias[materiaAtual] !== undefined 
        ? `${creditosMaterias[materiaAtual]} CR` 
        : "0 CR";
        
    document.getElementById("creditosMateria").innerText = creditoText;

    document.getElementById("modal").style.display = "flex";
}

function salvarAlteracao() {
    if (aulaSelecionada === null) return;
    let novaMateria = document.getElementById("novaMateria").value;
    aulaSelecionada.innerText = novaMateria;
    fecharModal();
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
    aulaSelecionada = null;
}

// --- FECHAR MODAIS AO CLICAR FORA ---
window.onclick = function(event) {
    const listaModais = ["modal", "modalMatricula", "modalPlanejado", "modalAtual", "modalAlteracao"];
    
    listaModais.forEach(id => {
        const modalEl = document.getElementById(id);
        if (modalEl && event.target === modalEl) {
            modalEl.style.display = "none";
        }
    });
};