// Este arquivo roda no navegador; o acesso ao MySQL acontece apenas no servidor Node.js.
// As paginas e a API usam a mesma origem, entao nao ha credenciais do banco aqui.

// Centraliza as chamadas HTTP e mostra as mensagens de erro devolvidas pela API.
async function chamarApi(caminho, opcoes = {}) {
    const configuracao = {
        ...opcoes,
        headers: {
            ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
            ...opcoes.headers
        },
        credentials: "same-origin"
    };

    const resposta = await fetch(caminho, configuracao);
    const conteudo = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(conteudo.error || "Nao foi possivel concluir a operacao.");
    }

    return conteudo;
}

// Liga a tela de cadastro aos endpoints de empresas e criacao de conta.
async function iniciarCadastro() {
    const botaoCadastro = document.getElementById("botao-criar-conta");
    if (!botaoCadastro) return;

    const seletorEmpresa = document.getElementById("select-empresa");
    try {
        const empresas = await chamarApi("/api/empresas");
        seletorEmpresa.replaceChildren(new Option("Selecione a empresa", ""));
        seletorEmpresa.options[0].disabled = true;
        seletorEmpresa.options[0].selected = true;

        for (const empresa of empresas) {
            seletorEmpresa.add(new Option(empresa.nome_empresa, empresa.id_empresa));
        }
    } catch (error) {
        alert(`Nao foi possivel carregar as empresas: ${error.message}`);
    }

    botaoCadastro.addEventListener("click", async () => {
        const senha = document.getElementById("input-senha").value;
        const confirmarSenha = document.getElementById("input-confirma-senha").value;

        if (senha !== confirmarSenha) {
            alert("As senhas nao conferem.");
            return;
        }
        if (!document.getElementById("check-termos").checked) {
            alert("Aceite os termos para criar sua conta.");
            return;
        }

        try {
            await chamarApi("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    nome: document.getElementById("input-nome").value,
                    cpf: document.getElementById("input-cpf").value,
                    email: document.getElementById("input-email").value,
                    id_empresa: seletorEmpresa.value,
                    senha
                })
            });
            alert("Conta criada. Agora voce pode entrar.");
            window.location.href = "login.html";
        } catch (error) {
            alert(error.message);
        }
    });
}

// Envia CPF e senha para a API; a sessao volta em um cookie HttpOnly.
function iniciarLogin() {
    const botaoLogin = document.getElementById("botao-entrar");
    if (!botaoLogin) return;

    botaoLogin.addEventListener("click", async () => {
        try {
            await chamarApi("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    cpf: document.getElementById("login-cpf").value,
                    senha: document.getElementById("login-senha").value
                })
            });
            window.location.href = "ponto.html";
        } catch (error) {
            alert(error.message);
        }
    });

    document.getElementById("botao-ir-cadastro").addEventListener("click", () => {
        window.location.href = "cadastro.html";
    });
}

// Formata a data enviada pelo MySQL sem alterar o horario local do registro.
function formatarHorario(dataHora) {
    const data = new Date(dataHora.replace(" ", "T"));
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Mantem o relogio da tela atualizado mesmo antes de carregar os registros.
function atualizarRelogio() {
    const visor = document.getElementById("visor-tempo-grade");
    if (!visor) return;

    const agora = new Date();
    visor.textContent = agora.toLocaleTimeString("pt-BR");
    document.getElementById("data-atual").textContent = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long"
    }).format(agora);
}

// Carrega as marcacoes do dia e atualiza o botao para a proxima acao permitida.
async function carregarPonto() {
    const botaoPonto = document.getElementById("botao-bater-ponto");
    if (!botaoPonto) return;

    try {
        await chamarApi("/api/auth/me");
        const registros = await chamarApi("/api/registros");
        const lista = document.getElementById("lista-registros");
        lista.replaceChildren();

        if (registros.length === 0) {
            lista.textContent = "Nenhum registro de ponto hoje.";
        } else {
            for (const registro of registros) {
                const linha = document.createElement("div");
                linha.className = "linha-registro";

                const tipo = document.createElement("span");
                tipo.className = registro.tipo === "Entrada" ? "tag-entrada" : "tag-saida";
                tipo.textContent = registro.tipo === "Saida" ? "Saída" : registro.tipo;

                const horario = document.createElement("span");
                horario.textContent = formatarHorario(registro.data_hora);

                linha.append(tipo, horario);
                lista.append(linha);
            }
        }

        const ultimoRegistro = registros[0];
        const proximoTipo = ultimoRegistro?.tipo === "Entrada" ? "Saida" : "Entrada";
        const nomeProximoTipo = proximoTipo === "Saida" ? "saída" : "entrada";
        botaoPonto.textContent = `Registrar ${nomeProximoTipo}`;
        document.getElementById("status-trabalho").textContent = ultimoRegistro
            ? `Última marcação: ${ultimoRegistro.tipo === "Saida" ? "saída" : "entrada"} às ${formatarHorario(ultimoRegistro.data_hora)}`
            : "Nenhuma marcacao registrada hoje";

        botaoPonto.addEventListener("click", async () => {
            botaoPonto.disabled = true;
            try {
                await chamarApi("/api/registros", { method: "POST" });
                await carregarPonto();
            } catch (error) {
                alert(error.message);
            } finally {
                botaoPonto.disabled = false;
            }
        }, { once: true });
    } catch (error) {
        if (error.message.includes("login") || error.message.includes("sessao")) {
            window.location.href = "login.html";
            return;
        }
        alert(error.message);
    }
}

// Busca os dados do usuario autenticado e preenche a pagina de conta.
async function carregarConta() {
    if (!document.getElementById("info-nome")) return;

    try {
        const usuario = await chamarApi("/api/auth/me");
        document.getElementById("perfil-nome").textContent = usuario.nome;
        document.getElementById("info-nome").textContent = usuario.nome;
        document.getElementById("info-email").textContent = usuario.email;
        document.getElementById("info-telefone").textContent = usuario.telefone || "Nao informado";
        document.getElementById("info-cpf").textContent = usuario.cpf;
    } catch (error) {
        if (error.message.includes("login") || error.message.includes("sessao")) {
            window.location.href = "login.html";
            return;
        }
        alert(error.message);
    }
}

// Encerra a sessao no servidor antes de voltar para o login.
function iniciarLogout() {
    const botaoSair = document.getElementById("botao-sair-conta");
    if (!botaoSair) return;

    botaoSair.addEventListener("click", async () => {
        try {
            await chamarApi("/api/auth/logout", { method: "POST" });
            window.location.href = "login.html";
        } catch (error) {
            alert(error.message);
        }
    });
}

// Inicializa somente os recursos presentes na pagina aberta.
document.addEventListener("DOMContentLoaded", () => {
    atualizarRelogio();
    window.setInterval(atualizarRelogio, 1000);
    iniciarCadastro();
    iniciarLogin();
    carregarPonto();
    carregarConta();
    iniciarLogout();
});