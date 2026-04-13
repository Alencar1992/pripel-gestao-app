// 1. SUA URL DA API DO GOOGLE APPS SCRIPT
const URL_API = "https://script.google.com/macros/s/AKfycbxo0HmHlzJklmZ8jM987fSb9ijS6XtaH-otVAZaaGfQbm22Tdgtx7moFdoYDRF5e9E4/exec";
// Alternar entre Login, Cadastro e Senha
const boxes = {
    login: document.getElementById('box-login'),
    cad: document.getElementById('box-cadastro'),
    senha: document.getElementById('box-senha'),
    voltar: document.getElementById('link-voltar'),
    links: document.querySelector('.login-links')
};

document.getElementById('link-cadastrar').addEventListener('click', (e) => {
    e.preventDefault();
    exibirBox('cad');
});

document.getElementById('link-alterar').addEventListener('click', (e) => {
    e.preventDefault();
    exibirBox('senha');
});

document.getElementById('link-voltar').addEventListener('click', (e) => {
    e.preventDefault();
    exibirBox('login');
});

function exibirBox(alvo) {
    boxes.login.style.display = alvo === 'login' ? 'block' : 'none';
    boxes.cad.style.display = alvo === 'cad' ? 'block' : 'none';
    boxes.senha.style.display = alvo === 'senha' ? 'block' : 'none';
    boxes.voltar.style.display = alvo === 'login' ? 'none' : 'block';
    
    // Esconde os links de cadastro/alterar quando não estiver no login
    document.getElementById('link-cadastrar').style.display = alvo === 'login' ? 'block' : 'none';
    document.getElementById('link-alterar').style.display = alvo === 'login' ? 'block' : 'none';
}
// --- ELEMENTOS GERAIS ---
const telaLogin = document.getElementById('tela-login');
const appContainer = document.getElementById('app-container');
const nomeUsuarioLogado = document.getElementById('nomeUsuarioLogado');
const textoBoasVindas = document.getElementById('textoBoasVindas');

// --- LÓGICA DE LOGIN ---
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userDigitado = document.getElementById('loginUser').value.trim();
    const senhaDigitada = document.getElementById('loginSenha').value;
    const statusLogin = document.getElementById('statusLogin');
    const btnEntrar = document.getElementById('btnEntrar');

    btnEntrar.disabled = true;
    statusLogin.style.display = 'block';
    statusLogin.style.color = "#FFD700";
    statusLogin.innerText = "⏳ Conectando ao banco de dados...";

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({
                acao: "login",
                usuario: userDigitado,
                senha: senhaDigitada
            })
        });

        const resultado = await response.json();

        if (resultado.status === "sucesso") {
            statusLogin.style.color = "#00C853";
            statusLogin.innerText = "✅ Acesso Liberado!";
            
            setTimeout(() => {
                telaLogin.style.display = 'none';
                appContainer.style.display = 'flex';
                nomeUsuarioLogado.innerText = resultado.nomeCompleto;
                
                const primeiroNome = resultado.nomeCompleto.split(" ")[0];
                textoBoasVindas.innerText = `Olá, ${primeiroNome}! Aqui está o resumo do mês.`;
                document.getElementById('formLogin').reset();
                statusLogin.style.display = 'none';
            }, 1000);

        } else {
            statusLogin.style.color = "#FF3D00";
            statusLogin.innerText = "❌ " + resultado.mensagem;
        }
    } catch (error) {
        statusLogin.style.color = "#FF3D00";
        statusLogin.innerText = "❌ Erro de conexão. Verifique a URL ou o Apps Script.";
    } finally {
        btnEntrar.disabled = false;
    }
});

// Botão Sair
document.getElementById('btnSair').addEventListener('click', (e) => {
    e.preventDefault();
    appContainer.style.display = 'none';
    telaLogin.style.display = 'flex';
    document.getElementById('statusLogin').style.display = 'none';
});

// --- LÓGICA DO MENU RECOLHÍVEL ---
const btnToggleMenu = document.getElementById('btnToggleMenu');
const sidebar = document.querySelector('.sidebar');

btnToggleMenu.addEventListener('click', () => {
    sidebar.classList.toggle('recolhida');
});

// --- LÓGICA DE NAVEGAÇÃO DO MENU ---
const menus = {
    dashboard: document.getElementById('menu-dashboard'),
    venda: document.getElementById('menu-venda'),
    despesa: document.getElementById('menu-despesa')
};
const telas = {
    dashboard: document.getElementById('tela-dashboard'),
    venda: document.getElementById('tela-venda'),
    despesa: document.getElementById('tela-despesa')
};

function trocarTela(telaAtivaId) {
    Object.values(telas).forEach(t => t.style.display = 'none');
    Object.values(menus).forEach(m => m.parentElement.classList.remove('active'));
    
    telas[telaAtivaId].style.display = 'block';
    menus[telaAtivaId].parentElement.classList.add('active');

    textoBoasVindas.style.display = (telaAtivaId === 'dashboard') ? 'block' : 'none';
}

menus.dashboard.addEventListener('click', (e) => { e.preventDefault(); trocarTela('dashboard'); });
menus.venda.addEventListener('click', (e) => { e.preventDefault(); trocarTela('venda'); });
menus.despesa.addEventListener('click', (e) => { e.preventDefault(); trocarTela('despesa'); });

// --- LÓGICA DE ENVIO DE VENDAS ---
document.getElementById('formVenda').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnEnviarVenda');
    const msg = document.getElementById('mensagemVenda');
    btn.disabled = true; msg.style.color = "var(--texto-claro)"; msg.innerText = "Enviando venda...";

    // Pegando os dados na nova ordem exata dos campos da tela e planilha
    const dados = [
        document.getElementById('data').value,
        document.getElementById('cliente').value,
        document.getElementById('categoriaProduto').value,
        document.getElementById('formaPagamento').value,
        document.getElementById('custo').value || "0", // Se deixar em branco, envia zero
        document.getElementById('valor').value
    ];

    try {
        const response = await fetch(URL_API, {
            method: 'POST', body: JSON.stringify({ planilha: "vendas", dados: dados })
        });
        const resultado = await response.json();
        if (resultado.status === "sucesso") {
            msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Venda registrada com sucesso!";
            document.getElementById('formVenda').reset();
        } else throw new Error(resultado.mensagem);
    } catch (error) {
        msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro ao salvar: " + error.message;
    } finally {
        btn.disabled = false; setTimeout(() => msg.innerText = "", 4000);
    }
});

// Ação do Botão Cancelar (limpa o formulário)
document.getElementById('btnCancelarVenda').addEventListener('click', () => {
    document.getElementById('formVenda').reset();
});

// --- LÓGICA DE ENVIO DE DESPESAS ---
document.getElementById('formDespesa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnEnviarDespesa');
    const msg = document.getElementById('mensagemDespesa');
    btn.disabled = true; msg.style.color = "var(--texto-claro)"; msg.innerText = "Enviando despesa...";

    const dados = [
        document.getElementById('dataDespesa').value,
        document.getElementById('categoriaDespesa').value,
        document.getElementById('valorDespesa').value,
        document.getElementById('statusDespesa').value
    ];

    try {
        const response = await fetch(URL_API, {
            method: 'POST', body: JSON.stringify({ planilha: "despesas", dados: dados })
        });
        const resultado = await response.json();
        if (resultado.status === "sucesso") {
            msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Despesa registrada com sucesso!";
            document.getElementById('formDespesa').reset();
        } else throw new Error(resultado.mensagem);
    } catch (error) {
        msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro ao salvar: " + error.message;
    } finally {
        btn.disabled = false; setTimeout(() => msg.innerText = "", 4000);
    }
});

// --- FUNÇÃO DO BOTÃO DE OLHO (MOSTRAR/OCULTAR SENHA) ---
window.toggleSenha = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerText = '🙈'; // Muda o ícone
    } else {
        input.type = 'password';
        btn.innerText = '👁️'; // Volta o ícone
    }
};

// --- VALIDAÇÃO DE SENHAS IGUAIS ---
const cadSenha = document.getElementById('cadSenha');
const cadSenhaConfirma = document.getElementById('cadSenhaConfirma');
const msgSenhaMatch = document.getElementById('msgSenhaMatch');
const btnSalvarCad = document.getElementById('btnSalvarCad');

function validarSenhas() {
    const s1 = cadSenha.value;
    const s2 = cadSenhaConfirma.value;

    // Se estiverem vazios, não faz nada
    if (s1 === '' || s2 === '') {
        msgSenhaMatch.innerText = '';
        cadSenha.classList.remove('senha-valida', 'senha-invalida');
        cadSenhaConfirma.classList.remove('senha-valida', 'senha-invalida');
        btnSalvarCad.disabled = true; // Trava o botão
        return;
    }

    if (s1 === s2) {
        msgSenhaMatch.innerText = '✅ Senhas iguais!';
        msgSenhaMatch.style.color = 'var(--cor-sucesso)';
        cadSenha.classList.add('senha-valida');
        cadSenha.classList.remove('senha-invalida');
        cadSenhaConfirma.classList.add('senha-valida');
        cadSenhaConfirma.classList.remove('senha-invalida');
        btnSalvarCad.disabled = false; // LIBERA O BOTÃO
    } else {
        msgSenhaMatch.innerText = '❌ As senhas não coincidem!';
        msgSenhaMatch.style.color = 'var(--cor-alerta)';
        cadSenha.classList.add('senha-invalida');
        cadSenha.classList.remove('senha-valida');
        cadSenhaConfirma.classList.add('senha-invalida');
        cadSenhaConfirma.classList.remove('senha-valida');
        btnSalvarCad.disabled = true; // TRAVA O BOTÃO
    }
}

// Ouve cada letra que o usuário digita para validar na hora
cadSenha.addEventListener('input', validarSenhas);
cadSenhaConfirma.addEventListener('input', validarSenhas);


// --- LÓGICA DE ENVIO: CADASTRAR NOVO USUÁRIO ---
document.getElementById('formCadastro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarCad');
    const statusBox = document.getElementById('statusCad');
    
    btn.disabled = true;
    statusBox.style.display = 'block';
    statusBox.style.color = "#FFD700";
    statusBox.innerText = "⏳ Criando conta no banco de dados...";

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({
                acao: "cadastrar",
                nome: document.getElementById('cadNome').value,
                usuario: document.getElementById('cadUser').value,
                senha: cadSenha.value // Envia a senha validada
            })
        });

        const resultado = await response.json();

        if (resultado.status === "sucesso") {
            statusBox.style.color = "var(--cor-sucesso)";
            statusBox.innerText = "✅ Usuário criado com sucesso!";
            
            // Espera 2 segundos, limpa tudo e volta para a tela de login
            setTimeout(() => {
                document.getElementById('formCadastro').reset();
                validarSenhas(); // Reseta as bordas
                statusBox.style.display = 'none';
                document.getElementById('link-voltar').click();
            }, 2000);
        } else {
            statusBox.style.color = "var(--cor-alerta)";
            statusBox.innerText = "❌ " + resultado.mensagem;
            btn.disabled = false;
        }
    } catch (error) {
        statusBox.style.color = "var(--cor-alerta)";
        statusBox.innerText = "❌ Erro de conexão com o banco.";
        btn.disabled = false;
    }
});

// --- LÓGICA DE ENVIO: ALTERAR SENHA ---
document.getElementById('formTrocaSenha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarSenha');
    const statusBox = document.getElementById('statusSenha');
    
    btn.disabled = true;
    statusBox.style.display = 'block';
    statusBox.style.color = "#FFD700";
    statusBox.innerText = "⏳ Atualizando senha...";

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({
                acao: "alterar_senha",
                usuario: document.getElementById('trocaUser').value,
                novaSenha: document.getElementById('novaSenha').value
            })
        });

        const resultado = await response.json();

        if (resultado.status === "sucesso") {
            statusBox.style.color = "var(--cor-sucesso)";
            statusBox.innerText = "✅ Senha alterada com sucesso!";
            setTimeout(() => {
                document.getElementById('formTrocaSenha').reset();
                statusBox.style.display = 'none';
                document.getElementById('link-voltar').click();
            }, 2000);
        } else {
            statusBox.style.color = "var(--cor-alerta)";
            statusBox.innerText = "❌ " + resultado.mensagem;
            btn.disabled = false;
        }
    } catch (error) {
        statusBox.style.color = "var(--cor-alerta)";
        statusBox.innerText = "❌ Erro de conexão com o banco.";
        btn.disabled = false;
    }
});
