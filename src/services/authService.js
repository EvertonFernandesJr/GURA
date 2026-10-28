const TOKEN_EXPIRATION = 60 * 60 * 1000;

// Segredo usado para assinar o JWT (HS256).
// ATENCAO: sem backend ele fica visivel no navegador. Aceitavel so para demonstracao.
const JWT_SECRET = "teste-de-segredo-supremo-infalivel";

const encoder = new TextEncoder();

async function hashPassword(password) {
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlEncode(bytes) {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(text) {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const encodeJson = (obj) => base64UrlEncode(encoder.encode(JSON.stringify(obj)));
const decodeJson = (part) => JSON.parse(new TextDecoder().decode(base64UrlDecode(part)));

function getKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const data = `${encodeJson(header)}.${encodeJson(payload)}`;
  const signature = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(data));

  return `${data}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function verifyJwt(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;

    if (decodeJson(header).alg !== "HS256") return null;

    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      base64UrlDecode(signature),
      encoder.encode(`${header}.${payload}`)
    );
    if (!valid) return null;

    const claims = decodeJson(payload);
    if (typeof claims.exp !== "number" || Date.now() >= claims.exp * 1000) return null;

    return claims;
  } catch {
    return null;
  }
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

  const now = Math.floor(Date.now() / 1000);

  const token = await signJwt({
    sub: user.id,
    name: user.name,
    email: user.email,
    iat: now,
    exp: now + TOKEN_EXPIRATION / 1000,
  });

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

export async function getSession() {
  const stored = JSON.parse(localStorage.getItem("authSession"));

  if (!stored) {
    return null;
  }
  const claims = await verifyJwt(stored.token);

  if (!claims) {
    logout();
    return null;
  }

  return {
    token: stored.token,
    userId: claims.sub,
    name: claims.name,
    email: claims.email,
    expiresAt: claims.exp * 1000,
  };
}

export function logout() {
  localStorage.removeItem("authSession");
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    window.location.href = "login.html";
    return null;
  }

  return session;
}