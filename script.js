// 1. SUA URL DA API DO GOOGLE APPS SCRIPT
const URL_API = "https://script.google.com/macros/s/AKfycbxo0HmHlzJklmZ8jM987fSb9ijS6XtaH-otVAZaaGfQbm22Tdgtx7moFdoYDRF5e9E4/exec";

// --- CONTROLE DE NAVEGAÇÃO DA TELA DE LOGIN ---
const boxes = {
    login: document.getElementById('box-login'),
    cad: document.getElementById('box-cadastro'),
    senha: document.getElementById('box-senha'),
    voltar: document.getElementById('link-voltar'),
    cadastrar: document.getElementById('link-cadastrar'),
    alterar: document.getElementById('link-alterar')
};

const statusGeral = document.getElementById('statusLogin');

function exibirBox(alvo) {
    statusGeral.style.display = 'none'; // Limpa mensagens de erro ao trocar
    boxes.login.style.display = alvo === 'login' ? 'block' : 'none';
    boxes.cad.style.display = alvo === 'cad' ? 'block' : 'none';
    boxes.senha.style.display = alvo === 'senha' ? 'block' : 'none';
    
    boxes.voltar.style.display = alvo === 'login' ? 'none' : 'block';
    boxes.cadastrar.style.display = alvo === 'login' ? 'block' : 'none';
    boxes.alterar.style.display = alvo === 'login' ? 'block' : 'none';
}

document.getElementById('link-cadastrar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('cad'); });
document.getElementById('link-alterar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('senha'); });
document.getElementById('link-voltar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('login'); });

// --- FUNÇÃO DO BOTÃO DE OLHO ---
window.toggleSenha = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') { input.type = 'text'; btn.innerText = '🙈'; } 
    else { input.type = 'password'; btn.innerText = '👁️'; }
};

// --- VALIDAÇÃO DE SENHAS (CADASTRO) ---
const cadSenha = document.getElementById('cadSenha');
const cadSenhaConfirma = document.getElementById('cadSenhaConfirma');
const msgSenhaMatch = document.getElementById('msgSenhaMatch');
const btnSalvarCad = document.getElementById('btnSalvarCad');

function validarSenhas() {
    const s1 = cadSenha.value; const s2 = cadSenhaConfirma.value;
    if (s1 === '' || s2 === '') {
        msgSenhaMatch.innerText = '';
        cadSenha.classList.remove('senha-valida', 'senha-invalida'); cadSenhaConfirma.classList.remove('senha-valida', 'senha-invalida');
        btnSalvarCad.disabled = true; return;
    }
    if (s1 === s2) {
        msgSenhaMatch.innerText = '✅ Senhas iguais!'; msgSenhaMatch.style.color = 'var(--cor-sucesso)';
        cadSenha.classList.replace('senha-invalida', 'senha-valida') || cadSenha.classList.add('senha-valida');
        cadSenhaConfirma.classList.replace('senha-invalida', 'senha-valida') || cadSenhaConfirma.classList.add('senha-valida');
        btnSalvarCad.disabled = false;
    } else {
        msgSenhaMatch.innerText = '❌ As senhas não coincidem!'; msgSenhaMatch.style.color = 'var(--cor-alerta)';
        cadSenha.classList.replace('senha-valida', 'senha-invalida') || cadSenha.classList.add('senha-invalida');
        cadSenhaConfirma.classList.replace('senha-valida', 'senha-invalida') || cadSenhaConfirma.classList.add('senha-invalida');
        btnSalvarCad.disabled = true;
    }
}
cadSenha.addEventListener('input', validarSenhas); cadSenhaConfirma.addEventListener('input', validarSenhas);

// --- VALIDAÇÃO DE SENHAS (TROCA) ---
const novaSenha = document.getElementById('novaSenha');
const novaSenhaConfirma = document.getElementById('novaSenhaConfirma');
const msgTrocaSenhaMatch = document.getElementById('msgTrocaSenhaMatch');
const btnSalvarSenha = document.getElementById('btnSalvarSenha');

function validarTrocaSenhas() {
    const s1 = novaSenha.value; const s2 = novaSenhaConfirma.value;
    if (s1 === '' || s2 === '') {
        msgTrocaSenhaMatch.innerText = '';
        novaSenha.classList.remove('senha-valida', 'senha-invalida'); novaSenhaConfirma.classList.remove('senha-valida', 'senha-invalida');
        btnSalvarSenha.disabled = true; return;
    }
    if (s1 === s2) {
        msgTrocaSenhaMatch.innerText = '✅ Senhas iguais!'; msgTrocaSenhaMatch.style.color = 'var(--cor-sucesso)';
        novaSenha.classList.replace('senha-invalida', 'senha-valida') || novaSenha.classList.add('senha-valida');
        novaSenhaConfirma.classList.replace('senha-invalida', 'senha-valida') || novaSenhaConfirma.classList.add('senha-valida');
        btnSalvarSenha.disabled = false;
    } else {
        msgTrocaSenhaMatch.innerText = '❌ As senhas não coincidem!'; msgTrocaSenhaMatch.style.color = 'var(--cor-alerta)';
        novaSenha.classList.replace('senha-valida', 'senha-invalida') || novaSenha.classList.add('senha-invalida');
        novaSenhaConfirma.classList.replace('senha-valida', 'senha-invalida') || novaSenhaConfirma.classList.add('senha-invalida');
        btnSalvarSenha.disabled = true;
    }
}
novaSenha.addEventListener('input', validarTrocaSenhas); novaSenhaConfirma.addEventListener('input', validarTrocaSenhas);


// ==========================================================
// REQUISIÇÕES AO BANCO DE DADOS (GOOGLE SHEETS)
// ==========================================================
const telaLogin = document.getElementById('tela-login');
const appContainer = document.getElementById('app-container');
const nomeUsuarioLogado = document.getElementById('nomeUsuarioLogado');
const textoBoasVindas = document.getElementById('textoBoasVindas');

// 1. FAZER LOGIN
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnEntrar');
    btn.disabled = true; statusGeral.style.display = 'block'; statusGeral.style.color = "#FFD700"; statusGeral.innerText = "⏳ Conectando...";

    try {
        const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "login", usuario: document.getElementById('loginUser').value.trim(), senha: document.getElementById('loginSenha').value }) });
        const resultado = await response.json();
        if (resultado.status === "sucesso") {
            statusGeral.style.color = "#00C853"; statusGeral.innerText = "✅ Acesso Liberado!";
            setTimeout(() => {
                telaLogin.style.display = 'none'; appContainer.style.display = 'flex';
                nomeUsuarioLogado.innerText = resultado.nomeCompleto;
                textoBoasVindas.innerText = `Olá, ${resultado.nomeCompleto.split(" ")[0]}! Aqui está o resumo do mês.`;
                document.getElementById('formLogin').reset(); statusGeral.style.display = 'none';
            }, 1000);
        } else { statusGeral.style.color = "#FF3D00"; statusGeral.innerText = "❌ " + resultado.mensagem; }
    } catch (err) { statusGeral.style.color = "#FF3D00"; statusGeral.innerText = "❌ Erro de conexão."; } 
    finally { btn.disabled = false; }
});

// 2. CADASTRAR USUÁRIO
document.getElementById('formCadastro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarCad');
    btn.disabled = true; statusGeral.style.display = 'block'; statusGeral.style.color = "#FFD700"; statusGeral.innerText = "⏳ Criando conta...";

    try {
        const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "cadastrar", nome: document.getElementById('cadNome').value, usuario: document.getElementById('cadUser').value, senha: cadSenha.value }) });
        const resultado = await response.json();
        if (resultado.status === "sucesso") {
            statusGeral.style.color = "var(--cor-sucesso)"; statusGeral.innerText = "✅ Usuário criado!";
            setTimeout(() => { document.getElementById('formCadastro').reset(); validarSenhas(); exibirBox('login'); }, 2000);
        } else { statusGeral.style.color = "var(--cor-alerta)"; statusGeral.innerText = "❌ " + resultado.mensagem; btn.disabled = false; }
    } catch (err) { statusGeral.style.color = "var(--cor-alerta)"; statusGeral.innerText = "❌ Erro de conexão."; btn.disabled = false; }
});

// 3. ALTERAR SENHA
document.getElementById('formTrocaSenha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarSenha');
    btn.disabled = true; statusGeral.style.display = 'block'; statusGeral.style.color = "#FFD700"; statusGeral.innerText = "⏳ Atualizando senha...";

    try {
        const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "alterar_senha", usuario: document.getElementById('trocaUser').value, novaSenha: novaSenha.value }) });
        const resultado = await response.json();
        if (resultado.status === "sucesso") {
            statusGeral.style.color = "var(--cor-sucesso)"; statusGeral.innerText = "✅ Senha alterada com sucesso!";
            setTimeout(() => { document.getElementById('formTrocaSenha').reset(); validarTrocaSenhas(); exibirBox('login'); }, 2000);
        } else { statusGeral.style.color = "var(--cor-alerta)"; statusGeral.innerText = "❌ " + resultado.mensagem; btn.disabled = false; }
    } catch (err) { statusGeral.style.color = "var(--cor-alerta)"; statusGeral.innerText = "❌ Erro de conexão."; btn.disabled = false; }
});

// ==========================================================
// APP PRINCIPAL (NAVEGAÇÃO E ENVIOS)
// ==========================================================
document.getElementById('btnSair').addEventListener('click', (e) => {
    e.preventDefault(); appContainer.style.display = 'none'; telaLogin.style.display = 'flex';
});

const btnToggleMenu = document.getElementById('btnToggleMenu');
const sidebar = document.querySelector('.sidebar');
btnToggleMenu.addEventListener('click', () => { sidebar.classList.toggle('recolhida'); });

const menusApp = { dashboard: document.getElementById('menu-dashboard'), venda: document.getElementById('menu-venda'), despesa: document.getElementById('menu-despesa') };
const telasApp = { dashboard: document.getElementById('tela-dashboard'), venda: document.getElementById('tela-venda'), despesa: document.getElementById('tela-despesa') };

function trocarTelaApp(telaAtivaId) {
    Object.values(telasApp).forEach(t => t.style.display = 'none');
    Object.values(menusApp).forEach(m => m.parentElement.classList.remove('active'));
    telasApp[telaAtivaId].style.display = 'block'; menusApp[telaAtivaId].parentElement.classList.add('active');
    textoBoasVindas.style.display = (telaAtivaId === 'dashboard') ? 'block' : 'none';
}
menusApp.dashboard.addEventListener('click', (e) => { e.preventDefault(); trocarTelaApp('dashboard'); });
menusApp.venda.addEventListener('click', (e) => { e.preventDefault(); trocarTelaApp('venda'); });
menusApp.despesa.addEventListener('click', (e) => { e.preventDefault(); trocarTelaApp('despesa'); });

document.getElementById('btnCancelarVenda').addEventListener('click', () => { document.getElementById('formVenda').reset(); });

// ENVIO DE VENDAS
document.getElementById('formVenda').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = document.getElementById('btnEnviarVenda'); const msg = document.getElementById('mensagemVenda');
    btn.disabled = true; msg.style.color = "var(--texto-claro)"; msg.innerText = "Enviando venda...";
    const dados = [ document.getElementById('data').value, document.getElementById('cliente').value, document.getElementById('categoriaProduto').value, document.getElementById('formaPagamento').value, document.getElementById('custo').value || "0", document.getElementById('valor').value ];
    try {
        const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ planilha: "vendas", dados: dados }) });
        const resultado = await response.json();
        if (resultado.status === "sucesso") { msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Venda salva com sucesso!"; document.getElementById('formVenda').reset(); } 
        else throw new Error(resultado.mensagem);
    } catch (err) { msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro ao salvar: " + err.message; } 
    finally { btn.disabled = false; setTimeout(() => msg.innerText = "", 4000); }
});

// ENVIO DE DESPESAS
document.getElementById('formDespesa').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = document.getElementById('btnEnviarDespesa'); const msg = document.getElementById('mensagemDespesa');
    btn.disabled = true; msg.style.color = "var(--texto-claro)"; msg.innerText = "Enviando despesa...";
    const dados = [ document.getElementById('dataDespesa').value, document.getElementById('categoriaDespesa').value, document.getElementById('valorDespesa').value, document.getElementById('statusDespesa').value ];
    try {
        const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ planilha: "despesas", dados: dados }) });
        const resultado = await response.json();
        if (resultado.status === "sucesso") { msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Despesa salva com sucesso!"; document.getElementById('formDespesa').reset(); } 
        else throw new Error(resultado.mensagem);
    } catch (err) { msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro ao salvar: " + err.message; } 
    finally { btn.disabled = false; setTimeout(() => msg.innerText = "", 4000); }
});
