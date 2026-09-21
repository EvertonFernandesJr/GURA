import * as auth from "./authService";

const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");
const loginStatus = document.querySelector("#login-status");
const signupStatus = document.querySelector("#signup-status");
const loginPanel = document.querySelector("#login-panel");
const signupPanel = document.querySelector("#signup-panel");

function clearStatus(element) {
  element.textContent = "";
  element.classList.remove("success");
}

function showPanel(targetPanel) {
  loginPanel.classList.toggle("hidden", targetPanel !== loginPanel);
  signupPanel.classList.toggle("hidden", targetPanel !== signupPanel);
  clearStatus(loginStatus);
  clearStatus(signupStatus);
}

document
  .querySelector("#show-signup")
  .addEventListener("click", () => showPanel(signupPanel));
document
  .querySelector("#show-login")
  .addEventListener("click", () => showPanel(loginPanel));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!loginForm.checkValidity()) {
    loginStatus.textContent =
      "Por favor, preencha todos os campos corretamente.";
    return;
  }

  const email = document.querySelector("#email").value.trim().toLowerCase();
  const password = document.querySelector("#password").value;

  try {
    await auth.login(email, password);

    loginStatus.textContent = "Login bem-sucedido!";
    loginStatus.classList.add("success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  } catch (error) {
    loginStatus.textContent = error.message;
  }
});

loginForm.addEventListener("input", () => clearStatus(loginStatus));

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!signupForm.checkValidity()) {
    signupStatus.textContent = "Preencha todos os campos corretamente.";
    return;
  }

  const name = document.querySelector("#signup-name").value.trim();
  const email = document
    .querySelector("#signup-email")
    .value.trim()
    .toLowerCase();
  const password = document.querySelector("#signup-password").value;
  const confirmPassword = document.querySelector(
    "#signup-confirm-password",
  ).value;

  if (password !== confirmPassword) {
    signupStatus.textContent = "As senhas não conferem.";
    return;
  }

  try {
    await auth.register(name, email, password);

    signupStatus.textContent = "Conta criada com sucesso!";
    signupStatus.classList.add("success");
    signupForm.reset();

    setTimeout(() => {
      showPanel(loginPanel);
      document.querySelector("#email").value = email;
      document.querySelector("#password").focus();
    }, 1200);
  } catch (error) {
    signupStatus.textContent = error.message;
  }
});

signupForm.addEventListener("input", () => clearStatus(signupStatus));