// A navbar agora está escrita direto no HTML de cada página (melhor para SEO).
// Este script marca o link da página atual como ativo e liga o botão de sair.
document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll(".navbar-menu a");
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  links.forEach(function (link) {
    const href = link.getAttribute("href");
    const linkPath = href.split("#")[0].split("/").pop();

    link.classList.remove("active");

    // links com âncora (ex.: /index.html#noticias) não marcam a página como ativa
    if (!href.includes("#") && linkPath === currentPath) {
      link.classList.add("active");
    }
  });

  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      localStorage.removeItem("authSession");
      window.location.href = "/login.html";
    });
  }
});
