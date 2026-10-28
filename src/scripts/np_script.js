/* ========================================
   CONFIGURAÇÃO
========================================= */

const URL_PROFESSORES = "/professores_supremo.json";
const CHAVE_STORAGE = "gura-avaliacoes";

// valor salvo no perfil (modal) -> nome do curso usado em "cursos_lecionados" no JSON
const NOMES_CURSOS = {
    eng_comp: "Engenharia da Computação",
    eng_prod: "Engenharia de Produção",
    eng_quimica: "Engenharia Química",
    economia: "Economia"
};

const container = document.getElementById("professoresContainer");
const mensagem = document.getElementById("mensagemProfessores");
const setaAnterior = document.getElementById("professorAnterior");
const setaProximo = document.getElementById("proximoProfessor");

let todosProfessores = [];
let jsonCarregado = false;
let professorAtual = 0;


/* ========================================
   PERFIL DO ALUNO + FILTRO
========================================= */

// Lê o perfil salvo pelo modal (authSession -> users -> profile)
function lerPerfilDoAluno() {
    const sessao = JSON.parse(localStorage.getItem("authSession") || "null");
    const usuarios = JSON.parse(localStorage.getItem("users") || "[]");
    const usuario = usuarios.find(function (u) {
        return u.id === sessao?.userId;
    });
    const perfil = usuario?.profile;

    if (!perfil?.curso || !perfil?.periodo) return null;

    return perfil;
}

// Só aparecem professores que dão aula no curso do aluno
// e cuja matéria seja do período dele ou de um período anterior.
// (Para mostrar SOMENTE o período atual, troque "<=" por "===".)
function filtrarProfessores(professores, perfil) {
    const nomeCurso = NOMES_CURSOS[perfil.curso];
    const periodoAluno = Number(perfil.periodo);

    return professores.filter(function (professor) {
        return (
            professor.cursos_lecionados.includes(nomeCurso) &&
            professor.periodo <= periodoAluno
        );
    });
}


/* ========================================
   MONTAGEM DOS CARDS
========================================= */

function escapar(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function textoNota(valor) {
    return Number.isFinite(valor) ? `${valor}/5` : "–";
}

function htmlGrupoEstrelas(tipo, rotulo) {
    const estrelas = '<img class="estrela" src="/images/starempty.png" alt="" draggable="false">'.repeat(5);

    return `
        <div class="grupo-estrelas" data-tipo="${tipo}" data-nota="0">
            <span class="label-nota">${rotulo}</span>
            ${estrelas}
            <span class="valor-nota">0/5</span>
        </div>`;
}

function htmlCard(professor) {
    const media = professor.media_nota_avaliacao || {};

    return `
        <article class="professor-card" data-id="${professor.id}" data-nome="${escapar(professor.nome)}">

            <section class="dados-prof">
                <div class="foto-prof"></div>

                <div class="info-prof">
                    <h2 class="nome-prof">
                        <strong>Nome:</strong>
                        ${escapar(professor.nome)}
                    </h2>

                    <div>
                        <strong>Matéria:</strong>
                        ${escapar(professor.materia)}
                    </div>

                    <div>
                        <strong>Formação:</strong>
                        ${escapar(professor.formacao)}
                    </div>
                </div>
            </section>

            <section class="avaliacoes">

                <div class="avaliacao">
                    <h3>Média geral</h3>
                    <ul>
                        <li>Nota geral: <span>${textoNota(media.nota_geral)}</span></li>
                        <li>Nota aula: <span>${textoNota(media.nota_aula)}</span></li>
                        <li>Nota pessoa: <span>${textoNota(media.nota_pessoa)}</span></li>
                    </ul>
                </div>

                <div class="sua-nota">
                    <h3>Sua avaliação</h3>

                    <div class="notas-usuario">
                        ${htmlGrupoEstrelas("geral", "Nota geral")}
                        ${htmlGrupoEstrelas("aula", "Nota aula")}
                        ${htmlGrupoEstrelas("pessoa", "Nota pessoa")}
                    </div>

                    <div class="acoes-nota">
                        <button type="button" class="btn-enviar-nota">De sua nota</button>
                        <button type="button" class="btn-limpar-nota">Limpar nota</button>
                    </div>
                </div>

            </section>

        </article>`;
}

function mostrarMensagem(texto) {
    mensagem.textContent = texto;
    mensagem.hidden = false;
}

function esconderMensagem() {
    mensagem.hidden = true;
}

// Desenha o carrossel de acordo com o perfil atual do aluno
function renderizar() {
    const perfil = lerPerfilDoAluno();
    let lista = [];

    if (!perfil) {
        mostrarMensagem("Preencha seu perfil (clique na sua foto, no canto superior direito) para ver os professores do seu curso e período.");
    } else {
        lista = filtrarProfessores(todosProfessores, perfil);

        if (lista.length === 0) {
            mostrarMensagem(`Nenhum professor encontrado para ${NOMES_CURSOS[perfil.curso]} até o ${perfil.periodo}º período.`);
        } else {
            esconderMensagem();
        }
    }

    container.innerHTML = lista.map(htmlCard).join("");
    container.querySelectorAll(".professor-card").forEach(restaurarNotas);

    professorAtual = 0;
    mostrarProfessor(false);
}


/* ========================================
   CARROSSEL
========================================= */

function mostrarProfessor(comAnimacao = true) {
    const cards = container.querySelectorAll(".professor-card");

    if (cards.length > 0) {
        const card = cards[professorAtual];

        container.scrollTo({
            left: card.offsetLeft - container.offsetLeft,
            behavior: comAnimacao ? "smooth" : "instant"
        });
    }

    setaAnterior.disabled = professorAtual <= 0;
    setaProximo.disabled = professorAtual >= cards.length - 1;
}

setaAnterior.addEventListener("click", function () {
    if (professorAtual > 0) {
        professorAtual--;
        mostrarProfessor();
    }
});

setaProximo.addEventListener("click", function () {
    const total = container.querySelectorAll(".professor-card").length;

    if (professorAtual < total - 1) {
        professorAtual++;
        mostrarProfessor();
    }
});

window.addEventListener("resize", function () {
    mostrarProfessor(false);
});


/* ========================================
   SISTEMA DE ESTRELAS
========================================= */

// Atualiza visualmente as 5 imagens e o texto numérico de um grupo, dado um valor (ex: 3.5)
function atualizarVisual(grupo, valor) {
    const estrelas = grupo.querySelectorAll(".estrela");

    estrelas.forEach(function (estrela, index) {
        const posicao = index + 1; // estrelas são 1 a 5, index é 0 a 4

        if (valor >= posicao) {
            estrela.src = "/images/starfull.png";
        } else if (valor >= posicao - 0.5) {
            estrela.src = "/images/starsemi.png";
        } else {
            estrela.src = "/images/starempty.png";
        }
    });

    const valorNota = grupo.querySelector(".valor-nota");
    if (valorNota) {
        valorNota.textContent = `${valor}/5`;
    }
}

function posicaoDaEstrela(estrela) {
    const estrelas = estrela.closest(".grupo-estrelas").querySelectorAll(".estrela");
    return Array.from(estrelas).indexOf(estrela) + 1;
}

// Como os cards são criados pelo JS, os eventos ficam no container (delegação)

// PREVIEW (só guia visual, não muda a nota de fato)
container.addEventListener("mouseover", function (evento) {
    const estrela = evento.target.closest(".estrela");
    if (!estrela) return;

    atualizarVisual(estrela.closest(".grupo-estrelas"), posicaoDaEstrela(estrela));
});

// Ao tirar o mouse, volta pro valor realmente selecionado
container.addEventListener("mouseout", function (evento) {
    const estrela = evento.target.closest(".estrela");
    if (!estrela) return;

    const grupo = estrela.closest(".grupo-estrelas");
    atualizarVisual(grupo, parseFloat(grupo.dataset.nota));
});

container.addEventListener("click", function (evento) {
    const estrela = evento.target.closest(".estrela");
    const botaoEnviar = evento.target.closest(".btn-enviar-nota");
    const botaoLimpar = evento.target.closest(".btn-limpar-nota");

    // CLIQUE NA ESTRELA = seleciona de fato
    if (estrela) {
        const grupo = estrela.closest(".grupo-estrelas");
        const posicao = posicaoDaEstrela(estrela);
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
        return;
    }

    // ENVIAR NOTA (LOCALSTORAGE)
    if (botaoEnviar) {
        evento.preventDefault();

        const card = botaoEnviar.closest(".professor-card");
        const avaliacao = {
            professorId: Number(card.dataset.id),
            professor: card.dataset.nome,
            data: new Date().toISOString()
        };

        card.querySelectorAll(".grupo-estrelas").forEach(function (grupo) {
            avaliacao[grupo.dataset.tipo] = parseFloat(grupo.dataset.nota);
        });

        salvarNoLocalStorage(card.dataset.id, avaliacao);
        mostrarToast(`Nota enviada para ${card.dataset.nome}!`);
        return;
    }

    // LIMPAR NOTA (só visual, não mexe no localStorage)
    if (botaoLimpar) {
        evento.preventDefault();

        const card = botaoLimpar.closest(".professor-card");

        card.querySelectorAll(".grupo-estrelas").forEach(function (grupo) {
            grupo.dataset.nota = 0;
            atualizarVisual(grupo, 0);
        });

        mostrarToast(`Nota de ${card.dataset.nome} foi limpa!`);
    }
});


/* ========================================
   SALVAR / LER DO LOCALSTORAGE
========================================= */

// A chave é o id do professor, e não o nome:
// o mesmo professor aparece em várias matérias no JSON, cada uma com seu id.

function salvarNoLocalStorage(idProfessor, avaliacao) {
    const todasAvaliacoes = JSON.parse(localStorage.getItem(CHAVE_STORAGE)) || {};

    todasAvaliacoes[idProfessor] = avaliacao;

    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(todasAvaliacoes));
}

function restaurarNotas(card) {
    const todasAvaliacoes = JSON.parse(localStorage.getItem(CHAVE_STORAGE)) || {};
    const avaliacaoSalva = todasAvaliacoes[card.dataset.id];

    if (!avaliacaoSalva) return; // esse professor ainda não foi avaliado

    card.querySelectorAll(".grupo-estrelas").forEach(function (grupo) {
        const nota = avaliacaoSalva[grupo.dataset.tipo] || 0;

        grupo.dataset.nota = nota;
        atualizarVisual(grupo, nota);
    });
}


/* ========================================
   TOAST DE FEEDBACK
========================================= */

function mostrarToast(texto) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = texto;

    document.body.appendChild(toast);

    // Some sozinho depois de 3 segundos
    setTimeout(function () {
        toast.remove();
    }, 3000);
}


/* ========================================
   INICIALIZAÇÃO
========================================= */

async function iniciar() {
    mostrarProfessor(false); // setas desativadas até carregar

    try {
        const resposta = await fetch(URL_PROFESSORES);

        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }

        const dados = await resposta.json();
        todosProfessores = dados.professores || [];
        jsonCarregado = true;

        renderizar();
    } catch (erro) {
        console.error("Erro ao carregar professores:", erro);
        mostrarMensagem("Não foi possível carregar os professores. Recarregue a página.");
    }
}

// O modal de perfil dispara esse evento ao salvar: refiltra na hora
document.addEventListener("perfilAtualizado", function () {
    if (jsonCarregado) renderizar();
});

iniciar();
