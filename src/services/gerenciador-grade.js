
 // ============================================================
 // CONFIGURAÇÕES
 // ============================================================

 // Base única de professores, compartilhada com a página de avaliações.
 const URLS_PROFESSORES = ["./professores.json"];

 const CURSOS = {
     eng_comp: "Engenharia da Computação",
     eng_prod: "Engenharia de Produção",
     eng_quimica: "Engenharia Química",
     economia: "Economia"
 };

 const DIAS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];

 // Cada célula representa uma aula de 50 minutos. Os horários diurnos
 // seguem as janelas de disponibilidade do professores.json.
 function criarSlots(inicio, fim) {
     const formatar = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
     const resultado = [];
     for (let m = paraMinutos(inicio); m + 50 <= paraMinutos(fim); m += 50) {
         const a = formatar(m), b = formatar(m + 50);
         resultado.push({ rotulo: `${a} - ${b}`, inicio: a, fim: b });
     }
     return resultado;
 }

 const GRADES_HORARIO = {
     matutino: [
         ...criarSlots("08:00", "11:20"),
         { rotulo: "11:20 - 13:15", inicio: "11:20", fim: "13:15", intervalo: "Almoço" },
         ...criarSlots("13:15", "17:25")
     ],
     noturno: criarSlots("19:00", "23:00")
 };

 const PERIODOS = {
     modalMatricula: { input: "dataMatricula", label: "labelMatricula" },
     modalPlanejado: { input: "dataPlanejado", label: "labelPlanejado" },
     modalAtual:     { input: "dataAtual",     label: "labelAtual" },
     modalAlteracao: { input: "dataAlteracao", label: "labelAlteracao" }
 };

 // ============================================================
 // ESTADO
 // ============================================================

 let aluno = null;
 let slots = [];
 let materias = [];
 let grade = {};
 let aulaSelecionada = null;

 // ============================================================
 // ALUNO (localStorage)
 // ============================================================

 function procurarUsuario(valor, depth = 0) {
     if (!valor || depth > 3) return null;
     if (Array.isArray(valor)) {
         for (const item of valor) {
             const u = procurarUsuario(item, depth + 1);
             if (u) return u;
         }
         return null;
     }
     if (typeof valor === "object") {
         if (valor.profile && valor.profile.curso) return valor;
         for (const k of ["user", "usuario", "currentUser"]) {
             if (valor[k]) {
                 const u = procurarUsuario(valor[k], depth + 1);
                 if (u) return u;
             }
         }
     }
     return null;
 }

 function lerStorage(storage, chave) {
     const bruto = storage.getItem(chave);
     if (!bruto) return null;
     let valor;
     try { valor = JSON.parse(bruto); } catch { valor = bruto; }

     if (typeof valor === "string") {
         const ref = storage.getItem(valor);
         if (!ref) return null;
         try { valor = JSON.parse(ref); } catch { return null; }
         const u = procurarUsuario(valor);
         return u ? { ...u, email: u.email || (chave.includes("@") ? chave : undefined) } : null;
     }

     const u = procurarUsuario(valor);
     if (!u) return null;
     return { ...u, email: u.email || (chave.includes("@") ? chave : undefined) };
 }

 function lerStorageJson(storage, chave) {
     try { return JSON.parse(storage.getItem(chave)); } catch { return null; }
 }

 function obterUsuarioLogado() {
     const sessao = lerStorageJson(localStorage, "authSession");
     if (sessao?.userId) {
         const usuarios = lerStorageJson(localStorage, "users");
         return Array.isArray(usuarios)
             ? usuarios.find(u => u.id === sessao.userId && u.profile?.curso) || null
             : null;
     }

     const chavesSessao = ["currentUser", "usuarioLogado", "loggedUser", "loggedInUser",
                           "sessionUser", "session", "user", "usuario"];

     for (const storage of [localStorage, sessionStorage]) {
         for (const chave of chavesSessao) {
             const u = lerStorage(storage, chave);
             if (u) return u;
         }
     }

     for (let i = 0; i < localStorage.length; i++) {
         const u = lerStorage(localStorage, localStorage.key(i));
         if (u) return u;
     }
     return null;
 }

 function obterAluno() {
     const u = obterUsuarioLogado();
     if (!u) return null;
     const p = u.profile;
     const turnoBruto = String(p.turno || "").toLowerCase();

     return {
         id: u.id || u.email || "anonimo",
         email: u.email || "",
         nome: u.name || "",
         curso: p.curso,
         periodo: parseInt(p.periodo, 10) || 1,
         turno: turnoBruto === "noturno" ? "noturno" : "matutino"
     };
 }

 // ============================================================
 // DADOS DAS MATÉRIAS
 // ============================================================

 async function carregarProfessores() {
     for (const url of URLS_PROFESSORES) {
         try {
             const resp = await fetch(url);
             if (!resp.ok) continue;
             const json = await resp.json();
             return json.professores || json;
         } catch { /* tenta o próximo */ }
     }
     throw new Error("Não foi possível carregar o professores.json");
 }

 function paraMinutos(hhmm) {
     const [h, m] = hhmm.split(":").map(Number);
     return h * 60 + m;
 }

 function slotsDaJanela(janela) {
     const ini = paraMinutos(janela.inicio);
     const fim = paraMinutos(janela.fim);
     return slots.flatMap((s, i) => !s.intervalo &&
         paraMinutos(s.inicio) >= ini && paraMinutos(s.fim) <= fim ? [i] : []);
 }

 function chaveCelula(dia, slotIndex) {
     return `${dia}|${slots[slotIndex].inicio}`;
 }

 function filtrarMaterias(professores) {
     const nomeCurso = CURSOS[aluno.curso];
     return professores
         .filter(p => p.periodo === aluno.periodo && p.cursos_lecionados.includes(nomeCurso))
         .map(p => {
             const chaves = new Set();
             p.horarios_disponiveis.forEach(h => {
                 h.janelas.forEach(j => {
                     slotsDaJanela(j).forEach(i => chaves.add(chaveCelula(h.dia_semana, i)));
                 });
             });
             return {
                 nome: p.materia,
                 professor: p.nome,
                 periodo: p.periodo,
                 creditos: p.aulas_por_semana,
                 chaves
             };
         });
 }

 function buscarMateria(nome) {
     return materias.find(m => m.nome === nome);
 }

 // ============================================================
 // GRADE (sugestão + persistência)
 // ============================================================

 function gerarGradeSugerida() {
     const nova = {};
     materias.forEach(m => {
         m.chaves.forEach(k => {
             if (!nova[k]) nova[k] = m.nome;
         });
     });
     return nova;
 }

 function chaveStorageGrade() {
     return `gradeAluno:v2:${aluno.id}:${aluno.curso}:${aluno.periodo}:${aluno.turno}`;
 }

 function chaveStoragePeriodos() {
     return `periodosGrade:${aluno ? aluno.id : "anonimo"}`;
 }

 function salvarGrade() {
     try { localStorage.setItem(chaveStorageGrade(), JSON.stringify(grade)); } catch { /* ignora */ }
 }

 function carregarGrade() {
     try {
         const salva = JSON.parse(localStorage.getItem(chaveStorageGrade()));
         if (salva && typeof salva === "object") {
             const limpa = {};
             Object.entries(salva).forEach(([k, nome]) => {
                 const [dia, inicio] = k.split("|");
                 if (DIAS.includes(dia) && slots.some(s => !s.intervalo && s.inicio === inicio) && buscarMateria(nome)) {
                     limpa[k] = nome;
                 }
             });
             return limpa;
         }
     } catch { /* usa sugestão */ }
     return gerarGradeSugerida();
 }

 function restaurarSugestao() {
     if (!confirm("Isso substitui a grade atual pela sugestão baseada nos horários dos professores. Continuar?")) return;
     grade = gerarGradeSugerida();
     salvarGrade();
     renderizarTudo();
 }

 // ============================================================
 // RENDERIZAÇÃO
 // ============================================================

 function el(tag, classe, texto) {
     const e = document.createElement(tag);
     if (classe) e.className = classe;
     if (texto !== undefined) e.textContent = texto;
     return e;
 }

 function renderizarInfoAluno() {
     document.getElementById("chipCurso").textContent = `Curso: ${CURSOS[aluno.curso] || aluno.curso}`;
     document.getElementById("chipPeriodo").textContent = `Período: ${aluno.periodo}º`;
     document.getElementById("chipTurno").textContent =
         `Turno: ${aluno.turno === "noturno" ? "Noturno" : "Matutino/Integral"}`;
 }

 function renderizarGrade() {
     const corpo = document.getElementById("corpoGrade");
     corpo.innerHTML = "";

     slots.forEach((slot, i) => {
         const tr = document.createElement("tr");
         tr.appendChild(el("td", "", slot.rotulo));

         if (slot.intervalo) {
             const td = el("td", "intervalo", slot.intervalo);
             td.colSpan = DIAS.length;
             tr.appendChild(td);
         } else {
             DIAS.forEach(dia => {
                 const chave = chaveCelula(dia, i);
                 const nome = grade[chave];
                 const td = el("td", "aula");
                 td.dataset.dia = dia;
                 td.dataset.slot = i;
                 td.tabIndex = 0;

                 if (nome) {
                     td.appendChild(document.createTextNode(nome));
                     const m = buscarMateria(nome);
                     if (m) td.appendChild(el("small", "", m.professor));
                 } else {
                     td.classList.add("livre");
                     td.textContent = "Livre";
                 }

                 td.addEventListener("click", () => alterarAula(td));
                 td.addEventListener("keydown", e => {
                     if (e.key === "Enter" || e.key === " ") {
                         e.preventDefault();
                         alterarAula(td);
                     }
                 });
                 tr.appendChild(td);
             });
         }
         corpo.appendChild(tr);
     });
 }

 function materiasNaGrade() {
     const usadas = new Set(Object.values(grade));
     return materias.filter(m => usadas.has(m.nome));
 }

 function renderizarCreditos() {
     const naGrade = materiasNaGrade();
     const total = naGrade.reduce((soma, m) => soma + m.creditos, 0);
     document.getElementById("totalCreditos").textContent = `${total} CR`;

     const lista = document.getElementById("listaMateriasMatriculadas");
     lista.innerHTML = "";

     if (!naGrade.length) {
         lista.appendChild(el("span", "sem-materias", "Nenhuma matéria na grade ainda."));
         return;
     }

     naGrade.forEach(m => {
         const card = el("div", "card-materia");
         card.appendChild(el("span", "nome", m.nome));
         card.appendChild(el("span", "creditos", `${m.creditos} ${m.creditos === 1 ? "Crédito" : "Créditos"}`));
         lista.appendChild(card);
     });
 }

 function renderizarMaterias() {
     const corpo = document.getElementById("corpoMaterias");
     corpo.innerHTML = "";

     if (!materias.length) {
         const tr = document.createElement("tr");
         const td = el("td", "", "Nenhuma matéria cadastrada para este curso e período.");
         td.colSpan = 4;
         tr.appendChild(td);
         corpo.appendChild(tr);
         return;
     }

     const usadas = new Set(Object.values(grade));
     materias.forEach(m => {
         const tr = document.createElement("tr");
         const tdNome = el("td", "", m.nome);
         tdNome.appendChild(el("small", "", m.professor));
         tr.appendChild(tdNome);
         tr.appendChild(el("td", "", `${m.periodo}º Semestre`));
         tr.appendChild(el("td", "", `${m.creditos} CR`));
         tr.appendChild(usadas.has(m.nome) ? el("td", "status-sim", "✔ Sim") : el("td", "status-nao", "Não"));
         corpo.appendChild(tr);
     });
 }

 function renderizarTudo() {
     renderizarGrade();
     renderizarCreditos();
     renderizarMaterias();
 }

 function mostrarAviso(texto) {
     const aviso = document.getElementById("avisoAluno");
     aviso.textContent = texto;
     aviso.hidden = !texto;
 }

 // ============================================================
 // MODAIS DE PERÍODO
 // ============================================================

 function carregarPeriodosSalvos() {
     let salvos = {};
     try { salvos = JSON.parse(localStorage.getItem(chaveStoragePeriodos())) || {}; } catch { /* vazio */ }
     Object.values(PERIODOS).forEach(({ label }) => {
         if (salvos[label]) {
             const [ano, mes, dia] = salvos[label].split("-");
             document.getElementById(label).innerText = `${dia}/${mes}/${ano}`;
         }
     });
 }

 function abrirModalId(idModal) {
     const cfg = PERIODOS[idModal];
     if (cfg) {
         try {
             const salvos = JSON.parse(localStorage.getItem(chaveStoragePeriodos())) || {};
             document.getElementById(cfg.input).value = salvos[cfg.label] || "";
         } catch { /* vazio */ }
     }
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

     try {
         const salvos = JSON.parse(localStorage.getItem(chaveStoragePeriodos())) || {};
         salvos[labelId] = dataValor;
         localStorage.setItem(chaveStoragePeriodos(), JSON.stringify(salvos));
     } catch { /* ignora */ }

     fecharModalId(modalId);
 }

 // ============================================================
 // MODAL DE ALTERAR AULA
 // ============================================================

 function preencherSelectMaterias() {
     const select = document.getElementById("novaMateria");
     select.innerHTML = "";
     materias.forEach(m => {
         const opt = document.createElement("option");
         opt.value = m.nome;
         opt.textContent = m.nome;
         select.appendChild(opt);
     });
     const livre = document.createElement("option");
     livre.value = "Livre";
     livre.textContent = "Livre";
     select.appendChild(livre);
 }

 function atualizarInfoSelecao() {
     if (!aulaSelecionada) return;
     const nome = document.getElementById("novaMateria").value;
     const m = buscarMateria(nome);
     document.getElementById("creditosMateria").innerText = `${m ? m.creditos : 0} CR`;

     const aviso = document.getElementById("avisoModal");
     if (!m) {
         aviso.hidden = true;
         return;
     }

     const chave = chaveCelula(aulaSelecionada.dataset.dia, aulaSelecionada.dataset.slot);
     const compativel = m.chaves.has(chave);
     aviso.className = compativel ? "aviso-modal ok" : "aviso-modal";
     aviso.textContent = compativel
         ? `Horário compatível com a disponibilidade de ${m.professor}.`
         : `${m.professor} não tem disponibilidade neste horário. Você pode salvar mesmo assim.`;
     aviso.hidden = false;
 }

 function alterarAula(celula) {
     aulaSelecionada = celula;
     const chave = chaveCelula(celula.dataset.dia, celula.dataset.slot);
     const materiaAtual = grade[chave] || "Livre";
     const slot = slots[celula.dataset.slot];

     document.getElementById("materiaAtual").innerText = materiaAtual;
     document.getElementById("diaAula").innerText = celula.dataset.dia;
     document.getElementById("horarioAula").innerText = slot.rotulo;
     document.getElementById("novaMateria").value = materiaAtual;

     atualizarInfoSelecao();
     document.getElementById("modal").style.display = "flex";
 }

 function salvarAlteracao() {
     if (aulaSelecionada === null) return;
     const novaMateria = document.getElementById("novaMateria").value;
     const chave = chaveCelula(aulaSelecionada.dataset.dia, aulaSelecionada.dataset.slot);

     if (novaMateria === "Livre") delete grade[chave];
     else grade[chave] = novaMateria;

     salvarGrade();
     renderizarTudo();
     fecharModal();
 }

 function fecharModal() {
     document.getElementById("modal").style.display = "none";
     document.getElementById("avisoModal").hidden = true;
     aulaSelecionada = null;
 }

 window.addEventListener("click", event => {
     ["modal", ...Object.keys(PERIODOS)].forEach(id => {
         const modalEl = document.getElementById(id);
         if (modalEl && event.target === modalEl) {
             modalEl.style.display = "none";
             if (id === "modal") aulaSelecionada = null;
         }
     });
 });

 // ============================================================
 // INICIALIZAÇÃO
 // ============================================================

 let versaoAtualizacao = 0;

 async function iniciar() {
     // Descarta carregamentos antigos se o perfil mudar durante o fetch.
     const minhaVersao = ++versaoAtualizacao;

     aluno = obterAluno();
     let avisoInicial = "";

     if (!aluno) {
         aluno = { id: "anonimo", email: "", nome: "", curso: "eng_comp", periodo: 1, turno: "matutino" };
         avisoInicial = "Não encontrei os dados do aluno no localStorage. Exibindo Engenharia da Computação, 1º período, matutino.";
     }

     slots = GRADES_HORARIO[aluno.turno];
     renderizarInfoAluno();
     carregarPeriodosSalvos();

     const seletorMateria = document.getElementById("novaMateria");
     seletorMateria.removeEventListener("change", atualizarInfoSelecao);
     seletorMateria.addEventListener("change", atualizarInfoSelecao);

     try {
         const professores = await carregarProfessores();
         if (minhaVersao !== versaoAtualizacao) return;
         materias = filtrarMaterias(professores);
     } catch (erro) {
         if (minhaVersao !== versaoAtualizacao) return;
         console.error("Erro ao carregar professores:", erro);
         materias = [];
         avisoInicial = "Não foi possível carregar o professores.json. Verifique o caminho em URLS_PROFESSORES.";
     }

     if (!avisoInicial && !materias.length) {
         avisoInicial = "Não há matérias cadastradas para este curso e período.";
     } else if (!avisoInicial && aluno.turno === "noturno" && !materiasNaGradeSugerida()) {
         avisoInicial = "Nenhum professor deste período tem horário noturno cadastrado. Monte a grade clicando nas células.";
     }

     mostrarAviso(avisoInicial);
     preencherSelectMaterias();
     grade = carregarGrade();
     renderizarTudo();
 }

 function materiasNaGradeSugerida() {
     return Object.keys(gerarGradeSugerida()).length > 0;
 }

 document.addEventListener("DOMContentLoaded", iniciar);
 document.addEventListener("perfilAtualizado", iniciar);

 // Mantém os handlers HTML originais disponíveis após o build do Vite.
 Object.assign(window, {
     abrirModalId,
     fecharModalId,
     salvarPeriodo,
     restaurarSugestao,
     fecharModal,
     salvarAlteracao
 });
