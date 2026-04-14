const URL_API = "https://script.google.com/macros/s/AKfycbxo0HmHlzJklmZ8jM987fSb9ijS6XtaH-otVAZaaGfQbm22Tdgtx7moFdoYDRF5e9E4/exec";

// =======================================================
// 1. VERIFICAÇÃO DE LOGIN AUTOMÁTICO (PERSISTÊNCIA)
// =======================================================
const telaLogin = document.getElementById('tela-login');
const appContainer = document.getElementById('app-container');
const nomeUsuarioLogado = document.getElementById('nomeUsuarioLogado');
const textoBoasVindas = document.getElementById('textoBoasVindas');

document.addEventListener('DOMContentLoaded', () => {
    const usuarioSalvo = localStorage.getItem('priPelUser');
    if (usuarioSalvo) {
        const dadosUser = JSON.parse(usuarioSalvo);
        telaLogin.style.display = 'none';
        appContainer.style.display = 'flex';
        nomeUsuarioLogado.innerText = dadosUser.nome;
        textoBoasVindas.innerText = `Olá, ${dadosUser.nome.split(" ")[0]}! Aqui está o resumo do mês.`;
    }
});

// =======================================================
// 2. ÁREA DE LOGIN (NAVEGAÇÃO E VALIDAÇÃO)
// =======================================================
const boxesLogin = { login: document.getElementById('box-login'), cad: document.getElementById('box-cadastro'), senha: document.getElementById('box-senha'), voltar: document.getElementById('link-voltar'), cadastrar: document.getElementById('link-cadastrar'), alterar: document.getElementById('link-alterar'), statusBox: document.getElementById('statusLogin') };
function exibirBox(alvo) { boxesLogin.statusBox.style.display = 'none'; boxesLogin.login.style.display = alvo === 'login' ? 'block' : 'none'; boxesLogin.cad.style.display = alvo === 'cad' ? 'block' : 'none'; boxesLogin.senha.style.display = alvo === 'senha' ? 'block' : 'none'; boxesLogin.voltar.style.display = alvo === 'login' ? 'none' : 'block'; boxesLogin.cadastrar.style.display = alvo === 'login' ? 'block' : 'none'; boxesLogin.alterar.style.display = alvo === 'login' ? 'block' : 'none'; }
document.getElementById('link-cadastrar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('cad'); });
document.getElementById('link-alterar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('senha'); });
document.getElementById('link-voltar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('login'); });

window.toggleSenha = function(inputId, btn) { const input = document.getElementById(inputId); if (input.type === 'password') { input.type = 'text'; btn.innerText = '🙈'; } else { input.type = 'password'; btn.innerText = '👁️'; } };

const cadSenha = document.getElementById('cadSenha'); const cadSenhaConfirma = document.getElementById('cadSenhaConfirma'); const msgSenhaMatch = document.getElementById('msgSenhaMatch'); const btnSalvarCad = document.getElementById('btnSalvarCad');
function validarSenhas() { const s1 = cadSenha.value; const s2 = cadSenhaConfirma.value; if (s1 === '' || s2 === '') { msgSenhaMatch.innerText = ''; btnSalvarCad.disabled = true; return; } if (s1 === s2) { msgSenhaMatch.innerText = '✅ Senhas iguais!'; msgSenhaMatch.style.color = 'var(--cor-sucesso)'; btnSalvarCad.disabled = false; } else { msgSenhaMatch.innerText = '❌ As senhas não coincidem!'; msgSenhaMatch.style.color = 'var(--cor-alerta)'; btnSalvarCad.disabled = true; } }
cadSenha.addEventListener('input', validarSenhas); cadSenhaConfirma.addEventListener('input', validarSenhas);

const novaSenha = document.getElementById('novaSenha'); const novaSenhaConfirma = document.getElementById('novaSenhaConfirma'); const msgTrocaSenhaMatch = document.getElementById('msgTrocaSenhaMatch'); const btnSalvarSenha = document.getElementById('btnSalvarSenha');
function validarTrocaSenhas() { const s1 = novaSenha.value; const s2 = novaSenhaConfirma.value; if (s1 === '' || s2 === '') { msgTrocaSenhaMatch.innerText = ''; btnSalvarSenha.disabled = true; return; } if (s1 === s2) { msgTrocaSenhaMatch.innerText = '✅ Senhas iguais!'; msgTrocaSenhaMatch.style.color = 'var(--cor-sucesso)'; btnSalvarSenha.disabled = false; } else { msgTrocaSenhaMatch.innerText = '❌ As senhas não coincidem!'; msgTrocaSenhaMatch.style.color = 'var(--cor-alerta)'; btnSalvarSenha.disabled = true; } }
novaSenha.addEventListener('input', validarTrocaSenhas); novaSenhaConfirma.addEventListener('input', validarTrocaSenhas);

// ==========================================================
// 3. REQUISIÇÕES AO BANCO DE DADOS (GOOGLE SHEETS)
// ==========================================================
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = document.getElementById('btnEntrar'); btn.disabled = true; boxesLogin.statusBox.style.display = 'block'; boxesLogin.statusBox.style.color = "#FFD700"; boxesLogin.statusBox.innerText = "⏳ Conectando...";
    try {
        const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "login", usuario: document.getElementById('loginUser').value.trim(), senha: document.getElementById('loginSenha').value }) });
        const resultado = await response.json();
        if (resultado.status === "sucesso") {
            boxesLogin.statusBox.style.color = "#00C853"; boxesLogin.statusBox.innerText = "✅ Acesso Liberado!";
            
            // SALVA NA MEMÓRIA DO NAVEGADOR
            localStorage.setItem('priPelUser', JSON.stringify({ nome: resultado.nomeCompleto }));

            setTimeout(() => {
                telaLogin.style.display = 'none'; appContainer.style.display = 'flex';
                nomeUsuarioLogado.innerText = resultado.nomeCompleto;
                textoBoasVindas.innerText = `Olá, ${resultado.nomeCompleto.split(" ")[0]}! Aqui está o resumo do mês.`;
                document.getElementById('formLogin').reset(); boxesLogin.statusBox.style.display = 'none';
            }, 1000);
        } else { boxesLogin.statusBox.style.color = "#FF3D00"; boxesLogin.statusBox.innerText = "❌ " + resultado.mensagem; }
    } catch (err) { boxesLogin.statusBox.style.color = "#FF3D00"; boxesLogin.statusBox.innerText = "❌ Erro de conexão."; } finally { btn.disabled = false; }
});

document.getElementById('formCadastro').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = document.getElementById('btnSalvarCad'); btn.disabled = true; boxesLogin.statusBox.style.display = 'block'; boxesLogin.statusBox.style.color = "#FFD700"; boxesLogin.statusBox.innerText = "⏳ Criando conta...";
    try { const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "cadastrar", nome: document.getElementById('cadNome').value, usuario: document.getElementById('cadUser').value, senha: cadSenha.value }) }); const resultado = await response.json();
        if (resultado.status === "sucesso") { boxesLogin.statusBox.style.color = "var(--cor-sucesso)"; boxesLogin.statusBox.innerText = "✅ Usuário criado!"; setTimeout(() => { document.getElementById('formCadastro').reset(); validarSenhas(); exibirBox('login'); }, 2000); } else { boxesLogin.statusBox.style.color = "var(--cor-alerta)"; boxesLogin.statusBox.innerText = "❌ " + resultado.mensagem; btn.disabled = false; }
    } catch (err) { boxesLogin.statusBox.style.color = "var(--cor-alerta)"; boxesLogin.statusBox.innerText = "❌ Erro de conexão."; btn.disabled = false; }
});

document.getElementById('formTrocaSenha').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = document.getElementById('btnSalvarSenha'); btn.disabled = true; boxesLogin.statusBox.style.display = 'block'; boxesLogin.statusBox.style.color = "#FFD700"; boxesLogin.statusBox.innerText = "⏳ Atualizando senha...";
    try { const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "alterar_senha", usuario: document.getElementById('trocaUser').value, novaSenha: novaSenha.value }) }); const resultado = await response.json();
        if (resultado.status === "sucesso") { boxesLogin.statusBox.style.color = "var(--cor-sucesso)"; boxesLogin.statusBox.innerText = "✅ Senha alterada com sucesso!"; setTimeout(() => { document.getElementById('formTrocaSenha').reset(); validarTrocaSenhas(); exibirBox('login'); }, 2000); } else { boxesLogin.statusBox.style.color = "var(--cor-alerta)"; boxesLogin.statusBox.innerText = "❌ " + resultado.mensagem; btn.disabled = false; }
    } catch (err) { boxesLogin.statusBox.style.color = "var(--cor-alerta)"; boxesLogin.statusBox.innerText = "❌ Erro de conexão."; btn.disabled = false; }
});

// ==========================================================
// 4. APP PRINCIPAL (SUB-MENUS E NAVEGAÇÃO)
// ==========================================================

// Lógica para Deslogar
document.getElementById('btnSair').addEventListener('click', (e) => {
    e.preventDefault(); 
    localStorage.removeItem('priPelUser'); // Limpa a memória
    appContainer.style.display = 'none'; 
    telaLogin.style.display = 'flex';
});

// Menu Lateral Recolher
document.getElementById('btnToggleMenu').addEventListener('click', () => { document.querySelector('.sidebar').classList.toggle('recolhida'); });

// Lógica de Abrir/Fechar as Pastas (Sub-menus)
const menuToggles = document.querySelectorAll('.menu-toggle');
menuToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const submenu = toggle.nextElementSibling;
        const seta = toggle.querySelector('.seta');
        if (submenu.style.display === 'block') {
            submenu.style.display = 'none'; seta.classList.remove('aberta');
        } else {
            submenu.style.display = 'block'; seta.classList.add('aberta');
        }
    });
});

// Mapeamento das Telas
const menusApp = { 
    dashboard: document.getElementById('menu-dashboard'), venda: document.getElementById('menu-venda'), despesa: document.getElementById('menu-despesa'),
    precificacao: document.getElementById('menu-precificacao'), resumo: document.getElementById('menu-resumo'), fluxo: document.getElementById('menu-fluxo'), cronograma: document.getElementById('menu-cronograma'),
    parametros: document.getElementById('menu-parametros'), custos: document.getElementById('menu-custos')
};
const telasApp = { 
    dashboard: document.getElementById('tela-dashboard'), venda: document.getElementById('tela-venda'), despesa: document.getElementById('tela-despesa'),
    precificacao: document.getElementById('tela-precificacao'), resumo: document.getElementById('tela-resumo'), fluxo: document.getElementById('tela-fluxo'), cronograma: document.getElementById('tela-cronograma'),
    parametros: document.getElementById('tela-parametros'), custos: document.getElementById('tela-custos')
};

function trocarTelaApp(telaAtivaId) {
    Object.values(telasApp).forEach(t => t.style.display = 'none');
    document.querySelectorAll('.sidebar nav ul li').forEach(li => li.classList.remove('active')); // Limpa seleções
    
    if (telasApp[telaAtivaId]) telasApp[telaAtivaId].style.display = 'block';
    if (menusApp[telaAtivaId]) menusApp[telaAtivaId].parentElement.classList.add('active'); // Pinta botão selecionado
    
    textoBoasVindas.style.display = (telaAtivaId === 'dashboard') ? 'block' : 'none';
}

Object.keys(menusApp).forEach(key => {
    if (menusApp[key]) { menusApp[key].addEventListener('click', (e) => { e.preventDefault(); trocarTelaApp(key); }); }
});

document.getElementById('btnCancelarVenda').addEventListener('click', () => { document.getElementById('formVenda').reset(); });

// Envio de Vendas e Despesas (MANTIDO)
document.getElementById('formVenda').addEventListener('submit', async (e) => { e.preventDefault(); const btn = document.getElementById('btnEnviarVenda'); const msg = document.getElementById('mensagemVenda'); btn.disabled = true; msg.style.color = "var(--texto-claro)"; msg.innerText = "Enviando..."; const dados = [ document.getElementById('data').value, document.getElementById('cliente').value, document.getElementById('categoriaProduto').value, document.getElementById('formaPagamento').value, document.getElementById('custo').value || "0", document.getElementById('valor').value ]; try { const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ planilha: "vendas", dados: dados }) }); const resultado = await res.json(); if (resultado.status === "sucesso") { msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Salvo com sucesso!"; document.getElementById('formVenda').reset(); } else throw new Error(resultado.mensagem); } catch (err) { msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro: " + err.message; } finally { btn.disabled = false; setTimeout(() => msg.innerText = "", 4000); } });
document.getElementById('formDespesa').addEventListener('submit', async (e) => { e.preventDefault(); const btn = document.getElementById('btnEnviarDespesa'); const msg = document.getElementById('mensagemDespesa'); btn.disabled = true; msg.style.color = "var(--texto-claro)"; msg.innerText = "Enviando..."; const dados = [ document.getElementById('dataDespesa').value, document.getElementById('categoriaDespesa').value, document.getElementById('valorDespesa').value, document.getElementById('statusDespesa').value ]; try { const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ planilha: "despesas", dados: dados }) }); const resultado = await res.json(); if (resultado.status === "sucesso") { msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Salvo com sucesso!"; document.getElementById('formDespesa').reset(); } else throw new Error(resultado.mensagem); } catch (err) { msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro: " + err.message; } finally { btn.disabled = false; setTimeout(() => msg.innerText = "", 4000); } });
