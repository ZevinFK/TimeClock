// Carrega as configuracoes locais do arquivo .env.
require("dotenv").config();

const path = require("node:path");
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const requiredEnvironmentVariables = [
    "DB_HOST",
    "DB_USER",
    "DB_NAME",
    "JWT_SECRET"
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]
);

if (missingEnvironmentVariables.length > 0) {
    throw new Error(
        `Configure as variaveis obrigatorias: ${missingEnvironmentVariables.join(", ")}`
    );
}

if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres.");
}

// O pool reutiliza conexoes e evita abrir uma conexao nova para cada requisicao.
const database = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true
});

const app = express();
const port = Number(process.env.PORT || 3000);
const sessionCookieName = "timeclock_session";
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Cria um cookie HttpOnly: o JavaScript da pagina nao consegue ler o token.
function setSessionCookie(response, userId) {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "8h" });

    response.cookie(sessionCookieName, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        maxAge: 8 * 60 * 60 * 1000
    });
}

// Protege rotas que exigem que o usuario esteja autenticado.
function requireAuthentication(request, response, next) {
    const token = request.cookies[sessionCookieName];

    if (!token) {
        return response.status(401).json({ error: "Faca login para continuar." });
    }

    try {
        const session = jwt.verify(token, process.env.JWT_SECRET);
        request.userId = session.userId;
        return next();
    } catch (error) {
        if (error.name !== "JsonWebTokenError" && error.name !== "TokenExpiredError") {
            return next(error);
        }

        response.clearCookie(sessionCookieName, { sameSite: "strict", secure: isProduction });
        return response.status(401).json({ error: "Sua sessao expirou. Faca login novamente." });
    }
}

// Lista as empresas para preencher o seletor de cadastro com dados do MySQL.
app.get("/api/empresas", async (request, response, next) => {
    try {
        const [companies] = await database.query(
            "SELECT id_empresa, nome_empresa FROM Empresa ORDER BY nome_empresa"
        );
        response.json(companies);
    } catch (error) {
        next(error);
    }
});

// Cadastra o usuario e guarda somente o hash da senha, nunca a senha original.
app.post("/api/auth/register", async (request, response, next) => {
    const { nome, cpf, email, id_empresa, senha } = request.body || {};
    const normalizedCpf = typeof cpf === "string" ? cpf.replace(/\D/g, "") : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedName = typeof nome === "string" ? nome.trim() : "";
    const companyId = Number(id_empresa);

    if (!normalizedName || normalizedName.length > 100) {
        return response.status(400).json({ error: "Informe seu nome completo." });
    }

    if (!/^\d{11}$/.test(normalizedCpf)) {
        return response.status(400).json({ error: "Informe um CPF com 11 digitos." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 100) {
        return response.status(400).json({ error: "Informe um e-mail valido." });
    }

    if (!Number.isInteger(companyId) || companyId < 1) {
        return response.status(400).json({ error: "Selecione uma empresa valida." });
    }

    if (
        typeof senha !== "string" ||
        senha.length < 8 ||
        !/[A-Za-z]/.test(senha) ||
        !/\d/.test(senha) ||
        Buffer.byteLength(senha, "utf8") > 72
    ) {
        return response.status(400).json({
            error: "Use uma senha com pelo menos 8 caracteres, letras e numeros (maximo de 72 bytes)."
        });
    }

    try {
        const passwordHash = await bcrypt.hash(senha, 12);
        const [result] = await database.execute(
            `INSERT INTO Usuario (nome, cpf, email, senha, id_empresa)
             VALUES (?, ?, ?, ?, ?)`,
            [normalizedName, normalizedCpf, normalizedEmail, passwordHash, companyId]
        );

        response.status(201).json({ id_usuario: result.insertId });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return response.status(409).json({
                error: "Ja existe uma conta cadastrada com esse CPF ou e-mail."
            });
        }
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return response.status(400).json({ error: "A empresa selecionada nao existe." });
        }
        next(error);
    }
});

// Confere as credenciais e inicia uma sessao protegida por cookie.
app.post("/api/auth/login", async (request, response, next) => {
    const { cpf, senha } = request.body || {};
    const normalizedCpf = typeof cpf === "string" ? cpf.replace(/\D/g, "") : "";

    if (!normalizedCpf || typeof senha !== "string" || !senha) {
        return response.status(400).json({ error: "Informe CPF e senha." });
    }

    try {
        const [users] = await database.execute(
            "SELECT id_usuario, senha, ativo FROM Usuario WHERE cpf = ? LIMIT 1",
            [normalizedCpf]
        );
        const user = users[0];

        if (!user || !user.ativo || !(await bcrypt.compare(senha, user.senha))) {
            return response.status(401).json({ error: "CPF ou senha incorretos." });
        }

        setSessionCookie(response, user.id_usuario);
        response.json({ message: "Login realizado com sucesso." });
    } catch (error) {
        next(error);
    }
});

// Retorna somente os dados necessarios para preencher a tela da conta.
app.get("/api/auth/me", requireAuthentication, async (request, response, next) => {
    try {
        const [users] = await database.execute(
            `SELECT id_usuario, nome, cpf, email, telefone, ativo
             FROM Usuario WHERE id_usuario = ? LIMIT 1`,
            [request.userId]
        );

        if (users.length === 0 || !users[0].ativo) {
            response.clearCookie(sessionCookieName, { sameSite: "strict", secure: isProduction });
            return response.status(401).json({ error: "Conta nao encontrada ou inativa." });
        }

        response.json(users[0]);
    } catch (error) {
        next(error);
    }
});

// Encerra a sessao removendo o cookie do navegador.
app.post("/api/auth/logout", (request, response) => {
    response.clearCookie(sessionCookieName, { sameSite: "strict", secure: isProduction });
    response.json({ message: "Sessao encerrada." });
});

// Mostra as marcacoes do dia do usuario autenticado.
app.get("/api/registros", requireAuthentication, async (request, response, next) => {
    try {
        const [records] = await database.execute(
            `SELECT id_registro, tipo, data_hora
             FROM RegistroPonto
             WHERE id_usuario = ? AND DATE(data_hora) = CURDATE()
             ORDER BY data_hora DESC, id_registro DESC`,
            [request.userId]
        );
        response.json(records);
    } catch (error) {
        next(error);
    }
});

// Registra entrada e saida alternadamente, bloqueando marcacoes simultaneas do mesmo usuario.
app.post("/api/registros", requireAuthentication, async (request, response, next) => {
    let connection;

    try {
        connection = await database.getConnection();
        await connection.beginTransaction();

        await connection.execute(
            "SELECT id_usuario FROM Usuario WHERE id_usuario = ? FOR UPDATE",
            [request.userId]
        );
        const [latestRecords] = await connection.execute(
            `SELECT tipo FROM RegistroPonto
             WHERE id_usuario = ? AND DATE(data_hora) = CURDATE()
            ORDER BY data_hora DESC, id_registro DESC LIMIT 1`,
            [request.userId]
        );
        const nextType = latestRecords[0]?.tipo === "Entrada" ? "Saida" : "Entrada";

        const [result] = await connection.execute(
            `INSERT INTO RegistroPonto (id_usuario, tipo, data_hora)
             VALUES (?, ?, NOW())`,
            [request.userId, nextType]
        );
        const [records] = await connection.execute(
            `SELECT id_registro, tipo, data_hora
             FROM RegistroPonto WHERE id_registro = ?`,
            [result.insertId]
        );

        await connection.commit();
        response.status(201).json(records[0]);
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Nao foi possivel desfazer a transacao:", rollbackError);
            }
        }
        next(error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Disponibiliza as paginas HTML e seus arquivos estaticos pelo mesmo servidor da API.
app.use(express.static(path.join(__dirname, "projeto-ponto")));
app.get("/", (request, response) => response.redirect("/login.html"));

// Reporta erros do servidor sem expor detalhes internos ao navegador.
app.use((error, request, response, next) => {
    console.error("Erro na API:", error);

    if (response.headersSent) {
        return next(error);
    }

    response.status(500).json({ error: "Ocorreu um erro interno. Tente novamente." });
});

async function startServer() {
    await database.query("SELECT 1");
    app.listen(port, () => {
        console.log(`TimeClock disponivel em http://localhost:${port}`);
    });
}

startServer().catch((error) => {
    console.error("Nao foi possivel iniciar a aplicacao:", error);
    process.exitCode = 1;
});
