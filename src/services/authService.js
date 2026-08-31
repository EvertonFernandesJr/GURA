const TOKEN_EXPIRATION = 60 * 60 * 1000

async function hashPassword(password){
    const encoder = new TextEncoder();

    const data = encoder.encode(password);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

function getUsers(){
    return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(){
    localStorage.setItem("users", JSON.stringify(users));
}

async function register(email, password){
    const users = getUsers();

    if(users.some(user => user.email === email)){
        throw new Error("Usuario ja existente");
    }

    const passwordHash = await hashPassword(password);

    const user = {
        id: crypto.randomUUID(),
        email,
        passwordHash
    };

    users.push(user);
    saveUsers(user);

    return user;
}

async function login(email, password){
    const users = getUsers();

    const user = users.find(user => user.email === email);

    if(!user){
        throw new Error("Email invalido");
    }

    const passwordHash = await hashPassword(password);

    if(passwordHash !== user.passwordHash){
        throw new Error("Senha invalida");
    }

    const token = await crypto.randomUUID();

    const session = {
        token,
        userId: user.id,
        expiresAt: Date.now() + TOKEN_EXPIRATION
    };

    localStorage.setItem("authSession", JSON.stringify(session));
    return session
}

function getSession(){
    const session = JSON.parse(
        localStorage.getItem("authSession")
    );

    if (!session){
        return null;
    }
    if(Date.now > session.expiresAt){
        logout();
        return null;
    }

}

function logout(){
    localStorage.removeItem("authSession");
}

function requireAuth(){
    const session = getSession();
    if(!session){
        window.location.href = "login.html";
        return null;
    }
    
    return session;
}