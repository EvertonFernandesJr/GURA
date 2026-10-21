document.addEventListener("navbar:loaded", function () {
  const profileButton = document.getElementById("profile-btn");
  const modal = document.getElementById("modalProfile");
  const closeButton = document.getElementById("closeBtn");
  const saveButton = document.getElementById("saveBtn");

  if (!profileButton || !modal || !closeButton || !saveButton) {
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

  saveButton.addEventListener('click', function() {
    const session = JSON.parse(localStorage.getItem("authSession") || "null");
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    if(!session?.userId){
      alert("Sua sessão não foi encontrada. Faça Login novamente.")
      return
    }

    const user = users.find((item) => item.id === session.userId);

    if(!user){
      alert("Não foi possível encontrar sua conta.");
      return;
    }

       user.profile = {
        sexo: document.getElementById('Sexo').value,
        curso: document.getElementById('Curso').value,
        turno: document.getElementById('Turno').value,
        periodo: document.getElementById('Periodo').value
    };

    // Salva o objeto convertido em string JSON no localStorage
    localStorage.setItem('users', JSON.stringify(users));
    

    console.log("Usuário salvo com sucesso direto do form:", user);
    alert("Dados salvos com sucesso!");

    const evento = new CustomEvent("perfilAtualizado");
    document.dispatchEvent(evento);

    closeModal();
  });
});