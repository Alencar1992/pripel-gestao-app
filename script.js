const URL_API = "https://script.google.com/macros/s/AKfycbxo0HmHlzJklmZ8jM987fSb9ijS6XtaH-otVAZaaGfQbm22Tdgtx7moFdoYDRF5e9E4/exec";

const telaLogin = document.getElementById('tela-login');
const appContainer = document.getElementById('app-container');
const nomeUsuarioLogado = document.getElementById('nomeUsuarioLogado');
const textoBoasVindas = document.getElementById('textoBoasVindas');

// Utilitário de formatação de Moeda
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

async function chamarApi(payload) {
    const response = await fetch(URL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    });

    const texto = await response.text();
    let resultado;
    try {
        resultado = JSON.parse(texto);
    } catch (_) {
        throw new Error('O servidor retornou uma resposta inválida. Verifique a implantação do backend.');
    }

    if (!response.ok || !resultado || typeof resultado !== 'object') {
        throw new Error((resultado && resultado.mensagem) || 'Não foi possível comunicar com o servidor.');
    }
    return resultado;
}

function adicionarCelula(linha, texto, className) {
    const celula = document.createElement('td');
    celula.textContent = texto;
    if (className) celula.className = className;
    linha.appendChild(celula);
    return celula;
}

// =======================================================
// 1. DASHBOARD E FLUXO DE CAIXA
// =======================================================
async function carregarDashboard() {
    document.querySelector('.valor.receita').innerText = "Carregando...";
    document.querySelector('.valor.despesa').innerText = "Carregando...";
    document.querySelector('.valor.saldo').innerText = "Carregando...";

    try {
        const resultado = await chamarApi({ acao: "resumo_dashboard" });

        if (resultado.status === "sucesso") {
            document.querySelector('.valor.receita').innerText = formatarMoeda(resultado.entradas);
            document.querySelector('.valor.despesa').innerText = formatarMoeda(resultado.saidas);
            
            const txtSaldo = document.querySelector('.valor.saldo');
            txtSaldo.innerText = formatarMoeda(resultado.saldo);
            txtSaldo.style.color = resultado.saldo < 0 ? "var(--cor-alerta)" : "var(--cor-destaque)";
        }
    } catch (error) {
        document.querySelector('.valor.saldo').innerText = "Erro ao carregar";
    }
}

async function carregarFluxoCaixa() {
    const tbody = document.getElementById('corpoTabelaFluxo');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">⏳ Buscando histórico no banco de dados...</td></tr>';
    
    try {
        const resultado = await chamarApi({ acao: "buscar_fluxo" });
        
        if (resultado.status === "sucesso") {
            tbody.innerHTML = ''; 
            
            if (resultado.dados.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--texto-mutado);">Nenhum lançamento encontrado ainda.</td></tr>';
                return;
            }
            
            resultado.dados.forEach(item => {
                const tr = document.createElement('tr');
                const isEntrada = item.tipo === "Entrada";
                
                const badgeClass = isEntrada ? "badge-entrada" : "badge-saida";
                const valorClass = isEntrada ? "valor-entrada" : "valor-saida";
                const sinal = isEntrada ? "+ " : "- ";
                
                const dataCell = adicionarCelula(tr, item.dataF || '');
                dataCell.style.color = 'var(--texto-mutado)';
                const descricaoCell = adicionarCelula(tr, item.descricao || '');
                descricaoCell.style.fontWeight = '500';
                const tipoCell = adicionarCelula(tr, '');
                const badge = document.createElement('span');
                badge.className = `badge-tipo ${badgeClass}`;
                badge.textContent = item.tipo || '';
                tipoCell.appendChild(badge);
                adicionarCelula(tr, `${sinal}${formatarMoeda(Number(item.valor) || 0)}`, valorClass);
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--cor-alerta); padding: 30px;">❌ Erro ao carregar extrato.</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--cor-alerta); padding: 30px;">❌ Erro de conexão. Tente novamente.</td></tr>';
    }
}

document.getElementById('btnAtualizarFluxo').addEventListener('click', carregarFluxoCaixa);

// =======================================================
// 2. VERIFICAÇÃO E NAVEGAÇÃO
// =======================================================
function obterUserLogado() {
    const usuarioSalvo = sessionStorage.getItem('priPelUser');
    return usuarioSalvo ? JSON.parse(usuarioSalvo).login : "Desconhecido";
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768) document.querySelector('.sidebar').classList.add('recolhida');
    const usuarioSalvo = sessionStorage.getItem('priPelUser');
    if (usuarioSalvo) {
        const dadosUser = JSON.parse(usuarioSalvo);
        telaLogin.style.display = 'none';
        appContainer.style.display = 'flex';
        nomeUsuarioLogado.innerText = dadosUser.nome;
        textoBoasVindas.innerText = `Olá, ${dadosUser.nome.split(" ")[0]}! Aqui está o resumo.`;
        carregarDashboard(); 
    }
});

const menusApp = { dashboard: document.getElementById('menu-dashboard'), venda: document.getElementById('menu-venda'), despesa: document.getElementById('menu-despesa'), precificacao: document.getElementById('menu-precificacao'), resumo: document.getElementById('menu-resumo'), fluxo: document.getElementById('menu-fluxo'), cronograma: document.getElementById('menu-cronograma'), parametros: document.getElementById('menu-parametros'), custos: document.getElementById('menu-custos') };
const telasApp = { dashboard: document.getElementById('tela-dashboard'), venda: document.getElementById('tela-venda'), despesa: document.getElementById('tela-despesa'), precificacao: document.getElementById('tela-precificacao'), resumo: document.getElementById('tela-resumo'), fluxo: document.getElementById('tela-fluxo'), cronograma: document.getElementById('tela-cronograma'), parametros: document.getElementById('tela-parametros'), custos: document.getElementById('tela-custos') };

function trocarTelaApp(telaAtivaId) { 
    Object.values(telasApp).forEach(t => { if(t) t.style.display = 'none'; }); 
    document.querySelectorAll('.sidebar nav ul li').forEach(li => li.classList.remove('active')); 
    
    if (telasApp[telaAtivaId]) telasApp[telaAtivaId].style.display = 'block'; 
    if (menusApp[telaAtivaId]) menusApp[telaAtivaId].parentElement.classList.add('active'); 
    
    textoBoasVindas.style.display = (telaAtivaId === 'dashboard') ? 'block' : 'none'; 

    // Auto-carrega fluxo de caixa ao entrar na tela
    if (telaAtivaId === 'fluxo') carregarFluxoCaixa();
    if (telaAtivaId === 'venda') carregarVendas();
    if (telaAtivaId === 'despesa') carregarDespesas();
    if (telaAtivaId === 'cronograma' && typeof carregarDadosDoBanco === 'function') carregarDadosDoBanco('PRODUÇÃO');
    if (telaAtivaId === 'custos' || telaAtivaId === 'precificacao') carregarProdutos();
    if (telaAtivaId === 'resumo') carregarResumoMensal();
    if (telaAtivaId === 'parametros') { carregarParametros(); if (typeof carregarEtapasProducao === 'function') carregarEtapasProducao(); }
}

Object.keys(menusApp).forEach(key => { 
    if (menusApp[key]) { 
        menusApp[key].addEventListener('click', (e) => { 
            e.preventDefault(); 
            trocarTelaApp(key); 
        }); 
    } 
});

document.getElementById('btnToggleMenu').addEventListener('click', () => { document.querySelector('.sidebar').classList.toggle('recolhida'); });
document.getElementById('btnSair').addEventListener('click', (e) => { e.preventDefault(); sessionStorage.removeItem('priPelUser'); appContainer.style.display = 'none'; telaLogin.style.display = 'flex'; });

const menuToggles = document.querySelectorAll('.menu-toggle'); 
menuToggles.forEach(toggle => { 
    toggle.addEventListener('click', (e) => { 
        e.preventDefault(); 
        const submenu = toggle.nextElementSibling; 
        const seta = toggle.querySelector('.seta'); 
        if (submenu.style.display === 'block') { submenu.style.display = 'none'; seta.classList.remove('aberta'); } 
        else { submenu.style.display = 'block'; seta.classList.add('aberta'); } 
    }); 
});

// =======================================================
// 3. LOGIN E CADASTRO
// =======================================================
const boxesLogin = { login: document.getElementById('box-login'), cad: document.getElementById('box-cadastro'), senha: document.getElementById('box-senha'), voltar: document.getElementById('link-voltar'), cadastrar: document.getElementById('link-cadastrar'), alterar: document.getElementById('link-alterar'), statusBox: document.getElementById('statusLogin') };

function exibirBox(alvo) { 
    boxesLogin.statusBox.style.display = 'none'; 
    boxesLogin.login.style.display = alvo === 'login' ? 'block' : 'none'; 
    boxesLogin.cad.style.display = alvo === 'cad' ? 'block' : 'none'; 
    boxesLogin.senha.style.display = alvo === 'senha' ? 'block' : 'none'; 
    boxesLogin.voltar.style.display = alvo === 'login' ? 'none' : 'block'; 
    boxesLogin.cadastrar.style.display = alvo === 'login' ? 'block' : 'none'; 
    boxesLogin.alterar.style.display = alvo === 'login' ? 'block' : 'none'; 
}

document.getElementById('link-cadastrar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('cad'); }); 
document.getElementById('link-alterar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('senha'); }); 
document.getElementById('link-voltar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('login'); });

window.toggleSenha = function(inputId, btn) { const input = document.getElementById(inputId); if (input.type === 'password') { input.type = 'text'; btn.innerText = '🙈'; } else { input.type = 'password'; btn.innerText = '👁️'; } };

const msgSenhaMatch = document.getElementById('msgSenhaMatch'); 
const btnSalvarCad = document.getElementById('btnSalvarCad');
function validarSenhas() { 
    const s1 = document.getElementById('cadSenha').value; const s2 = document.getElementById('cadSenhaConfirma').value; 
    if (s1 === '' || s2 === '') { msgSenhaMatch.innerText = ''; btnSalvarCad.disabled = true; return; } 
    if (s1.length < 6 || s1.length > 20) { msgSenhaMatch.innerText = '❌ A senha deve ter entre 6 e 20 caracteres!'; msgSenhaMatch.style.color = 'var(--cor-alerta)'; btnSalvarCad.disabled = true; return; } 
    if (s1 === s2) { msgSenhaMatch.innerText = '✅ Senhas válidas e iguais!'; msgSenhaMatch.style.color = 'var(--cor-sucesso)'; btnSalvarCad.disabled = false; } 
    else { msgSenhaMatch.innerText = '❌ As senhas não coincidem!'; msgSenhaMatch.style.color = 'var(--cor-alerta)'; btnSalvarCad.disabled = true; } 
} 
document.getElementById('cadSenha').addEventListener('input', validarSenhas); 
document.getElementById('cadSenhaConfirma').addEventListener('input', validarSenhas);


// Validação da alteração de senha
const novaSenhaInput = document.getElementById('novaSenha');
const novaSenhaConfirmaInput = document.getElementById('novaSenhaConfirma');
const msgTrocaSenhaMatch = document.getElementById('msgTrocaSenhaMatch');
const btnSalvarSenha = document.getElementById('btnSalvarSenha');

function validarNovaSenha() {
    const senha = novaSenhaInput.value;
    const confirmacao = novaSenhaConfirmaInput.value;

    if (!senha || !confirmacao) {
        msgTrocaSenhaMatch.innerText = '';
        btnSalvarSenha.disabled = true;
        return;
    }

    if (senha.length < 6 || senha.length > 20) {
        msgTrocaSenhaMatch.innerText = '❌ A senha deve ter entre 6 e 20 caracteres!';
        msgTrocaSenhaMatch.style.color = 'var(--cor-alerta)';
        btnSalvarSenha.disabled = true;
        return;
    }

    if (senha !== confirmacao) {
        msgTrocaSenhaMatch.innerText = '❌ As senhas não coincidem!';
        msgTrocaSenhaMatch.style.color = 'var(--cor-alerta)';
        btnSalvarSenha.disabled = true;
        return;
    }

    msgTrocaSenhaMatch.innerText = '✅ Senhas válidas e iguais!';
    msgTrocaSenhaMatch.style.color = 'var(--cor-sucesso)';
    btnSalvarSenha.disabled = false;
}

novaSenhaInput.addEventListener('input', validarNovaSenha);
novaSenhaConfirmaInput.addEventListener('input', validarNovaSenha);

// Envio do cadastro de usuário
document.getElementById('formCadastro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = btnSalvarCad;
    btn.disabled = true;
    boxesLogin.statusBox.style.display = 'block';
    boxesLogin.statusBox.style.color = '#FFD700';
    boxesLogin.statusBox.innerText = '⏳ Criando usuário...';

    try {
        const resultado = await chamarApi({
                acao: 'cadastrar',
                nome: document.getElementById('cadNome').value.trim(),
                usuario: document.getElementById('cadUser').value.trim(),
                senha: document.getElementById('cadSenha').value
        });
        if (resultado.status !== 'sucesso') {
            throw new Error(resultado.mensagem || 'Não foi possível criar o usuário.');
        }

        boxesLogin.statusBox.style.color = 'var(--cor-sucesso)';
        boxesLogin.statusBox.innerText = '✅ ' + resultado.mensagem;
        document.getElementById('formCadastro').reset();
        msgSenhaMatch.innerText = '';
        setTimeout(() => exibirBox('login'), 1800);
    } catch (erro) {
        boxesLogin.statusBox.style.color = 'var(--cor-alerta)';
        boxesLogin.statusBox.innerText = '❌ ' + erro.message;
    } finally {
        validarSenhas();
    }
});

// Envio da alteração de senha
document.getElementById('formTrocaSenha').addEventListener('submit', async (e) => {
    e.preventDefault();
    validarNovaSenha();
    if (btnSalvarSenha.disabled) return;

    btnSalvarSenha.disabled = true;
    msgTrocaSenhaMatch.style.color = '#FFD700';
    msgTrocaSenhaMatch.innerText = '⏳ Atualizando senha...';

    try {
        const resultado = await chamarApi({
                acao: 'alterar_senha',
                usuario: document.getElementById('trocaUser').value.trim(),
                novaSenha: novaSenhaInput.value
        });

        if (resultado.status !== 'sucesso') {
            throw new Error(resultado.mensagem || 'Não foi possível alterar a senha.');
        }

        msgTrocaSenhaMatch.style.color = 'var(--cor-sucesso)';
        msgTrocaSenhaMatch.innerText = '✅ ' + resultado.mensagem;
        boxesLogin.statusBox.style.display = 'block';
        boxesLogin.statusBox.style.color = 'var(--cor-sucesso)';
        boxesLogin.statusBox.innerText = '✅ Senha atualizada. Você já pode entrar com a nova senha.';

        setTimeout(() => {
            document.getElementById('formTrocaSenha').reset();
            exibirBox('login');
        }, 2200);
    } catch (erro) {
        msgTrocaSenhaMatch.style.color = 'var(--cor-alerta)';
        msgTrocaSenhaMatch.innerText = '❌ ' + erro.message;
        btnSalvarSenha.disabled = false;
    }
});

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = document.getElementById('btnEntrar'); btn.disabled = true; 
    boxesLogin.statusBox.style.display = 'block'; boxesLogin.statusBox.style.color = "#FFD700"; boxesLogin.statusBox.innerText = "⏳ Conectando..."; 
    const userDigitado = document.getElementById('loginUser').value.trim();
    try { 
        const resultado = await chamarApi({ acao: "login", usuario: userDigitado, senha: document.getElementById('loginSenha').value });
        if (resultado.status === "sucesso") { 
            boxesLogin.statusBox.style.color = "#00C853"; boxesLogin.statusBox.innerText = "✅ Acesso Liberado!"; 
            sessionStorage.setItem('priPelUser', JSON.stringify({ nome: resultado.nomeCompleto, login: userDigitado })); 
            setTimeout(() => { 
                telaLogin.style.display = 'none'; appContainer.style.display = 'flex'; 
                nomeUsuarioLogado.innerText = resultado.nomeCompleto; 
                textoBoasVindas.innerText = `Olá, ${resultado.nomeCompleto.split(" ")[0]}! Aqui está o resumo.`; 
                document.getElementById('formLogin').reset(); boxesLogin.statusBox.style.display = 'none'; 
                carregarDashboard(); 
            }, 1000); 
        } 
        else if (resultado.status === "expirada") { boxesLogin.statusBox.style.color = "#FF3D00"; boxesLogin.statusBox.innerText = "⚠️ " + resultado.mensagem; setTimeout(() => { exibirBox('senha'); document.getElementById('trocaUser').value = userDigitado; }, 3000); }
        else { boxesLogin.statusBox.style.color = "#FF3D00"; boxesLogin.statusBox.innerText = "❌ " + resultado.mensagem; }
    } catch (err) { boxesLogin.statusBox.style.color = "#FF3D00"; boxesLogin.statusBox.innerText = `❌ ${err.message || 'Erro de conexão.'}`; } finally { btn.disabled = false; }
});

// =======================================================
// 4. ENVIO DE DESPESAS E VENDAS
// =======================================================
function aplicarMascaraMoeda(e) {
    let valor = e.target.value.replace(/\D/g, ''); 
    if (valor === '') { e.target.value = ''; return; }
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    valor = valor.replace('.', ','); 
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); 
    e.target.value = valor;
}

function limparMoedaParaEnvio(valorFormatado) {
    if (!valorFormatado) return "0";
    return (parseInt(valorFormatado.replace(/\D/g, ''), 10) / 100).toString();
}

['custo', 'valor', 'valorDespesa'].forEach(id => {
    if(document.getElementById(id)) document.getElementById(id).addEventListener('input', aplicarMascaraMoeda);
});

document.getElementById('formVenda').addEventListener('submit', async (e) => { 
    e.preventDefault(); const btn = document.getElementById('btnEnviarVenda'); const msg = document.getElementById('mensagemVenda'); 
    btn.disabled = true; msg.style.color = "var(--texto-claro)"; msg.innerText = "Enviando..."; 
    
    const custoLimpo = limparMoedaParaEnvio(document.getElementById('custo').value);
    const valorLimpo = limparMoedaParaEnvio(document.getElementById('valor').value);
    const dados = [ document.getElementById('data').value, document.getElementById('cliente').value, document.getElementById('categoriaProduto').value, document.getElementById('formaPagamento').value, custoLimpo, valorLimpo ]; 
    
    try { 
        const resultado = await chamarApi({ planilha: "vendas", dados: dados, usuarioLogado: obterUserLogado() });
        if (resultado.status === "sucesso") { msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Salvo com sucesso!"; document.getElementById('formVenda').reset(); carregarDashboard(); } 
        else throw new Error(resultado.mensagem); 
    } catch (err) { msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro: " + err.message; } 
    finally { btn.disabled = false; setTimeout(() => msg.innerText = "", 4000); } 
});

let despesasCarregadas = [];
let despesaEmEdicao = null;

function limparFormularioDespesa() {
    despesaEmEdicao = null;
    document.getElementById('formDespesa').reset();
    document.getElementById('tituloFormDespesa').textContent = 'Registrar Nova Despesa';
    document.getElementById('btnEnviarDespesa').textContent = 'Salvar Despesa';
    document.getElementById('btnCancelarEdicaoDespesa').style.display = 'none';
    document.getElementById('mensagemDespesa').textContent = '';
}

document.getElementById('formDespesa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnEnviarDespesa');
    const msg = document.getElementById('mensagemDespesa');
    btn.disabled = true;
    msg.style.color = 'var(--texto-claro)';
    msg.textContent = '⏳ Salvando...';
    const despesa = {
        id: despesaEmEdicao,
        vencimento: document.getElementById('dataDespesa').value,
        categoria: document.getElementById('categoriaDespesa').value.trim(),
        valor: Number(limparMoedaParaEnvio(document.getElementById('valorDespesa').value)) || 0,
        status: document.getElementById('statusDespesa').value,
        observacao: document.getElementById('observacaoDespesa').value.trim(),
        usuario: obterUserLogado()
    };
    try {
        const resultado = await chamarApi({ acao: despesaEmEdicao ? 'editar_despesa' : 'salvar_despesa', despesa });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível salvar a despesa.');
        msg.style.color = 'var(--cor-sucesso)';
        msg.textContent = `✅ ${resultado.mensagem}`;
        limparFormularioDespesa();
        await Promise.all([carregarDespesas(), carregarDashboard()]);
    } catch (erro) {
        msg.style.color = 'var(--cor-alerta)';
        msg.textContent = `❌ ${erro.message}`;
    } finally {
        btn.disabled = false;
    }
});

function preencherCategoriasDespesas(categorias) {
    const datalist = document.getElementById('listaCategoriasDespesa');
    const filtro = document.getElementById('filtroCategoriaDespesa');
    const selecionada = filtro.value;
    datalist.replaceChildren();
    filtro.replaceChildren();
    const todas = document.createElement('option');
    todas.value = '';
    todas.textContent = 'Todas';
    filtro.appendChild(todas);
    categorias.forEach(categoria => {
        const sugestao = document.createElement('option');
        sugestao.value = categoria;
        datalist.appendChild(sugestao);
        const opcao = document.createElement('option');
        opcao.value = categoria;
        opcao.textContent = categoria;
        filtro.appendChild(opcao);
    });
    filtro.value = categorias.includes(selecionada) ? selecionada : '';
}

function despesasFiltradas() {
    const pesquisa = document.getElementById('pesquisaDespesas').value.trim().toLowerCase();
    const categoria = document.getElementById('filtroCategoriaDespesa').value;
    const status = document.getElementById('filtroStatusDespesa').value;
    const inicio = document.getElementById('filtroDespesaInicio').value;
    const fim = document.getElementById('filtroDespesaFim').value;
    return despesasCarregadas.filter(despesa => {
        const texto = `${despesa.categoria} ${despesa.observacao} ${despesa.status}`.toLowerCase();
        return (!pesquisa || texto.includes(pesquisa)) && (!categoria || despesa.categoria === categoria) && (!status || despesa.status === status) && (!inicio || despesa.vencimento >= inicio) && (!fim || despesa.vencimento <= fim);
    });
}

function renderizarDespesas() {
    const tbody = document.getElementById('corpoTabelaDespesas');
    const despesas = despesasFiltradas();
    tbody.replaceChildren();
    const total = despesas.reduce((s, d) => s + Number(d.valor || 0), 0);
    const pendente = despesas.filter(d => d.status === 'Pendente').reduce((s, d) => s + Number(d.valor || 0), 0);
    const pago = despesas.filter(d => d.status === 'Pago').reduce((s, d) => s + Number(d.valor || 0), 0);
    document.getElementById('totalDespesasFiltrado').textContent = formatarMoeda(total);
    document.getElementById('totalDespesasPendentes').textContent = formatarMoeda(pendente);
    document.getElementById('totalDespesasPagas').textContent = formatarMoeda(pago);
    if (!despesas.length) {
        const tr = document.createElement('tr');
        const td = adicionarCelula(tr, 'Nenhuma despesa encontrada.');
        td.colSpan = 6;
        td.style.cssText = 'text-align:center;padding:35px;color:var(--texto-mutado);';
        tbody.appendChild(tr);
        return;
    }
    despesas.forEach(despesa => {
        const tr = document.createElement('tr');
        adicionarCelula(tr, despesa.vencimentoF || despesa.vencimento);
        adicionarCelula(tr, despesa.categoria);
        adicionarCelula(tr, despesa.status);
        adicionarCelula(tr, despesa.observacao || '—');
        const valor = adicionarCelula(tr, formatarMoeda(Number(despesa.valor) || 0));
        valor.style.textAlign = 'right';
        const acoes = adicionarCelula(tr, '');
        acoes.style.textAlign = 'center';
        acoes.appendChild(criarBotaoAcao('✏️', 'Editar despesa', '#6c5ce7', () => editarDespesa(despesa.id)));
        if (despesa.status !== 'Pago') acoes.appendChild(criarBotaoAcao('✅', 'Marcar como paga', 'var(--cor-sucesso)', () => quitarDespesa(despesa.id)));
        acoes.appendChild(criarBotaoAcao('🗑️', 'Excluir despesa', 'var(--cor-alerta)', () => excluirDespesa(despesa.id)));
        tbody.appendChild(tr);
    });
}

async function carregarDespesas() {
    const tbody = document.getElementById('corpoTabelaDespesas');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:35px;">⏳ Carregando despesas...</td></tr>';
    try {
        const resultado = await chamarApi({ acao: 'listar_despesas' });
        if (resultado.status !== 'sucesso' || !Array.isArray(resultado.despesas)) throw new Error(resultado.mensagem || 'Resposta inválida.');
        despesasCarregadas = resultado.despesas;
        preencherCategoriasDespesas(resultado.categorias || []);
        renderizarDespesas();
    } catch (erro) {
        tbody.replaceChildren();
        const tr = document.createElement('tr');
        const td = adicionarCelula(tr, `❌ ${erro.message}`);
        td.colSpan = 6;
        td.style.cssText = 'text-align:center;padding:35px;color:var(--cor-alerta);';
        tbody.appendChild(tr);
    }
}

function editarDespesa(id) {
    const despesa = despesasCarregadas.find(item => item.id === id);
    if (!despesa) return;
    despesaEmEdicao = id;
    document.getElementById('dataDespesa').value = despesa.vencimento;
    document.getElementById('categoriaDespesa').value = despesa.categoria;
    document.getElementById('valorDespesa').value = Number(despesa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('statusDespesa').value = despesa.status;
    document.getElementById('observacaoDespesa').value = despesa.observacao || '';
    document.getElementById('tituloFormDespesa').textContent = `Editar despesa ${id}`;
    document.getElementById('btnEnviarDespesa').textContent = 'Atualizar Despesa';
    document.getElementById('btnCancelarEdicaoDespesa').style.display = 'inline-block';
    document.getElementById('dataDespesa').focus();
}

async function quitarDespesa(id) {
    try {
        const resultado = await chamarApi({ acao: 'quitar_despesa', id, usuario: obterUserLogado() });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível quitar a despesa.');
        await Promise.all([carregarDespesas(), carregarDashboard()]);
    } catch (erro) { alert(`Erro: ${erro.message}`); }
}

async function excluirDespesa(id) {
    if (!confirm(`Excluir definitivamente a despesa ${id}?`)) return;
    try {
        const resultado = await chamarApi({ acao: 'excluir_despesa', id, usuario: obterUserLogado() });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível excluir a despesa.');
        if (despesaEmEdicao === id) limparFormularioDespesa();
        await Promise.all([carregarDespesas(), carregarDashboard()]);
    } catch (erro) { alert(`Erro: ${erro.message}`); }
}

['pesquisaDespesas', 'filtroCategoriaDespesa', 'filtroDespesaInicio', 'filtroDespesaFim', 'filtroStatusDespesa'].forEach(id => document.getElementById(id).addEventListener('input', renderizarDespesas));
document.getElementById('btnAtualizarDespesas').addEventListener('click', carregarDespesas);
document.getElementById('btnCancelarEdicaoDespesa').addEventListener('click', limparFormularioDespesa);
document.getElementById('btnLimparFiltrosDespesa').addEventListener('click', () => {
    ['pesquisaDespesas', 'filtroCategoriaDespesa', 'filtroDespesaInicio', 'filtroDespesaFim', 'filtroStatusDespesa'].forEach(id => document.getElementById(id).value = '');
    renderizarDespesas();
});

// =======================================================
// 5. CALCULADORA DE PRECIFICAÇÃO (REGRAS SHOPEE)
// =======================================================
let parametrosSistema = { prazoProducao: 5, taxaLink: 4.99, taxaShopee: 14, taxaShopeeBaixa: 20, taxaFixaCpf: 3, categoriasDespesa: [] };

async function carregarParametros(preencherFormulario = true) {
    try {
        const resultado = await chamarApi({ acao: 'carregar_parametros' });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível carregar os parâmetros.');
        parametrosSistema = { ...parametrosSistema, ...(resultado.parametros || {}) };
        if (preencherFormulario) {
            document.getElementById('paramPrazoProducao').value = parametrosSistema.prazoProducao;
            document.getElementById('paramTaxaLink').value = parametrosSistema.taxaLink;
            document.getElementById('paramTaxaShopee').value = parametrosSistema.taxaShopee;
            document.getElementById('paramTaxaShopeeBaixa').value = parametrosSistema.taxaShopeeBaixa;
            document.getElementById('paramTaxaFixaCpf').value = parametrosSistema.taxaFixaCpf;
            document.getElementById('paramCategoriasDespesa').value = (parametrosSistema.categoriasDespesa || []).join('\n');
        }
        if (!document.getElementById('calcTaxaLink').value || document.getElementById('calcTaxaLink').value === '4.99') document.getElementById('calcTaxaLink').value = parametrosSistema.taxaLink;
        if (typeof atualizarPrazoProducao === 'function') atualizarPrazoProducao(parametrosSistema.prazoProducao);
        return parametrosSistema;
    } catch (erro) {
        if (preencherFormulario) { const mensagem = document.getElementById('mensagemParametros'); mensagem.style.color = 'var(--cor-alerta)'; mensagem.textContent = `❌ ${erro.message}`; }
        return parametrosSistema;
    }
}

document.getElementById('formParametros').addEventListener('submit', async evento => {
    evento.preventDefault();
    const mensagem = document.getElementById('mensagemParametros');
    const parametros = {
        prazoProducao: Number(document.getElementById('paramPrazoProducao').value),
        taxaLink: Number(document.getElementById('paramTaxaLink').value),
        taxaShopee: Number(document.getElementById('paramTaxaShopee').value),
        taxaShopeeBaixa: Number(document.getElementById('paramTaxaShopeeBaixa').value),
        taxaFixaCpf: Number(document.getElementById('paramTaxaFixaCpf').value),
        categoriasDespesa: document.getElementById('paramCategoriasDespesa').value.split(/\n|,/).map(v => v.trim()).filter(Boolean),
        usuario: obterUserLogado()
    };
    mensagem.textContent = '⏳ Salvando parâmetros...';
    try {
        const resultado = await chamarApi({ acao: 'salvar_parametros', parametros });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível salvar.');
        parametrosSistema = resultado.parametros;
        mensagem.style.color = 'var(--cor-sucesso)';
        mensagem.textContent = '✅ Parâmetros salvos e aplicados.';
        document.getElementById('calcTaxaLink').value = parametrosSistema.taxaLink;
        if (typeof atualizarPrazoProducao === 'function') atualizarPrazoProducao(parametrosSistema.prazoProducao);
    } catch (erro) { mensagem.style.color = 'var(--cor-alerta)'; mensagem.textContent = `❌ ${erro.message}`; }
});

document.getElementById('btnCriarBackup').addEventListener('click', async () => {
    const mensagem = document.getElementById('mensagemBackup');
    mensagem.textContent = '⏳ Criando backup...';
    try {
        const resultado = await chamarApi({ acao: 'criar_backup', usuario: obterUserLogado() });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível criar o backup.');
        mensagem.style.color = 'var(--cor-sucesso)';
        mensagem.textContent = `✅ Backup criado: ${resultado.identificador}`;
    } catch (erro) { mensagem.style.color = 'var(--cor-alerta)'; mensagem.textContent = `❌ ${erro.message}`; }
});

function variacaoPercentual(atual, anterior) {
    if (!anterior) return atual ? 100 : 0;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
}

function renderizarComparativoResumo(atual, anterior) {
    const tbody = document.getElementById('corpoComparativoResumo');
    tbody.replaceChildren();
    [['Receitas', 'receitas'], ['Despesas pagas', 'despesas'], ['Custos', 'custos'], ['Lucro real', 'lucro']].forEach(([rotulo, chave]) => {
        const tr = document.createElement('tr');
        adicionarCelula(tr, rotulo);
        const valorAtual = adicionarCelula(tr, formatarMoeda(atual[chave] || 0)); valorAtual.style.textAlign = 'right';
        const valorAnterior = adicionarCelula(tr, formatarMoeda(anterior[chave] || 0)); valorAnterior.style.textAlign = 'right';
        const percentual = variacaoPercentual(atual[chave] || 0, anterior[chave] || 0);
        const variacao = adicionarCelula(tr, `${percentual >= 0 ? '+' : ''}${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`); variacao.style.textAlign = 'right';
        variacao.style.color = chave === 'despesas' || chave === 'custos' ? (percentual > 0 ? 'var(--cor-alerta)' : 'var(--cor-sucesso)') : (percentual >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-alerta)');
        tbody.appendChild(tr);
    });
}

function renderizarCategoriasResumo(categorias) {
    const box = document.getElementById('resumoCategorias');
    box.replaceChildren();
    if (!categorias.length) { box.textContent = 'Nenhuma despesa paga no período.'; return; }
    categorias.forEach(item => {
        const linha = document.createElement('div');
        linha.style.cssText = 'display:flex;justify-content:space-between;gap:12px;padding:10px 14px;background:var(--bg-fundo);border-radius:8px;';
        const nome = document.createElement('span'); nome.textContent = item.categoria;
        const valor = document.createElement('strong'); valor.textContent = formatarMoeda(item.valor);
        linha.append(nome, valor); box.appendChild(linha);
    });
}

async function carregarResumoMensal() {
    const mesInput = document.getElementById('mesResumo');
    if (!mesInput.value) mesInput.value = dataLocalIso().slice(0, 7);
    const mensagem = document.getElementById('mensagemResumo');
    mensagem.textContent = '⏳ Calculando resultado...';
    try {
        const resultado = await chamarApi({ acao: 'resumo_mensal', mes: mesInput.value });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível calcular o resumo.');
        document.getElementById('resumoReceitas').textContent = formatarMoeda(resultado.atual.receitas);
        document.getElementById('resumoDespesas').textContent = formatarMoeda(resultado.atual.despesas);
        document.getElementById('resumoCustos').textContent = formatarMoeda(resultado.atual.custos);
        const lucro = document.getElementById('resumoLucro'); lucro.textContent = formatarMoeda(resultado.atual.lucro); lucro.style.color = resultado.atual.lucro >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-alerta)';
        renderizarComparativoResumo(resultado.atual, resultado.anterior);
        renderizarCategoriasResumo(resultado.categorias || []);
        mensagem.textContent = '';
    } catch (erro) { mensagem.style.color = 'var(--cor-alerta)'; mensagem.textContent = `❌ ${erro.message}`; }
}

document.getElementById('btnAtualizarResumo').addEventListener('click', carregarResumoMensal);
document.getElementById('mesResumo').addEventListener('change', carregarResumoMensal);

let produtosCarregados = [];
let produtoEmEdicao = null;

function limparFormularioProduto() {
    produtoEmEdicao = null;
    document.getElementById('formProduto').reset();
    document.getElementById('tituloFormProduto').textContent = 'Produtos e Custos';
    document.getElementById('btnSalvarProduto').textContent = 'Salvar produto';
    document.getElementById('btnCancelarEdicaoProduto').style.display = 'none';
    document.getElementById('mensagemProduto').textContent = '';
}

function preencherProdutosPrecificacao() {
    const select = document.getElementById('calcProduto');
    const selecionado = select.value;
    select.replaceChildren();
    const manual = document.createElement('option');
    manual.value = '';
    manual.textContent = 'Cálculo manual';
    select.appendChild(manual);
    produtosCarregados.forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.id;
        option.textContent = produto.nome;
        select.appendChild(option);
    });
    if (produtosCarregados.some(p => p.id === selecionado)) select.value = selecionado;
}

function renderizarProdutos() {
    const termo = document.getElementById('pesquisaProdutos').value.trim().toLowerCase();
    const tbody = document.getElementById('corpoTabelaProdutos');
    const produtos = produtosCarregados.filter(p => p.nome.toLowerCase().includes(termo));
    tbody.replaceChildren();
    if (!produtos.length) {
        const tr = document.createElement('tr');
        const td = adicionarCelula(tr, 'Nenhum produto encontrado.');
        td.colSpan = 5;
        td.style.cssText = 'text-align:center;padding:35px;color:var(--texto-mutado);';
        tbody.appendChild(tr);
        return;
    }
    produtos.forEach(produto => {
        const tr = document.createElement('tr');
        adicionarCelula(tr, produto.nome);
        const materia = adicionarCelula(tr, formatarMoeda(produto.materiaPrima)); materia.style.textAlign = 'right';
        const extras = adicionarCelula(tr, formatarMoeda(produto.custosExtras)); extras.style.textAlign = 'right';
        const margem = adicionarCelula(tr, `${Number(produto.margem).toLocaleString('pt-BR')}%`); margem.style.textAlign = 'right';
        const acoes = adicionarCelula(tr, ''); acoes.style.textAlign = 'center';
        acoes.appendChild(criarBotaoAcao('🧮', 'Usar na Precificação', 'var(--cor-sucesso)', () => usarProdutoNaPrecificacao(produto.id)));
        acoes.appendChild(criarBotaoAcao('✏️', 'Editar produto', '#6c5ce7', () => editarProduto(produto.id)));
        acoes.appendChild(criarBotaoAcao('🗑️', 'Excluir produto', 'var(--cor-alerta)', () => excluirProduto(produto.id)));
        tbody.appendChild(tr);
    });
}

async function carregarProdutos() {
    try {
        const resultado = await chamarApi({ acao: 'listar_produtos' });
        if (resultado.status !== 'sucesso' || !Array.isArray(resultado.produtos)) throw new Error(resultado.mensagem || 'Não foi possível carregar os produtos.');
        produtosCarregados = resultado.produtos;
        preencherProdutosPrecificacao();
        renderizarProdutos();
    } catch (erro) {
        const tbody = document.getElementById('corpoTabelaProdutos');
        tbody.replaceChildren();
        const tr = document.createElement('tr');
        const td = adicionarCelula(tr, `❌ ${erro.message}`); td.colSpan = 5; td.style.cssText = 'text-align:center;padding:35px;color:var(--cor-alerta);';
        tbody.appendChild(tr);
    }
}

document.getElementById('formProduto').addEventListener('submit', async evento => {
    evento.preventDefault();
    const botao = document.getElementById('btnSalvarProduto');
    const mensagem = document.getElementById('mensagemProduto');
    const produto = { id: produtoEmEdicao, nome: document.getElementById('produtoNome').value.trim(), materiaPrima: Number(limparMoedaParaEnvio(document.getElementById('produtoMateriaPrima').value)) || 0, custosExtras: Number(limparMoedaParaEnvio(document.getElementById('produtoCustosExtras').value)) || 0, margem: Number(document.getElementById('produtoMargem').value) || 0, usuario: obterUserLogado() };
    botao.disabled = true;
    mensagem.textContent = '⏳ Salvando...';
    try {
        const resultado = await chamarApi({ acao: produtoEmEdicao ? 'editar_produto' : 'salvar_produto', produto });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível salvar o produto.');
        limparFormularioProduto();
        await carregarProdutos();
    } catch (erro) { mensagem.style.color = 'var(--cor-alerta)'; mensagem.textContent = `❌ ${erro.message}`; }
    finally { botao.disabled = false; }
});

function editarProduto(id) {
    const produto = produtosCarregados.find(item => item.id === id);
    if (!produto) return;
    produtoEmEdicao = id;
    document.getElementById('produtoNome').value = produto.nome;
    document.getElementById('produtoMateriaPrima').value = Number(produto.materiaPrima).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('produtoCustosExtras').value = Number(produto.custosExtras).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('produtoMargem').value = produto.margem;
    document.getElementById('tituloFormProduto').textContent = `Editar produto ${produto.nome}`;
    document.getElementById('btnSalvarProduto').textContent = 'Atualizar produto';
    document.getElementById('btnCancelarEdicaoProduto').style.display = 'inline-block';
}

async function excluirProduto(id) {
    if (!confirm('Excluir definitivamente este produto?')) return;
    try {
        const resultado = await chamarApi({ acao: 'excluir_produto', id, usuario: obterUserLogado() });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível excluir.');
        if (produtoEmEdicao === id) limparFormularioProduto();
        await carregarProdutos();
    } catch (erro) { alert(`Erro: ${erro.message}`); }
}

function usarProdutoNaPrecificacao(id) {
    trocarTelaApp('precificacao');
    document.getElementById('calcProduto').value = id;
    aplicarProdutoNaPrecificacao();
}

function aplicarProdutoNaPrecificacao() {
    const produto = produtosCarregados.find(item => item.id === document.getElementById('calcProduto').value);
    if (!produto) return;
    document.getElementById('calcCustoMaterial').value = Number(produto.materiaPrima).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('calcCustoExtra').value = Number(produto.custosExtras).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('calcMargem').value = produto.margem;
    calcularPrecificacao();
}

document.getElementById('produtoMateriaPrima').addEventListener('input', aplicarMascaraMoeda);
document.getElementById('produtoCustosExtras').addEventListener('input', aplicarMascaraMoeda);
document.getElementById('pesquisaProdutos').addEventListener('input', renderizarProdutos);
document.getElementById('btnAtualizarProdutos').addEventListener('click', carregarProdutos);
document.getElementById('btnCancelarEdicaoProduto').addEventListener('click', limparFormularioProduto);
document.getElementById('calcProduto').addEventListener('change', aplicarProdutoNaPrecificacao);

document.getElementById('calcCustoMaterial').addEventListener('input', aplicarMascaraMoeda);
document.getElementById('calcCustoExtra').addEventListener('input', aplicarMascaraMoeda);

document.getElementById('calcCanal').addEventListener('change', (e) => {
    const isShopee = e.target.value === 'shopee';
    document.getElementById('boxShopee').style.display = isShopee ? 'block' : 'none';
    document.getElementById('boxLink').style.display = isShopee ? 'none' : 'block';
    calcularPrecificacao();
});

function calcularPrecificacao() {
    const matVal = parseFloat(limparMoedaParaEnvio(document.getElementById('calcCustoMaterial').value)) || 0;
    const extVal = parseFloat(limparMoedaParaEnvio(document.getElementById('calcCustoExtra').value)) || 0;
    const margem = parseFloat(document.getElementById('calcMargem').value) || 0;
    
    const canal = document.getElementById('calcCanal').value;
    const custoTotal = matVal + extVal;
    
    const lucroBruto = custoTotal * (margem / 100);
    const target = custoTotal + lucroBruto; 

    let precoSugerido = 0;
    let valorTaxa = 0;

    if (canal === 'shopee') {
        const isCPF = document.getElementById('calcShopeeTipo').value === 'cpf';
        const taxaFixaCPF = isCPF ? Number(parametrosSistema.taxaFixaCpf || 0) : 0;
        const taxaPadrao = Number(parametrosSistema.taxaShopee || 14) / 100;
        const taxaBaixa = Number(parametrosSistema.taxaShopeeBaixa || 20) / 100;
        
        let p1 = (target + 4 + taxaFixaCPF) / (1 - taxaBaixa);
        let p2 = (target + 16 + taxaFixaCPF) / (1 - taxaPadrao);
        let p3 = (target + 20 + taxaFixaCPF) / (1 - taxaPadrao);
        let p4 = (target + 26 + taxaFixaCPF) / (1 - taxaPadrao);

        if (p1 < 80) { precoSugerido = p1; } 
        else if (p2 >= 80 && p2 < 100) { precoSugerido = p2; } 
        else if (p3 >= 100 && p3 < 200) { precoSugerido = p3; } 
        else { precoSugerido = p4; }

        if (precoSugerido < 80) valorTaxa = (precoSugerido * taxaBaixa) + 4 + taxaFixaCPF;
        else if (precoSugerido < 100) valorTaxa = (precoSugerido * taxaPadrao) + 16 + taxaFixaCPF;
        else if (precoSugerido < 200) valorTaxa = (precoSugerido * taxaPadrao) + 20 + taxaFixaCPF;
        else valorTaxa = (precoSugerido * taxaPadrao) + 26 + taxaFixaCPF;
    } else {
        const taxaLink = parseFloat(document.getElementById('calcTaxaLink').value) || 0;
        if (taxaLink < 100) { precoSugerido = target / (1 - (taxaLink / 100)); }
        valorTaxa = precoSugerido * (taxaLink / 100);
    }

    const lucroLiquido = precoSugerido - custoTotal - valorTaxa;

    document.getElementById('calcPrecoFinal').innerText = formatarMoeda(precoSugerido);
    document.getElementById('calcCustoTotalOut').innerText = formatarMoeda(custoTotal);
    document.getElementById('calcTaxaOut').innerText = formatarMoeda(valorTaxa);
    document.getElementById('calcLucroOut').innerText = formatarMoeda(lucroLiquido);
}

['calcCustoMaterial', 'calcCustoExtra', 'calcMargem', 'calcTaxaLink', 'calcShopeeTipo', 'calcCanal'].forEach(id => {
    document.getElementById(id).addEventListener('input', calcularPrecificacao);
});

document.getElementById('btnLimparCalc').addEventListener('click', () => {
    document.getElementById('formPrecificacao').reset();
    calcularPrecificacao(); 
});

// =======================================================
// 6. MODAL E LISTA DE NOVA VENDA
// =======================================================
const modalVenda = document.getElementById('modalVenda');
let listaProdutosVenda = [];
let vendasCarregadas = [];
let pedidoEmEdicao = null;

function dataLocalIso() {
    const agora = new Date();
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
}

function mostrarPassoVenda(passo) {
    [1, 2, 3].forEach(numero => {
        document.getElementById(`venda-passo-${numero}`).style.display = numero === passo ? 'block' : 'none';
        document.getElementById(`step${numero}-circle`).style.background = numero <= passo ? 'var(--cor-destaque)' : 'var(--borda)';
    });
}

function limparModalVenda() {
    pedidoEmEdicao = null;
    listaProdutosVenda = [];
    ['venda-cliente', 'venda-entrega', 'venda-taxa', 'venda-frete', 'venda-observacao', 'add-prod-nome', 'add-prod-tema', 'add-prod-valor'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('venda-data').value = dataLocalIso();
    document.getElementById('venda-pagamento').value = 'PIX';
    document.getElementById('venda-status').value = 'Confirmada';
    document.getElementById('add-prod-qtd').value = '1';
    document.getElementById('tituloModalVenda').textContent = 'Cadastro de Nova Venda';
    document.getElementById('mensagemNovaVenda').textContent = '';
    renderizarListaResumo();
    mostrarPassoVenda(1);
}

async function carregarTemasVenda() {
    try {
        const resultado = await chamarApi({ acao: 'listar_temas' });
        const lista = document.getElementById('listaTemasVenda');
        lista.replaceChildren();
        (resultado.temas || []).forEach(tema => {
            const option = document.createElement('option');
            option.value = tema;
            lista.appendChild(option);
        });
    } catch (erro) {
        console.warn('Não foi possível carregar os temas:', erro);
    }
}

document.getElementById('btnAbrirModalVenda').addEventListener('click', () => {
    limparModalVenda();
    carregarTemasVenda();
    modalVenda.style.display = 'block';
});
document.getElementById('btnFecharModalVenda').addEventListener('click', () => { modalVenda.style.display = 'none'; });

document.getElementById('add-prod-valor').addEventListener('input', aplicarMascaraMoeda);
document.getElementById('venda-taxa').addEventListener('input', aplicarMascaraMoeda);
document.getElementById('venda-frete').addEventListener('input', aplicarMascaraMoeda);

document.getElementById('btnAddProdutoLista').addEventListener('click', () => {
    const nome = document.getElementById('add-prod-nome').value.trim();
    const tema = document.getElementById('add-prod-tema').value.trim();
    const valor = parseFloat(limparMoedaParaEnvio(document.getElementById('add-prod-valor').value)) || 0;
    const qtd = parseInt(document.getElementById('add-prod-qtd').value) || 1;

    if(nome && valor > 0) {
        listaProdutosVenda.push({ nome, tema, valor, qtd, subtotal: valor * qtd });
        renderizarListaResumo();
        document.getElementById('add-prod-nome').value = '';
        document.getElementById('add-prod-valor').value = '';
        document.getElementById('add-prod-qtd').value = '1';
    }
});

function renderizarListaResumo() {
    const container = document.getElementById('lista-produtos-resumo');
    const totalTxt = document.getElementById('venda-total-acumulado');
    container.innerHTML = '';
    let total = 0;

    if (!listaProdutosVenda.length) {
        const vazio = document.createElement('p');
        vazio.style.cssText = 'text-align:center;color:var(--texto-mutado);margin-top:40px;';
        vazio.textContent = '⚠️ Nenhum produto adicionado';
        container.appendChild(vazio);
    }

    listaProdutosVenda.forEach((p, indice) => {
        total += p.subtotal;
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;';
        const descricao = document.createElement('span');
        descricao.textContent = `${p.qtd}x ${p.nome}${p.tema ? ` — ${p.tema}` : ''}`;
        const valor = document.createElement('strong');
        valor.textContent = formatarMoeda(p.subtotal);
        const remover = document.createElement('button');
        remover.type = 'button';
        remover.textContent = '✕';
        remover.title = 'Remover produto';
        remover.style.cssText = 'width:auto;padding:4px 8px;background:var(--cor-alerta);';
        remover.addEventListener('click', () => { listaProdutosVenda.splice(indice, 1); renderizarListaResumo(); });
        div.append(descricao, valor, remover);
        container.appendChild(div);
    });

    totalTxt.innerText = formatarMoeda(total);
}

function validarPassoUmVenda() {
    if (!document.getElementById('venda-cliente').value.trim()) return 'Informe o cliente.';
    if (!document.getElementById('venda-data').value) return 'Informe a data da venda.';
    if (!document.getElementById('venda-entrega').value) return 'Informe a data da entrega.';
    if (!listaProdutosVenda.length) return 'Adicione pelo menos um produto.';
    return '';
}

function obterVendaDoFormulario() {
    return {
        pedido: pedidoEmEdicao,
        cliente: document.getElementById('venda-cliente').value.trim(),
        pagamento: document.getElementById('venda-pagamento').value,
        dataVenda: document.getElementById('venda-data').value,
        dataEntrega: document.getElementById('venda-entrega').value,
        statusVenda: document.getElementById('venda-status').value,
        taxa: Number(limparMoedaParaEnvio(document.getElementById('venda-taxa').value)) || 0,
        frete: Number(limparMoedaParaEnvio(document.getElementById('venda-frete').value)) || 0,
        observacao: document.getElementById('venda-observacao').value.trim(),
        produtos: listaProdutosVenda.map(p => ({ nome: p.nome, tema: p.tema, valor: Number(p.valor), qtd: Number(p.qtd) })),
        usuario: obterUserLogado()
    };
}

function montarRevisaoVenda() {
    const venda = obterVendaDoFormulario();
    const subtotal = venda.produtos.reduce((soma, p) => soma + p.valor * p.qtd, 0);
    const total = subtotal + venda.frete - venda.taxa;
    const revisao = document.getElementById('revisaoVenda');
    revisao.replaceChildren();
    [
        ['Pedido', venda.pedido || 'Gerado automaticamente ao salvar'],
        ['Cliente', venda.cliente],
        ['Venda / Entrega', `${venda.dataVenda} / ${venda.dataEntrega}`],
        ['Pagamento', venda.pagamento],
        ['Produtos', venda.produtos.map(p => `${p.qtd}x ${p.nome}${p.tema ? ` (${p.tema})` : ''}`).join(', ')],
        ['Subtotal', formatarMoeda(subtotal)],
        ['Entrega/Frete', formatarMoeda(venda.frete)],
        ['Taxas/Descontos', `- ${formatarMoeda(venda.taxa)}`],
        ['Total', formatarMoeda(total)]
    ].forEach(([rotulo, valor]) => {
        const linha = document.createElement('div');
        const forte = document.createElement('strong');
        forte.textContent = `${rotulo}: `;
        linha.append(forte, document.createTextNode(valor));
        revisao.appendChild(linha);
    });
}

document.getElementById('btnIrPasso2').addEventListener('click', () => {
    const erro = validarPassoUmVenda();
    if (erro) return alert(erro);
    mostrarPassoVenda(2);
});
document.getElementById('btnVoltarPasso1').addEventListener('click', () => mostrarPassoVenda(1));
document.getElementById('btnIrPasso3').addEventListener('click', () => { montarRevisaoVenda(); mostrarPassoVenda(3); });
document.getElementById('btnVoltarPasso2').addEventListener('click', () => mostrarPassoVenda(2));

document.getElementById('btnSalvarNovaVenda').addEventListener('click', async () => {
    const botao = document.getElementById('btnSalvarNovaVenda');
    const mensagem = document.getElementById('mensagemNovaVenda');
    botao.disabled = true;
    mensagem.style.color = 'var(--texto-claro)';
    mensagem.textContent = '⏳ Salvando venda...';
    try {
        const venda = obterVendaDoFormulario();
        const resultado = await chamarApi({ acao: pedidoEmEdicao ? 'editar_venda' : 'salvar_venda', venda });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível salvar a venda.');
        mensagem.style.color = 'var(--cor-sucesso)';
        mensagem.textContent = `✅ ${resultado.mensagem} Pedido ${resultado.pedido || venda.pedido}.`;
        await Promise.all([carregarVendas(), carregarDashboard()]);
        if (typeof carregarDadosDoBanco === 'function') await carregarDadosDoBanco('PRODUÇÃO');
        setTimeout(() => { modalVenda.style.display = 'none'; limparModalVenda(); }, 1200);
    } catch (erro) {
        mensagem.style.color = 'var(--cor-alerta)';
        mensagem.textContent = `❌ ${erro.message}`;
    } finally {
        botao.disabled = false;
    }
});

function criarBotaoAcao(texto, titulo, cor, acao) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = texto;
    botao.title = titulo;
    botao.style.cssText = `width:auto;padding:6px 9px;margin:2px;background:${cor};`;
    botao.addEventListener('click', acao);
    return botao;
}

function renderizarTabelaVendas() {
    const termo = document.getElementById('pesquisaVendas').value.trim().toLowerCase();
    const tbody = document.getElementById('corpoTabelaVendas');
    const filtradas = vendasCarregadas.filter(v => [v.pedido, v.cliente, v.produtosResumo, v.temasResumo, v.statusVenda].join(' ').toLowerCase().includes(termo));
    tbody.replaceChildren();
    if (!filtradas.length) {
        const tr = document.createElement('tr');
        const td = adicionarCelula(tr, 'Não foram encontrados registros');
        td.colSpan = 7;
        td.style.cssText = 'text-align:center;padding:50px;color:var(--texto-mutado);';
        tbody.appendChild(tr);
        return;
    }

    filtradas.forEach(venda => {
        const tr = document.createElement('tr');
        adicionarCelula(tr, venda.pedido);
        adicionarCelula(tr, venda.dataVendaF || venda.dataVenda);
        adicionarCelula(tr, venda.cliente);
        adicionarCelula(tr, venda.produtosResumo);
        adicionarCelula(tr, venda.statusVenda);
        const valor = adicionarCelula(tr, formatarMoeda(Number(venda.valorTotal) || 0));
        valor.style.textAlign = 'right';
        const acoes = adicionarCelula(tr, '');
        acoes.style.textAlign = 'center';
        acoes.appendChild(criarBotaoAcao('✏️', 'Editar venda', '#6c5ce7', () => editarVenda(venda.pedido)));
        if (venda.statusVenda !== 'Cancelada') acoes.appendChild(criarBotaoAcao('🚫', 'Cancelar venda', 'var(--cor-alerta)', () => cancelarVenda(venda.pedido)));
        tbody.appendChild(tr);
    });
}

async function carregarVendas() {
    const tbody = document.getElementById('corpoTabelaVendas');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">⏳ Carregando vendas...</td></tr>';
    try {
        const resultado = await chamarApi({ acao: 'listar_vendas' });
        if (resultado.status !== 'sucesso' || !Array.isArray(resultado.vendas)) throw new Error(resultado.mensagem || 'Resposta inválida.');
        vendasCarregadas = resultado.vendas;
        renderizarTabelaVendas();
        const ativas = vendasCarregadas.filter(v => v.statusVenda !== 'Cancelada');
        const efetivadas = ativas.filter(v => v.statusVenda === 'Confirmada').reduce((s, v) => s + Number(v.valorTotal || 0), 0);
        const pendentes = ativas.filter(v => v.statusVenda === 'Pendente').reduce((s, v) => s + Number(v.valorTotal || 0), 0);
        document.getElementById('vendasEfetivadasTxt').textContent = formatarMoeda(efetivadas);
        document.getElementById('previsaoRecebimentoTxt').textContent = formatarMoeda(pendentes);
        document.getElementById('tituloTelaVendas').textContent = `Vendas — ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())}`;
    } catch (erro) {
        tbody.replaceChildren();
        const tr = document.createElement('tr');
        const td = adicionarCelula(tr, `❌ ${erro.message}`);
        td.colSpan = 7;
        td.style.cssText = 'text-align:center;padding:40px;color:var(--cor-alerta);';
        tbody.appendChild(tr);
    }
}

function editarVenda(pedido) {
    const venda = vendasCarregadas.find(item => item.pedido === pedido);
    if (!venda) return;
    pedidoEmEdicao = pedido;
    document.getElementById('tituloModalVenda').textContent = `Editar venda ${pedido}`;
    document.getElementById('venda-cliente').value = venda.cliente;
    document.getElementById('venda-pagamento').value = venda.pagamento;
    document.getElementById('venda-data').value = venda.dataVenda;
    document.getElementById('venda-entrega').value = venda.dataEntrega;
    document.getElementById('venda-status').value = venda.statusVenda === 'Pendente' ? 'Pendente' : 'Confirmada';
    document.getElementById('venda-taxa').value = Number(venda.taxa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('venda-frete').value = Number(venda.frete || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('venda-observacao').value = venda.observacao || '';
    listaProdutosVenda = (venda.produtos || []).map(p => ({ ...p, valor: Number(p.valor), qtd: Number(p.qtd), subtotal: Number(p.valor) * Number(p.qtd) }));
    renderizarListaResumo();
    carregarTemasVenda();
    mostrarPassoVenda(1);
    modalVenda.style.display = 'block';
}

async function cancelarVenda(pedido) {
    if (!confirm(`Cancelar a venda ${pedido}? Ela será retirada do Dashboard e do Cronograma.`)) return;
    try {
        const resultado = await chamarApi({ acao: 'cancelar_venda', pedido, usuario: obterUserLogado() });
        if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível cancelar.');
        await Promise.all([carregarVendas(), carregarDashboard()]);
        if (typeof carregarDadosDoBanco === 'function') await carregarDadosDoBanco('PRODUÇÃO');
    } catch (erro) {
        alert(`Erro: ${erro.message}`);
    }
}

document.getElementById('pesquisaVendas').addEventListener('input', renderizarTabelaVendas);
document.getElementById('btnFiltrarVendas').addEventListener('click', carregarVendas);
