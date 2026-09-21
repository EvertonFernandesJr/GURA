const container =
    document.querySelector(".professores-container");
const professores =
    document.querySelectorAll(".professor-card");
const setaAnterior =
    document.getElementById("professorAnterior");
const setaProximo =
    document.getElementById("proximoProfessor");
let professorAtual = 0;
        /* ========================================
           MOSTRAR PROFESSOR
        ========================================= */
function mostrarProfessor() {
    const larguraCard =
    container.clientWidth;
    container.scrollTo({
    left: larguraCard * professorAtual,
    behavior: "smooth"
            });
            /*
                Desativa a seta esquerda
                no primeiro professor.
            */
    setaAnterior.disabled =
        professorAtual === 0;
            /*
                Desativa a seta direita
                no último professor.
            */
    setaProximo.disabled =
        professorAtual === professores.length - 1;
        }
        /* ========================================
           VOLTAR
        ========================================= */

setaAnterior.addEventListener("click",function () { if (professorAtual > 0) {professorAtual--; mostrarProfessor();}});



        /* ========================================
           AVANÇAR
        ======================================== */

setaProximo.addEventListener("click",function () {if (professorAtual <professores.length - 1) {professorAtual++; mostrarProfessor();}});
        /* ========================================
           INICIALIZAÇÃO
        ======================================== */

mostrarProfessor();

/* ========================================
   SISTEMA DE ESTRELAS
========================================= */

const gruposEstrelas = document.querySelectorAll(".grupo-estrelas");

// Atualiza visualmente as 5 imagens de um grupo, dado um valor (ex: 3.5)
function atualizarVisual(grupo, valor) {
    const estrelas = grupo.querySelectorAll(".estrela");

    estrelas.forEach(function (estrela, index) {
        const posicao = index + 1; // estrelas são 1 a 5, index é 0 a 4

        if (valor >= posicao) {
            estrela.src = "/src/images/starfull.png";
        } else if (valor >= posicao - 0.5) {
            estrela.src = "/src/images/starsemi.png";
        } else {
            estrela.src = "/src/images/starempty.png";
        }
    });
}

gruposEstrelas.forEach(function (grupo) {
    const estrelas = grupo.querySelectorAll(".estrela");

    estrelas.forEach(function (estrela, index) {
        const posicao = index + 1;

        // PREVIEW (só guia visual, não muda a nota de fato)
        estrela.addEventListener("mouseover", function () {
            atualizarVisual(grupo, posicao);
        });

        // Ao tirar o mouse, volta pro valor realmente selecionado
        estrela.addEventListener("mouseout", function () {
            const notaAtual = parseFloat(grupo.dataset.nota);
            atualizarVisual(grupo, notaAtual);
        });

        // CLIQUE = seleciona de fato
        estrela.addEventListener("click", function () {
            const notaAtual = parseFloat(grupo.dataset.nota);
            let novaNota;

            if (notaAtual === posicao) {
                // já estava cheia nessa estrela -> diminui meio
                novaNota = posicao - 0.5;
            } else if (notaAtual === posicao - 0.5) {
                // já estava meia nessa estrela -> completa
                novaNota = posicao;
            } else {
                // estrela "nova" -> seleciona cheia
                novaNota = posicao;
            }

            grupo.dataset.nota = novaNota;
            atualizarVisual(grupo, novaNota);
        });
    });
});

/* ========================================
   ENVIAR NOTA (JSON + LOCALSTORAGE)
========================================= */

const CHAVE_STORAGE = "gura-avaliacoes";

const botoesEnviar = document.querySelectorAll(".btn-enviar-nota");

botoesEnviar.forEach(function (botao) {

    botao.addEventListener("click", function (evento) {
        evento.preventDefault();

        const card = botao.closest(".professor-card");
        const nomeProfessor = card.dataset.nome;

        const grupos = card.querySelectorAll(".grupo-estrelas");

        const avaliacao = {
            professor: nomeProfessor,
            data: new Date().toISOString()
        };

        grupos.forEach(function (grupo) {
            avaliacao[grupo.dataset.tipo] = parseFloat(grupo.dataset.nota);
        });

        salvarNoLocalStorage(nomeProfessor, avaliacao);

        // Continua gerando o .json também, pra sua apresentação
        const conteudo = JSON.stringify(avaliacao, null, 2);
        const blob = new Blob([conteudo], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const linkDownload = document.createElement("a");
        linkDownload.href = url;
        linkDownload.download = `avaliacao-${nomeProfessor}.json`;
        linkDownload.click();

        URL.revokeObjectURL(url);

        mostrarToast(`Nota enviada para ${nomeProfessor}!`);
    });

});


/* ========================================
   SALVAR / LER DO LOCALSTORAGE
========================================= */

function salvarNoLocalStorage(nomeProfessor, avaliacao) {

    // Pega tudo que já existe guardado (ou um objeto vazio, se for a 1ª vez)
    const todasAvaliacoes = JSON.parse(localStorage.getItem(CHAVE_STORAGE)) || {};

    // Atualiza só a entrada desse professor
    todasAvaliacoes[nomeProfessor] = avaliacao;

    // Guarda de volta como texto
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(todasAvaliacoes));

}

function carregarNotasSalvas() {

    const todasAvaliacoes = JSON.parse(localStorage.getItem(CHAVE_STORAGE)) || {};

    document.querySelectorAll(".professor-card").forEach(function (card) {

        const nomeProfessor = card.dataset.nome;
        const avaliacaoSalva = todasAvaliacoes[nomeProfessor];

        if (!avaliacaoSalva) return; // esse professor ainda não foi avaliado

        card.querySelectorAll(".grupo-estrelas").forEach(function (grupo) {
            const tipo = grupo.dataset.tipo;
            const nota = avaliacaoSalva[tipo] || 0;

            grupo.dataset.nota = nota;
            atualizarVisual(grupo, nota);
        });

    });

}

// Roda assim que a página carrega, pra restaurar notas de visitas anteriores
carregarNotasSalvas();


/* ========================================
   TOAST "NOTA ENVIADA!"
========================================= */

function mostrarToast(mensagem) {

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = mensagem;

    document.body.appendChild(toast);

    // Some sozinho depois de 3 segundos
    setTimeout(function () {
        toast.remove();
    }, 3000);

}