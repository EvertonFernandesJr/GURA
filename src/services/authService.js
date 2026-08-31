const TOKEN_EXPIRATION = 60 * 60 * 1000;

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

export async function register(name, email, password) {
  const users = getUsers();

  if (users.some((user) => user.email === email)) {
    throw new Error("Usuário já existente");
  }

  const passwordHash = await hashPassword(password);

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
  };

  users.push(user);
  saveUsers(users);

  return user;
}

export async function login(email, password) {
  const users = getUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    throw new Error("E-mail não encontrado");
  }

  const passwordHash = await hashPassword(password);

  if (passwordHash !== user.passwordHash) {
    throw new Error("Senha inválida");
  }

  const token = crypto.randomUUID();

  const session = {
    token,
    userId: user.id,
    name: user.name,
    email: user.email,
    expiresAt: Date.now() + TOKEN_EXPIRATION,
  };

  localStorage.setItem("authSession", JSON.stringify(session));
  return session;
}

export function getSession() {
  const session = JSON.parse(localStorage.getItem("authSession"));

  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    logout();
    return null;
  }

  return session;
}

export function logout() {
  localStorage.removeItem("authSession");
}

export function requireAuth() {
  const session = getSession();

  if (!session) {
    window.location.href = "login.html";
    return null;
  }

  return session;
}