
/* ========================================
   CONFIGURAÇÃO
======================================== */

const URL_PROFESSORES = "./professores.json";
const CHAVE_STORAGE = "gura-avaliacoes-por-usuario";
const CHAVE_ANTIGA = "gura-avaliacoes";
const CRITERIOS = ["geral", "aula", "pessoa"];

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
======================================== */

function lerPerfilDoAluno() {
    try {
        const sessao = JSON.parse(
            localStorage.getItem("authSession") || "null"
        );

        const usuarios = JSON.parse(
            localStorage.getItem("users") || "[]"
        );

        const usuario = usuarios.find(function (u) {
            return u.id === sessao?.userId;
        });

        const perfil = usuario?.profile;

        if (!perfil?.curso || !perfil?.periodo) {
            return null;
        }

        return perfil;
    } catch (erro) {
        console.error("Erro ao recuperar perfil:", erro);
        return null;
    }
}

// Exibe apenas professores do curso e período atual.
function filtrarProfessores(professores, perfil) {
    const nomeCurso = NOMES_CURSOS[perfil.curso];
    const periodoAluno = Number(perfil.periodo);

    return professores.filter(function (professor) {
        return (
            Array.isArray(professor.cursos_lecionados) &&
            professor.cursos_lecionados.includes(nomeCurso) &&
            Number(professor.periodo) === periodoAluno
        );
    });
}


/* ========================================
   MONTAGEM DOS CARDS
======================================== */

function escapar(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function textoNota(valor) {
    return Number.isFinite(valor)
        ? `${Number(valor.toFixed(2)).toLocaleString("pt-BR")}/5`
        : "–";
}

function htmlGrupoEstrelas(tipo, rotulo) {
    const estrelas = (
        '<img class="estrela" src="./images/starempty.png" alt="" draggable="false">'
    ).repeat(5);

    return `
        <div class="grupo-estrelas" data-tipo="${tipo}" data-nota="0">
            <span class="label-nota">${rotulo}</span>
            ${estrelas}
            <span class="valor-nota">0/5</span>
        </div>`;
}

function htmlCard(professor) {
    const media = calcularMedias(professor);

    return `
        <article
            class="professor-card"
            data-id="${professor.id}"
            data-nome="${escapar(professor.nome)}"
        >

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
                        <li>
                            Nota geral:
                            <span data-media="geral">
                                ${textoNota(media.nota_geral)}
                            </span>
                        </li>
                        <li>
                            Nota aula:
                            <span data-media="aula">
                                ${textoNota(media.nota_aula)}
                            </span>
                        </li>
                        <li>
                            Nota pessoa:
                            <span data-media="pessoa">
                                ${textoNota(media.nota_pessoa)}
                            </span>
                        </li>
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
                        <button
                            type="button"
                            class="btn-enviar-nota"
                        >
                            De sua nota
                        </button>

                        <button
                            type="button"
                            class="btn-limpar-nota"
                        >
                            Limpar nota
                        </button>
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


/* ========================================
   RENDERIZAÇÃO DOS PROFESSORES
======================================== */

function renderizar() {
    const perfil = lerPerfilDoAluno();
    let lista = [];

    if (!perfil) {
        mostrarMensagem(
            "Preencha seu perfil (clique na sua foto, no canto superior direito) para ver os professores do seu curso e período."
        );
    } else {
        lista = filtrarProfessores(todosProfessores, perfil);

        if (lista.length === 0) {
            mostrarMensagem(
                `Nenhum professor encontrado para ${NOMES_CURSOS[perfil.curso] || perfil.curso} no ${perfil.periodo}º período.`
            );
        } else {
            esconderMensagem();
        }
    }

    container.innerHTML = lista.map(htmlCard).join("");

    container
        .querySelectorAll(".professor-card")
        .forEach(restaurarNotas);

    professorAtual = 0;
    mostrarProfessor(false);
}


/* ========================================
   CARROSSEL
======================================== */

function mostrarProfessor(comAnimacao = true) {
    const cards = container.querySelectorAll(".professor-card");

    if (cards.length > 0) {
        const card = cards[professorAtual];

        if (card) {
            container.scrollTo({
                left: card.offsetLeft - container.offsetLeft,
                behavior: comAnimacao ? "smooth" : "instant"
            });
        }
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
    const total = container.querySelectorAll(
        ".professor-card"
    ).length;

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
======================================== */

function atualizarVisual(grupo, valor) {
    const estrelas = grupo.querySelectorAll(".estrela");

    estrelas.forEach(function (estrela, index) {
        const posicao = index + 1;

        if (valor >= posicao) {
            estrela.src = "./images/starfull.png";
        } else if (valor >= posicao - 0.5) {
            estrela.src = "./images/starsemi.png";
        } else {
            estrela.src = "./images/starempty.png";
        }
    });

    const valorNota = grupo.querySelector(".valor-nota");

    if (valorNota) {
        valorNota.textContent = `${valor}/5`;
    }
}

function posicaoDaEstrela(estrela) {
    const estrelas = estrela
        .closest(".grupo-estrelas")
        .querySelectorAll(".estrela");

    return Array.from(estrelas).indexOf(estrela) + 1;
}


// Prévia visual ao passar o mouse
container.addEventListener("mouseover", function (evento) {
    const estrela = evento.target.closest(".estrela");

    if (!estrela) return;

    atualizarVisual(
        estrela.closest(".grupo-estrelas"),
        posicaoDaEstrela(estrela)
    );
});

// Restaura a nota selecionada ao retirar o mouse
container.addEventListener("mouseout", function (evento) {
    const estrela = evento.target.closest(".estrela");

    if (!estrela) return;

    const grupo = estrela.closest(".grupo-estrelas");

    atualizarVisual(
        grupo,
        parseFloat(grupo.dataset.nota)
    );
});


/* ========================================
   INTERAÇÕES DE AVALIAÇÃO
======================================== */

container.addEventListener("click", function (evento) {
    const estrela = evento.target.closest(".estrela");
    const botaoEnviar = evento.target.closest(".btn-enviar-nota");
    const botaoLimpar = evento.target.closest(".btn-limpar-nota");

    // Seleção das estrelas
    if (estrela) {
        const grupo = estrela.closest(".grupo-estrelas");
        const posicao = posicaoDaEstrela(estrela);
        const notaAtual = parseFloat(grupo.dataset.nota);

        let novaNota;

        if (notaAtual === posicao) {
            novaNota = posicao - 0.5;
        } else if (notaAtual === posicao - 0.5) {
            novaNota = posicao;
        } else {
            novaNota = posicao;
        }

        grupo.dataset.nota = novaNota;
        atualizarVisual(grupo, novaNota);
        return;
    }

    // Enviar avaliação
    if (botaoEnviar) {
        evento.preventDefault();

        const card = botaoEnviar.closest(".professor-card");

        const avaliacao = {
            professorId: Number(card.dataset.id),
            professor: card.dataset.nome,
            data: new Date().toISOString()
        };

        card.querySelectorAll(".grupo-estrelas").forEach(
            function (grupo) {
                avaliacao[grupo.dataset.tipo] = parseFloat(
                    grupo.dataset.nota
                );
            }
        );

        if (!CRITERIOS.some(tipo => notaValida(avaliacao[tipo]))) {
            mostrarToast(
                "Selecione pelo menos uma nota antes de enviar."
            );
            return;
        }

        if (!salvarNoLocalStorage(card.dataset.id, avaliacao)) {
            return;
        }

        atualizarMedias(card);
        mostrarToast(`Nota enviada para ${card.dataset.nome}!`);
        return;
    }

    // Limpar avaliação imediatamente
    if (botaoLimpar) {
        evento.preventDefault();

        const card = botaoLimpar.closest(".professor-card");

        if (!salvarNoLocalStorage(card.dataset.id, null)) {
            return;
        }

        card.querySelectorAll(".grupo-estrelas").forEach(
            function (grupo) {
                grupo.dataset.nota = 0;
                atualizarVisual(grupo, 0);
            }
        );

        atualizarMedias(card);

        mostrarToast(
            `Nota de ${card.dataset.nome} foi limpa!`
        );
    }
});


/* ========================================
   ARMAZENAMENTO DAS AVALIAÇÕES
======================================== */

function usuarioAtual() {
    return JSON.parse(
        localStorage.getItem("authSession") || "null"
    )?.userId;
}

function notaValida(nota) {
    return (
        Number.isFinite(nota) &&
        nota >= 0.5 &&
        nota <= 5 &&
        Number.isInteger(nota * 2)
    );
}

function lerAvaliacoes() {
    return JSON.parse(
        localStorage.getItem(CHAVE_STORAGE) || "{}"
    );
}

// Migração de avaliações antigas
function migrarAvaliacoes() {
    const usuario = usuarioAtual();
    const anterior = localStorage.getItem(CHAVE_ANTIGA);

    if (!usuario || !anterior) return;

    const todas = lerAvaliacoes();
    const antigas = JSON.parse(anterior) || {};

    todas[usuario] ||= {};

    for (const [id, avaliacao] of Object.entries(antigas)) {
        if (
            !todas[usuario][id] &&
            CRITERIOS.some(
                tipo => notaValida(avaliacao?.[tipo])
            )
        ) {
            todas[usuario][id] = avaliacao;
        }
    }

    localStorage.setItem(
        CHAVE_STORAGE,
        JSON.stringify(todas)
    );

    localStorage.removeItem(CHAVE_ANTIGA);
}

function salvarNoLocalStorage(idProfessor, avaliacao) {
    const usuario = usuarioAtual();

    if (!usuario) {
        mostrarToast("Entre na sua conta para avaliar.");
        return false;
    }

    try {
        const todas = lerAvaliacoes();

        todas[usuario] ||= {};

        if (avaliacao) {
            todas[usuario][idProfessor] = avaliacao;
        } else {
            delete todas[usuario][idProfessor];
        }

        localStorage.setItem(
            CHAVE_STORAGE,
            JSON.stringify(todas)
        );

        return true;
    } catch (erro) {
        console.error(erro);

        mostrarToast(
            "Não foi possível salvar a alteração."
        );

        return false;
    }
}


/* ========================================
   CÁLCULO DINÂMICO DAS MÉDIAS
======================================== */

function calcularMedias(professor, todas = lerAvaliacoes()) {
    const inicial = professor.media_nota_avaliacao || {};

    const votos = Object.values(todas)
        .map(usuario => usuario[professor.id])
        .filter(Boolean);

    const media = {};

    for (const tipo of CRITERIOS) {
        const base = inicial[`nota_${tipo}`];

        const notas = votos
            .map(voto => voto[tipo])
            .filter(notaValida);

        // A média inicial do JSON tem peso 1.
        if (
            Number.isFinite(base) &&
            base >= 0 &&
            base <= 5
        ) {
            notas.push(base);
        }

        media[`nota_${tipo}`] = notas.length
            ? notas.reduce(
                (soma, nota) => soma + nota,
                0
            ) / notas.length
            : null;
    }

    return media;
}

function atualizarMedias(card) {
    const professor = todosProfessores.find(
        p => String(p.id) === card.dataset.id
    );

    if (!professor) return;

    const media = calcularMedias(professor);

    for (const tipo of CRITERIOS) {
        card.querySelector(
            `[data-media="${tipo}"]`
        ).textContent = textoNota(media[`nota_${tipo}`]);
    }
}

function restaurarNotas(card) {
    const avaliacaoSalva = (
        lerAvaliacoes()[usuarioAtual()]?.[card.dataset.id]
    );

    card.querySelectorAll(".grupo-estrelas").forEach(
        function (grupo) {
            const nota = avaliacaoSalva?.[grupo.dataset.tipo] || 0;

            grupo.dataset.nota = nota;
            atualizarVisual(grupo, nota);
        }
    );
}

// Atualiza as médias caso outra aba salve notas
window.addEventListener("storage", function (evento) {
    if (
        evento.key === CHAVE_STORAGE ||
        evento.key === null
    ) {
        container
            .querySelectorAll(".professor-card")
            .forEach(atualizarMedias);
    }
});


/* ========================================
   TOAST DE FEEDBACK
======================================== */

function mostrarToast(texto) {
    const toast = document.createElement("div");

    toast.className = "toast";
    toast.textContent = texto;

    document.body.appendChild(toast);

    setTimeout(function () {
        toast.remove();
    }, 3000);
}


/* ========================================
   INICIALIZAÇÃO
======================================== */

async function iniciar() {
    mostrarProfessor(false);

    try {
        const resposta = await fetch(URL_PROFESSORES);

        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }

        const dados = await resposta.json();

        todosProfessores = dados.professores || [];
        jsonCarregado = true;

        migrarAvaliacoes();
        renderizar();

    } catch (erro) {
        console.error(
            "Erro ao carregar professores:",
            erro
        );

        mostrarMensagem(
            "Não foi possível carregar os professores. Recarregue a página."
        );
    }
}


/* ========================================
   ATUALIZAÇÃO DO PERFIL E TOAST
======================================== */

document.addEventListener("perfilAtualizado", function () {
    if (!jsonCarregado) return;

    // Atualiza os professores para o período escolhido
    renderizar();

    const perfil = lerPerfilDoAluno();

    if (perfil) {
        mostrarToast(
            `Professores atualizados para o ${perfil.periodo}º período!`
        );
    } else {
        mostrarToast(
            "Perfil atualizado com sucesso!"
        );
    }
});


/* ========================================
   INICIAR A PÁGINA
======================================== */

// ESSENCIAL: carrega o JSON e cria os cards.
iniciar();
