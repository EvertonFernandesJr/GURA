function carregarMainBox() {
  const mainBox = document.getElementById("courseInfo");
  if (!mainBox) {
    return;
  }

  const nomesCursos = {
    eng_comp: "Eng. de Computação",
    eng_prod: "Eng. de Produção",
    eng_quimica: "Eng. Química",
    economia: "Economia",
  };

  const session = JSON.parse(localStorage.getItem("authSession") || "null");
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find((item) => item.id === session?.userId);
  const profile = user?.profile;
  const missingMessage = document.getElementById("profileMissingMessage");
  const studentSummary = document.getElementById("studentSummary");

  missingMessage.hidden = Boolean(profile);
  studentSummary.hidden = !profile;

  if (!user?.profile) {
    return;
  }

  document.getElementById("curso").textContent =
    nomesCursos[profile.curso] ?? profile.curso;
  document.getElementById("periodo").textContent = `${profile.periodo}º`;
  document.getElementById("turno").textContent = profile.turno;
}

document.addEventListener("DOMContentLoaded", carregarMainBox);
document.addEventListener("perfilAtualizado", carregarMainBox);
