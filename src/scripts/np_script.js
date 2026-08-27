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
