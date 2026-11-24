
document.addEventListener("navbar:loaded", function () {
  const profileButton = document.getElementById("profile-btn");
  const modal = document.getElementById("modalProfile");
  const closeButton = document.getElementById("closeBtn");
  const saveButton = document.getElementById("saveBtn");

  if (!profileButton || !modal || !closeButton || !saveButton) {
    return;
  }

  // Recupera o usuario que esta logado
  function obterUsuarioDaSessao() {
    try {
      const sessao = JSON.parse(
        localStorage.getItem("authSession") || "null"
      );

      const usuarios = JSON.parse(
        localStorage.getItem("users") || "[]"
      );

      if (!Array.isArray(usuarios)) return null;

      return usuarios.find(
        (usuario) => usuario.id === sessao?.userId
      ) || null;

    } catch (erro) {
      console.error("Erro ao recuperar usuario:", erro);
      return null;
    }
  }

  // Preenche os campos com o perfil salvo
  function carregarPerfilNoFormulario() {
    const usuario = obterUsuarioDaSessao();
    const perfil = usuario?.profile;

    if (!perfil) return;

    const campos = {
      Sexo: perfil.sexo,
      Curso: perfil.curso,
      Turno: perfil.turno,
      Periodo: perfil.periodo
    };

    for (const [id, valor] of Object.entries(campos)) {
      const campo = document.getElementById(id);

      if (!campo || valor == null) continue;

      const valorSalvo = String(valor);

      const opcaoExiste = [...campo.options].some(
        (opcao) => opcao.value === valorSalvo
      );

      if (opcaoExiste) {
        campo.value = valorSalvo;
      }
    }
  }

  // Abre o modal com os dados atualizados
  function openModal() {
    carregarPerfilNoFormulario();
    modal.style.display = "flex";
  }

  function closeModal() {
    modal.style.display = "none";
  }

  profileButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);

  // Fecha clicando fora do modal
  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Fecha com Escape
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  // Salva as alteracoes do perfil
  saveButton.addEventListener("click", function () {
    const sessao = JSON.parse(
      localStorage.getItem("authSession") || "null"
    );

    const usuarios = JSON.parse(
      localStorage.getItem("users") || "[]"
    );

    if (!sessao?.userId) {
      alert("Sua sessão não foi encontrada. Faça login novamente.");
      return;
    }

    const usuario = usuarios.find(
      (item) => item.id === sessao.userId
    );

    if (!usuario) {
      alert("Não foi possível encontrar sua conta.");
      return;
    }

    // Salva os valores selecionados
    usuario.profile = {
      sexo: document.getElementById("Sexo").value,
      curso: document.getElementById("Curso").value,
      turno: document.getElementById("Turno").value,
      periodo: document.getElementById("Periodo").value
    };

    localStorage.setItem(
      "users",
      JSON.stringify(usuarios)
    );

    // Atualiza as paginas que dependem do perfil
    document.dispatchEvent(
      new CustomEvent("perfilAtualizado")
    );

    closeModal();

    const paginaProfessores = window.location.pathname
      .endsWith("/notas-professores.html");

    if (!paginaProfessores) {
      alert("Dados salvos com sucesso!");
    }
  });
});
