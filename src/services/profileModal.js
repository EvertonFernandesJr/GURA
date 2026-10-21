document.addEventListener("navbar:loaded", function () {
  const profileButton = document.getElementById("profile-btn");
  const modal = document.getElementById("modalProfile");
  const closeButton = document.getElementById("closeBtn");
  const formulario = document.getElementById("profileForm");

  if (!profileButton || !modal || !closeButton) {
    return;
  }

  function openModal() {
    modal.style.display = "flex";
  }

  function closeModal() {
    modal.style.display = "none";
  }

  profileButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  formulario.addEventListener('submit', function(event) {
    // Evita o comportamento padrão do HTML de recarregar a página
    event.preventDefault();

    // Se você já tiver um id salvo anteriormente, pode mantê-lo, 
    // caso contrário, gera um ID único (ex: timestamp atual)
    const usuarioExistente = JSON.parse(localStorage.getItem('usuario'));
    const idUsuario = usuarioExistente ? usuarioExistente.id : Date.now();

    // Captura os valores diretamente dos inputs/selects do formulário
    const usuario = {
        id: idUsuario,
        nome: document.getElementById('Nome').value,
        sexo: document.getElementById('Sexo').value,
        curso: document.getElementById('Curso').value,
        turno: document.getElementById('Turno').value,
        periodo: document.getElementById('Periodo').value
    };

    // Salva o objeto convertido em string JSON no localStorage
    localStorage.setItem('usuario', JSON.stringify(usuario));

    console.log("Usuário salvo com sucesso direto do form:", usuario);
    alert("Dados salvos com sucesso!");
  });
});