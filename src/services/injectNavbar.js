import navbarHtml from "../../navbar.html?raw";

document.addEventListener("DOMContentLoaded", function(){
  const target = document.getElementById("header-nav");
  if (!target) return;
  const fragment = new DOMParser().parseFromString(navbarHtml, "text/html");
  target.innerHTML = fragment.body.innerHTML;
  document.dispatchEvent(new Event("navbar:loaded"));
})

document.addEventListener("navbar:loaded", () => {
  const logoutButton = document.getElementById("logout-btn");
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("authSession");
    window.location.href = "./login.html";
  });

  const links = document.querySelectorAll(".navbar-menu a");
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
 
  links.forEach(link => {
    const linkPath = link.getAttribute("href").split("/").pop();
 
    link.classList.remove("active");
 
    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });
});