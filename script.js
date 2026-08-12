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
        if (typeof atualizarAcessoChamados === 'function') atualizarAcessoChamados();
        carregarDashboard(); 
    }
});

const menusApp = { dashboard: document.getElementById('menu-dashboard'), venda: document.getElementById('menu-venda'), despesa: document.getElementById('menu-despesa'), precificacao: document.getElementById('menu-precificacao'), resumo: document.getElementById('menu-resumo'), fluxo: document.getElementById('menu-fluxo'), cronograma: document.getElementById('menu-cronograma'), parametros: document.getElementById('menu-parametros'), custos: document.getElementById('menu-custos'), atendimento: document.getElementById('menu-atendimento') };
const telasApp = { dashboard: document.getElementById('tela-dashboard'), venda: document.getElementById('tela-venda'), despesa: document.getElementById('tela-despesa'), precificacao: document.getElementById('tela-precificacao'), resumo: document.getElementById('tela-resumo'), fluxo: document.getElementById('tela-fluxo'), cronograma: document.getElementById('tela-cronograma'), parametros: document.getElementById('tela-parametros'), custos: document.getElementById('tela-custos'), atendimento: document.getElementById('tela-atendimento') };

function definirMenuRecolhido(recolher) {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('recolhida', recolher);
    document.getElementById('btnToggleMenu').setAttribute('aria-expanded', String(!recolher));
    if (recolher) {
        document.querySelectorAll('.submenu').forEach(submenu => { submenu.style.display = 'none'; });
        document.querySelectorAll('.seta').forEach(seta => seta.classList.remove('aberta'));
    }
}

function trocarTelaApp(telaAtivaId) { 
    Object.values(telasApp).forEach(t => { if(t) t.style.display = 'none'; }); 
    document.querySelectorAll('.sidebar nav ul li').forEach(li => li.classList.remove('active')); 
    
    if (telasApp[telaAtivaId]) telasApp[telaAtivaId].style.display = 'block'; 
    if (menusApp[telaAtivaId]) menusApp[telaAtivaId].parentElement.classList.add('active'); 
    
    textoBoasVindas.style.display = (telaAtivaId === 'dashboard') ? 'block' : 'none'; 

    // Auto-carrega fluxo de caixa ao entrar na tela
    if (telaAtivaId === 'fluxo') carregarFluxoCaixa();
    if (telaAtivaId === 'venda') carregarVendas();
    if (telaAtivaId === 'despesa') { carregarDespesas(); carregarRelatoriosShopee(); }
    if (telaAtivaId === 'cronograma' && typeof carregarDadosDoBanco === 'function') carregarDadosDoBanco('PRODUÇÃO');
    if (telaAtivaId === 'custos') carregarProdutos();
    if (telaAtivaId === 'precificacao') carregarCentralPrecificacao();
    if (telaAtivaId === 'resumo') carregarResumoMensal();
    if (telaAtivaId === 'parametros') { carregarParametros(); if (typeof carregarEtapasProducao === 'function') carregarEtapasProducao(); }
    if (telaAtivaId === 'atendimento' && typeof carregarChamados === 'function') carregarChamados();

    // Mantém a tela limpa após a escolha de qualquer módulo.
    definirMenuRecolhido(true);
}

Object.keys(menusApp).forEach(key => { 
    if (menusApp[key]) { 
        menusApp[key].addEventListener('click', (e) => { 
            e.preventDefault(); 
            trocarTelaApp(key); 
        }); 
    } 
});

document.getElementById('btnToggleMenu').addEventListener('click', () => {
    definirMenuRecolhido(!document.querySelector('.sidebar').classList.contains('recolhida'));
});
document.getElementById('btnSair').addEventListener('click', (e) => { e.preventDefault(); sessionStorage.removeItem('priPelUser'); appContainer.style.display = 'none'; telaLogin.style.display = 'flex'; });

const menuToggles = document.querySelectorAll('.menu-toggle'); 
menuToggles.forEach(toggle => { 
    toggle.addEventListener('click', (e) => { 
        e.preventDefault(); 
        if (document.querySelector('.sidebar').classList.contains('recolhida')) definirMenuRecolhido(false);
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
                if (typeof atualizarAcessoChamados === 'function') atualizarAcessoChamados();
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
// CONCILIAÇÃO SHOPEE — RELATÓRIO INCOME
// =======================================================
function normalizarTextoFinanceiro(valor) {
    return String(valor == null ? '' : valor)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ').trim().toLowerCase();
}

function numeroFinanceiro(valor) {
    if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
    const texto = String(valor == null ? '' : valor).trim();
    if (!texto) return 0;
    const normalizado = texto.includes(',')
        ? texto.replace(/\./g, '').replace(',', '.')
        : texto.replace(/[^\d.-]/g, '');
    const numero = Number(normalizado.replace(/[^\d.-]/g, ''));
    return Number.isFinite(numero) ? numero : 0;
}

function dataRelatorioIso(valor) {
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor.toISOString().slice(0, 10);
    if (typeof valor === 'number' && window.XLSX && XLSX.SSF) {
        const partes = XLSX.SSF.parse_date_code(valor);
        if (partes) return `${partes.y}-${String(partes.m).padStart(2, '0')}-${String(partes.d).padStart(2, '0')}`;
    }
    const texto = String(valor || '').trim();
    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    return br ? `${br[3]}-${br[2]}-${br[1]}` : '';
}

function formatarDataFinanceira(valorIso) {
    const partes = String(valorIso || '').split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : '—';
}

function valorPorRotulo(matriz, rotulo) {
    const alvo = normalizarTextoFinanceiro(rotulo);
    for (const linha of matriz) {
        const indice = linha.findIndex(celula => normalizarTextoFinanceiro(celula) === alvo);
        if (indice < 0) continue;
        const numeros = linha.slice(indice + 1).filter(celula => celula !== '' && celula != null).map(numeroFinanceiro);
        if (numeros.length) return numeros[numeros.length - 1];
    }
    return 0;
}

function analisarRelatorioShopee(workbook, nomeArquivo) {
    const resumoNome = workbook.SheetNames.find(nome => normalizarTextoFinanceiro(nome) === 'summary');
    const rendaNome = workbook.SheetNames.find(nome => normalizarTextoFinanceiro(nome) === 'renda');
    if (!resumoNome || !rendaNome) throw new Error('Relatório incompatível. As abas Summary e Renda são obrigatórias.');
    const resumo = XLSX.utils.sheet_to_json(workbook.Sheets[resumoNome], { header: 1, raw: true, defval: '' });
    const renda = XLSX.utils.sheet_to_json(workbook.Sheets[rendaNome], { header: 1, raw: true, defval: '' });
    const inicio = dataRelatorioIso(resumo.find(linha => normalizarTextoFinanceiro(linha[0]) === 'de')?.[1]);
    const fim = dataRelatorioIso(resumo.find(linha => normalizarTextoFinanceiro(linha[0]) === 'para')?.[1]);
    if (!inicio || !fim) throw new Error('Não foi possível identificar o período do relatório.');

    const indiceCabecalho = renda.findIndex(linha => linha.some(celula => normalizarTextoFinanceiro(celula) === 'id do pedido'));
    if (indiceCabecalho < 0) throw new Error('A aba Renda não contém o cabeçalho ID do pedido.');
    const cabecalhos = renda[indiceCabecalho].map(normalizarTextoFinanceiro);
    const coluna = titulo => cabecalhos.indexOf(normalizarTextoFinanceiro(titulo));
    const colTipo = coluna('Ver');
    const colPedido = coluna('ID do pedido');
    const colProduto = coluna('Nome do produto');
    const itens = renda.slice(indiceCabecalho + 1)
        .filter(linha => normalizarTextoFinanceiro(linha[colTipo]) === 'sku')
        .map(linha => ({ pedido: String(linha[colPedido] || '').trim(), produto: String(linha[colProduto] || '').trim() }))
        .filter(item => item.pedido);
    const pedidos = new Set(renda.slice(indiceCabecalho + 1)
        .filter(linha => normalizarTextoFinanceiro(linha[colTipo]) === 'order')
        .map(linha => String(linha[colPedido] || '').trim()).filter(Boolean));

    const componentes = [
        ['Preço original dos produtos', 'Preço original do produto'],
        ['Promoções dos produtos', 'A promoção do seu produto'],
        ['Cupons', 'Cupom'],
        ['Taxa de comissão', 'Taxa de comissão líquida'],
        ['Taxa de serviço', 'Taxa de serviço líquida'],
        ['Comissão de afiliados', 'Taxa de comissão Afiliados do Vendedor'],
        ['Acréscimo de pagamento', 'Acréscimo por Método de Pagamento (AMP)'],
        ['Dedução de pagamento', 'Dedução de AMP']
    ].map(([nome, rotulo]) => ({ nome, valor: valorPorRotulo(resumo, rotulo) }));
    return {
        arquivo: nomeArquivo,
        inicio,
        fim,
        receita: valorPorRotulo(resumo, '1. Receita Total'),
        taxasShopee: Math.abs(valorPorRotulo(resumo, '2. Despesas Totais')),
        liberado: valorPorRotulo(resumo, '3. Quantidade Total Liberada'),
        pedidos: pedidos.size,
        itens,
        componentes
    };
}

async function obterProdutosParaAnalise() {
    if (produtosCarregados.length) return produtosCarregados;
    const resposta = await chamarApi({ acao: 'listar_produtos' });
    if (resposta.status === 'sucesso' && Array.isArray(resposta.produtos)) produtosCarregados = resposta.produtos;
    return produtosCarregados;
}

function calcularCustosRelatorio(relatorio, produtos) {
    let custo = 0;
    let identificados = 0;
    const naoIdentificados = [];
    relatorio.itens.forEach(item => {
        const nomeItem = normalizarTextoFinanceiro(item.produto);
        const produto = produtos.find(cadastrado => {
            const nomeCadastrado = normalizarTextoFinanceiro(cadastrado.nome);
            return nomeCadastrado && (nomeItem === nomeCadastrado || nomeItem.includes(nomeCadastrado) || nomeCadastrado.includes(nomeItem));
        });
        if (!produto) { naoIdentificados.push(item.produto || `Pedido ${item.pedido}`); return; }
        custo += numeroFinanceiro(produto.materiaPrima) + numeroFinanceiro(produto.custosExtras);
        identificados++;
    });
    return { custo, identificados, naoIdentificados };
}

function despesasPagasNoPeriodo(inicio, fim) {
    return despesasCarregadas
        .filter(item => item.status === 'Pago' && item.vencimento >= inicio && item.vencimento <= fim)
        .reduce((soma, item) => soma + numeroFinanceiro(item.valor), 0);
}

function renderizarAnaliseShopee(relatorio, custos, despesasInternas) {
    const resultado = relatorio.liberado - custos.custo - despesasInternas;
    const completo = relatorio.itens.length > 0 && custos.identificados === relatorio.itens.length;
    document.getElementById('resultadoShopee').hidden = false;
    document.getElementById('shopeePeriodo').textContent = `${formatarDataFinanceira(relatorio.inicio)} a ${formatarDataFinanceira(relatorio.fim)} · ${relatorio.pedidos} pedidos`;
    document.getElementById('shopeeReceita').textContent = formatarMoeda(relatorio.receita);
    document.getElementById('shopeeTaxas').textContent = formatarMoeda(relatorio.taxasShopee);
    document.getElementById('shopeeLiberado').textContent = formatarMoeda(relatorio.liberado);
    document.getElementById('shopeeDespesasInternas').textContent = formatarMoeda(despesasInternas);
    document.getElementById('shopeeCustos').textContent = formatarMoeda(custos.custo);
    const saida = document.getElementById('shopeeResultado');
    saida.textContent = formatarMoeda(resultado);
    saida.style.color = resultado >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-alerta)';
    const diagnostico = document.getElementById('shopeeDiagnostico');
    diagnostico.className = `shopee-diagnostico ${completo ? (resultado >= 0 ? 'lucro' : 'prejuizo') : 'incompleto'}`;
    diagnostico.textContent = completo ? (resultado >= 0 ? 'LUCRO NO PERÍODO' : 'PREJUÍZO NO PERÍODO') : 'ANÁLISE PARCIAL';
    const alerta = document.getElementById('alertaCustosShopee');
    alerta.textContent = completo
        ? 'Todos os itens do relatório foram associados aos custos cadastrados.'
        : `${custos.naoIdentificados.length} de ${relatorio.itens.length} item(ns) ainda não possuem custo identificado. O resultado acima é parcial; cadastre os produtos em Produtos e Custos para obter o lucro real.`;
    const corpo = document.getElementById('corpoComposicaoShopee');
    corpo.replaceChildren();
    [...relatorio.componentes,
        { nome: 'Despesas internas pagas', valor: -despesasInternas },
        { nome: 'Custos de produção identificados', valor: -custos.custo }
    ].forEach(item => {
        const tr = document.createElement('tr');
        adicionarCelula(tr, item.nome);
        const valor = adicionarCelula(tr, formatarMoeda(item.valor));
        valor.style.textAlign = 'right';
        corpo.appendChild(tr);
    });
    return { resultado, completo };
}

async function processarArquivoShopee(arquivo) {
    const mensagem = document.getElementById('mensagemImportacaoShopee');
    mensagem.style.color = 'var(--texto-mutado)';
    mensagem.textContent = '⏳ Lendo e conciliando o relatório...';
    try {
        if (!window.XLSX) throw new Error('Leitor de planilhas indisponível. Atualize a página e tente novamente.');
        const workbook = XLSX.read(await arquivo.arrayBuffer(), { type: 'array', cellDates: true });
        const relatorio = analisarRelatorioShopee(workbook, arquivo.name);
        const produtos = await obterProdutosParaAnalise();
        const custos = calcularCustosRelatorio(relatorio, produtos);
        const despesasInternas = despesasPagasNoPeriodo(relatorio.inicio, relatorio.fim);
        const analise = renderizarAnaliseShopee(relatorio, custos, despesasInternas);
        try {
            const resposta = await chamarApi({
                acao: 'salvar_relatorio_shopee',
                relatorio: {
                    arquivo: relatorio.arquivo, inicio: relatorio.inicio, fim: relatorio.fim,
                    receita: relatorio.receita, taxasShopee: relatorio.taxasShopee, liberado: relatorio.liberado,
                    pedidos: relatorio.pedidos, custosIdentificados: custos.custo, despesasInternas,
                    resultado: analise.resultado, analiseCompleta: analise.completo,
                    componentes: relatorio.componentes, usuario: obterUserLogado()
                }
            });
            if (resposta.status !== 'sucesso') throw new Error(resposta.mensagem || 'Persistência indisponível.');
            mensagem.style.color = 'var(--cor-sucesso)';
            mensagem.textContent = `✅ Relatório conciliado e salvo. ${relatorio.pedidos} pedidos encontrados.`;
            await carregarRelatoriosShopee();
        } catch (_) {
            mensagem.style.color = '#f4b942';
            mensagem.textContent = `⚠️ Análise concluída para ${relatorio.pedidos} pedidos. Publique a versão 19 do backend para salvar o histórico.`;
        }
    } catch (erro) {
        mensagem.style.color = 'var(--cor-alerta)';
        mensagem.textContent = `❌ ${erro.message}`;
    }
}

async function carregarRelatoriosShopee() {
    const corpo = document.getElementById('corpoHistoricoShopee');
    try {
        const resposta = await chamarApi({ acao: 'listar_relatorios_shopee' });
        if (resposta.status !== 'sucesso' || !Array.isArray(resposta.relatorios)) throw new Error(resposta.mensagem || 'Histórico indisponível.');
        corpo.replaceChildren();
        if (!resposta.relatorios.length) {
            const tr = document.createElement('tr'); const td = adicionarCelula(tr, 'Nenhum relatório salvo.'); td.colSpan = 5; corpo.appendChild(tr); return;
        }
        resposta.relatorios.forEach(item => {
            const tr = document.createElement('tr');
            adicionarCelula(tr, `${item.inicioF} a ${item.fimF}`);
            adicionarCelula(tr, item.arquivo);
            const receita = adicionarCelula(tr, formatarMoeda(item.receita)); receita.style.textAlign = 'right';
            const liberado = adicionarCelula(tr, formatarMoeda(item.liberado)); liberado.style.textAlign = 'right';
            adicionarCelula(tr, item.importadoEmF);
            corpo.appendChild(tr);
        });
    } catch (erro) {
        corpo.replaceChildren();
        const tr = document.createElement('tr'); const td = adicionarCelula(tr, 'Publique a nova versão do backend para habilitar o histórico.'); td.colSpan = 5; corpo.appendChild(tr);
    }
}

document.getElementById('arquivoRelatorioShopee').addEventListener('change', event => {
    const arquivo = event.target.files?.[0];
    if (arquivo) processarArquivoShopee(arquivo).finally(() => { event.target.value = ''; });
});

// =======================================================
// 5. CALCULADORA DE PRECIFICAÇÃO (REGRAS SHOPEE)
// =======================================================
let parametrosSistema = { prazoProducao: 5, taxaLink: 4.99, taxaShopee: 14, taxaShopeeBaixa: 20, taxaFixaCpf: 3, categoriasDespesa: [] };

async function salvarPrazoProducaoRapido(dias) {
    const prazo = Math.max(1, Math.min(365, Number(dias) || 5));
    const parametros = { ...parametrosSistema, prazoProducao: prazo, usuario: obterUserLogado() };
    const resultado = await chamarApi({ acao: 'salvar_parametros', parametros });
    if (resultado.status !== 'sucesso') throw new Error(resultado.mensagem || 'Não foi possível salvar o prazo de produção.');
    parametrosSistema = { ...parametrosSistema, ...(resultado.parametros || parametros), prazoProducao: prazo };
    const campoParametros = document.getElementById('paramPrazoProducao');
    if (campoParametros) campoParametros.value = prazo;
    if (typeof atualizarPrazoProducao === 'function') atualizarPrazoProducao(prazo);
    return prazo;
}
window.salvarPrazoProducaoRapido = salvarPrazoProducaoRapido;

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
        const prazoPainel = document.getElementById('ppPrazoProducao');
        if (prazoPainel) prazoPainel.value = parametrosSistema.prazoProducao;
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

let plataformasPrecificacao = [];
let catalogoPrecificacao = [];
let importacaoPrecificacaoPendente = [];

function numeroCampoPrecificacao(id) {
    return Number(limparMoedaParaEnvio(document.getElementById(id).value)) || 0;
}

function plataformaSelecionada() {
    return plataformasPrecificacao.find(item => item.id === document.getElementById('calcCanal').value) || null;
}

function atualizarVisibilidadeRegraShopee() {
    const plataforma = plataformaSelecionada();
    const shopee = plataforma?.tipo === 'shopee_faixas';
    document.getElementById('boxShopee').style.display = shopee ? 'block' : 'none';
    calcularPrecificacao();
}

function calcularPrecificacao() {
    const matVal = numeroCampoPrecificacao('calcCustoMaterial');
    const extVal = numeroCampoPrecificacao('calcCustoExtra');
    const margem = Number(document.getElementById('calcMargem').value) || 0;
    const custoTotal = matVal + extVal;
    const lucroBruto = custoTotal * (margem / 100);
    const alvo = custoTotal + lucroBruto;
    const plataforma = plataformaSelecionada();
    let precoSugerido = alvo;
    let valorTaxa = 0;
    if (plataforma) {
        const pagamento = Number(plataforma.pagamento || 0);
        const outras = Number(plataforma.outras || 0);
        if (plataforma.tipo === 'shopee_faixas') {
            const adicionalCpf = document.getElementById('calcShopeeTipo').value === 'cpf' ? Number(plataforma.adicionalCpf || 0) : 0;
            const faixas = [
                { minimo: 0, maximo: 79.99, percentual: Number(plataforma.comissaoBaixa || 0), fixa: Number(plataforma.fixa79 || 0) },
                { minimo: 80, maximo: 99.99, percentual: Number(plataforma.comissao || 0), fixa: Number(plataforma.fixa99 || 0) },
                { minimo: 100, maximo: 199.99, percentual: Number(plataforma.comissao || 0), fixa: Number(plataforma.fixa199 || 0) },
                { minimo: 200, maximo: Infinity, percentual: Number(plataforma.comissao || 0), fixa: Number(plataforma.fixa499 || 0) }
            ];
            const candidatos = faixas.map(faixa => {
                const taxaPercentual = (faixa.percentual + pagamento + outras) / 100;
                return { ...faixa, preco: taxaPercentual < 1 ? (alvo + faixa.fixa + adicionalCpf) / (1 - taxaPercentual) : 0, taxaPercentual };
            });
            const escolhida = candidatos.find(faixa => faixa.preco >= faixa.minimo && faixa.preco <= faixa.maximo) || candidatos[candidatos.length - 1];
            precoSugerido = escolhida.preco;
            valorTaxa = precoSugerido * escolhida.taxaPercentual + escolhida.fixa + adicionalCpf;
        } else {
            const percentual = (Number(plataforma.comissao || 0) + pagamento + outras) / 100;
            const fixa = Number(plataforma.taxaFixa || 0);
            precoSugerido = percentual < 1 ? (alvo + fixa) / (1 - percentual) : 0;
            valorTaxa = precoSugerido * percentual + fixa;
        }
    }

    const lucroLiquido = precoSugerido - custoTotal - valorTaxa;

    document.getElementById('calcPrecoFinal').innerText = formatarMoeda(precoSugerido);
    document.getElementById('calcCustoTotalOut').innerText = formatarMoeda(custoTotal);
    document.getElementById('calcTaxaOut').innerText = formatarMoeda(valorTaxa);
    document.getElementById('calcLucroOut').innerText = formatarMoeda(lucroLiquido);
}

['calcCustoMaterial', 'calcCustoExtra', 'calcMargem', 'calcShopeeTipo'].forEach(id => {
    document.getElementById(id).addEventListener('input', calcularPrecificacao);
});
document.getElementById('calcCanal').addEventListener('change', atualizarVisibilidadeRegraShopee);

document.getElementById('btnLimparCalc').addEventListener('click', () => {
    document.getElementById('formPrecificacao').reset();
    document.getElementById('calcPrecoCatalogo').value = '';
    document.getElementById('calcPrecoAtual').textContent = '';
    atualizarVisibilidadeRegraShopee();
    calcularPrecificacao(); 
});

function preencherSeletoresPlataforma() {
    const ids = ['calcCanal', 'catalogoPlataforma'];
    ids.forEach(id => {
        const select = document.getElementById(id);
        const anterior = select.value;
        select.replaceChildren();
        plataformasPrecificacao.forEach(item => {
            const option = document.createElement('option'); option.value = item.id; option.textContent = item.nome; select.appendChild(option);
        });
        if (plataformasPrecificacao.some(item => item.id === anterior)) select.value = anterior;
    });
    const filtro = document.getElementById('filtroPlataformaCatalogo');
    const filtroAnterior = filtro.value;
    filtro.replaceChildren();
    const todas = document.createElement('option'); todas.value = ''; todas.textContent = 'Todas as plataformas'; filtro.appendChild(todas);
    plataformasPrecificacao.forEach(item => { const op = document.createElement('option'); op.value = item.id; op.textContent = item.nome; filtro.appendChild(op); });
    filtro.value = plataformasPrecificacao.some(item => item.id === filtroAnterior) ? filtroAnterior : '';
}

function renderizarPlataformasPreco() {
    const lista = document.getElementById('listaPlataformasPreco');
    lista.replaceChildren();
    plataformasPrecificacao.forEach(item => {
        const card = document.createElement('button');
        card.type = 'button'; card.className = 'plataforma-preco-card';
        const titulo = document.createElement('strong'); titulo.textContent = item.nome;
        const regra = document.createElement('small'); regra.textContent = item.tipo === 'shopee_faixas' ? 'Faixas progressivas Shopee' : `${Number(item.comissao || 0).toLocaleString('pt-BR')}% + ${formatarMoeda(item.taxaFixa || 0)}`;
        card.append(titulo, regra);
        card.addEventListener('click', () => editarPlataformaPreco(item.id));
        lista.appendChild(card);
    });
}

function preencherCatalogoNoCalculo() {
    const select = document.getElementById('calcPrecoCatalogo');
    const anterior = select.value;
    select.replaceChildren();
    const vazio = document.createElement('option'); vazio.value = ''; vazio.textContent = 'Selecione um preço importado...'; select.appendChild(vazio);
    catalogoPrecificacao.forEach(item => {
        const option = document.createElement('option'); option.value = item.id; option.textContent = `${item.produto} · ${item.plataformaNome}/${item.perfil}`; select.appendChild(option);
    });
    if (catalogoPrecificacao.some(item => item.id === anterior)) select.value = anterior;
}

function renderizarCatalogoPreco() {
    const corpo = document.getElementById('corpoCatalogoPreco');
    const termo = normalizarTextoFinanceiro(document.getElementById('pesquisaCatalogoPreco').value);
    const plataforma = document.getElementById('filtroPlataformaCatalogo').value;
    const itens = catalogoPrecificacao.filter(item => (!plataforma || item.plataformaId === plataforma) && (!termo || normalizarTextoFinanceiro(`${item.produto} ${item.sku} ${item.plataformaNome} ${item.perfil}`).includes(termo)));
    corpo.replaceChildren();
    if (!itens.length) { const tr = document.createElement('tr'); const td = adicionarCelula(tr, 'Nenhum preço encontrado.'); td.colSpan = 6; corpo.appendChild(tr); return; }
    itens.forEach(item => {
        const tr = document.createElement('tr');
        const nome = adicionarCelula(tr, item.produto); if (item.sku) { const sku = document.createElement('small'); sku.textContent = `SKU ${item.sku}`; sku.style.display = 'block'; nome.appendChild(sku); }
        adicionarCelula(tr, `${item.plataformaNome} / ${item.perfil}`);
        let td = adicionarCelula(tr, formatarMoeda(item.custoTotal)); td.style.textAlign = 'right';
        td = adicionarCelula(tr, formatarMoeda(item.precoBase)); td.style.textAlign = 'right';
        td = adicionarCelula(tr, item.precoPromocional ? formatarMoeda(item.precoPromocional) : '—'); td.style.textAlign = 'right';
        const acoes = adicionarCelula(tr, ''); acoes.style.textAlign = 'center';
        acoes.appendChild(criarBotaoAcao('✏️', 'Editar preço', '#6c5ce7', () => editarPrecoCatalogo(item.id)));
        acoes.appendChild(criarBotaoAcao('🗑️', 'Excluir preço', 'var(--cor-alerta)', () => excluirPrecoCatalogo(item.id)));
        corpo.appendChild(tr);
    });
}

async function carregarCentralPrecificacao() {
    const mensagem = document.getElementById('mensagemImportacaoPrecificacao');
    mensagem.textContent = '⏳ Carregando catálogo e taxas...';
    try {
        const [produtos, plataformas, catalogo] = await Promise.all([
            carregarProdutos(),
            chamarApi({ acao: 'listar_plataformas_precificacao' }),
            chamarApi({ acao: 'listar_catalogo_precificacao' })
        ]);
        if (plataformas.status !== 'sucesso' || catalogo.status !== 'sucesso') throw new Error('Publique o backend atualizado para ativar a central de preços.');
        plataformasPrecificacao = plataformas.plataformas || [];
        catalogoPrecificacao = catalogo.catalogo || [];
        preencherSeletoresPlataforma(); preencherCatalogoNoCalculo(); renderizarCatalogoPreco(); renderizarPlataformasPreco();
        const shopee = plataformasPrecificacao.find(item => item.tipo === 'shopee_faixas');
        if (shopee) document.getElementById('calcCanal').value = shopee.id;
        editarPlataformaPreco(shopee?.id || plataformasPrecificacao[0]?.id, false);
        atualizarVisibilidadeRegraShopee();
        mensagem.textContent = '';
        return produtos;
    } catch (erro) {
        mensagem.style.color = 'var(--cor-alerta)'; mensagem.textContent = `❌ ${erro.message}`;
    }
}

document.getElementById('calcPrecoCatalogo').addEventListener('change', () => {
    const item = catalogoPrecificacao.find(registro => registro.id === document.getElementById('calcPrecoCatalogo').value);
    if (!item) { document.getElementById('calcPrecoAtual').textContent = ''; return; }
    document.getElementById('calcCustoMaterial').value = Number(item.custoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('calcCustoExtra').value = '0,00';
    document.getElementById('calcCanal').value = item.plataformaId;
    document.getElementById('calcShopeeTipo').value = item.perfil === 'CPF' ? 'cpf' : 'cnpj';
    const plataforma = plataformaSelecionada();
    const taxa = calcularTaxaSobrePreco(item.precoBase, plataforma, item.perfil);
    const lucro = item.precoBase - item.custoTotal - taxa;
    document.getElementById('calcMargem').value = item.custoTotal > 0 ? ((lucro / item.custoTotal) * 100).toFixed(2) : 0;
    document.getElementById('calcPrecoAtual').textContent = `Preço atual no catálogo: ${formatarMoeda(item.precoBase)}${item.precoPromocional ? ` · promocional ${formatarMoeda(item.precoPromocional)}` : ''}`;
    atualizarVisibilidadeRegraShopee();
});

function calcularTaxaSobrePreco(preco, plataforma, perfil) {
    if (!plataforma) return 0;
    const extras = (Number(plataforma.pagamento || 0) + Number(plataforma.outras || 0)) / 100;
    if (plataforma.tipo !== 'shopee_faixas') return preco * ((Number(plataforma.comissao || 0) / 100) + extras) + Number(plataforma.taxaFixa || 0);
    const percentual = preco < 80 ? Number(plataforma.comissaoBaixa || 0) : Number(plataforma.comissao || 0);
    const fixa = preco < 80 ? plataforma.fixa79 : preco < 100 ? plataforma.fixa99 : preco < 200 ? plataforma.fixa199 : plataforma.fixa499;
    return preco * ((percentual / 100) + extras) + Number(fixa || 0) + (perfil === 'CPF' ? Number(plataforma.adicionalCpf || 0) : 0);
}

function limparFormularioCatalogo() {
    document.getElementById('formPrecoCatalogo').reset();
    document.getElementById('catalogoId').value = '';
    document.getElementById('catalogoQuantidade').value = 1;
    document.getElementById('formPrecoCatalogo').hidden = true;
}

document.getElementById('btnNovoPrecoCatalogo').addEventListener('click', () => { limparFormularioCatalogo(); document.getElementById('formPrecoCatalogo').hidden = false; document.getElementById('catalogoProduto').focus(); });
document.getElementById('btnCancelarPrecoCatalogo').addEventListener('click', limparFormularioCatalogo);
['catalogoCustoUnitario', 'catalogoPrecoBase', 'catalogoPrecoPromocional'].forEach(id => document.getElementById(id).addEventListener('input', aplicarMascaraMoeda));

function editarPrecoCatalogo(id) {
    const item = catalogoPrecificacao.find(registro => registro.id === id); if (!item) return;
    document.getElementById('catalogoId').value = item.id; document.getElementById('catalogoSku').value = item.sku; document.getElementById('catalogoProduto').value = item.produto;
    document.getElementById('catalogoQuantidade').value = item.quantidade; document.getElementById('catalogoCustoUnitario').value = Number(item.custoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('catalogoPlataforma').value = item.plataformaId; document.getElementById('catalogoPerfil').value = item.perfil;
    document.getElementById('catalogoPrecoBase').value = Number(item.precoBase).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); document.getElementById('catalogoPrecoPromocional').value = item.precoPromocional ? Number(item.precoPromocional).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
    document.getElementById('formPrecoCatalogo').hidden = false; document.getElementById('catalogoProduto').focus();
}

document.getElementById('formPrecoCatalogo').addEventListener('submit', async evento => {
    evento.preventDefault();
    const item = { id: document.getElementById('catalogoId').value, sku: document.getElementById('catalogoSku').value.trim(), produto: document.getElementById('catalogoProduto').value.trim(), quantidade: Number(document.getElementById('catalogoQuantidade').value) || 1, custoUnitario: numeroCampoPrecificacao('catalogoCustoUnitario'), plataformaId: document.getElementById('catalogoPlataforma').value, perfil: document.getElementById('catalogoPerfil').value, precoBase: numeroCampoPrecificacao('catalogoPrecoBase'), precoPromocional: numeroCampoPrecificacao('catalogoPrecoPromocional'), origem: 'Cadastro manual', usuario: obterUserLogado() };
    try {
        const resposta = await chamarApi({ acao: item.id ? 'editar_preco_catalogo' : 'salvar_preco_catalogo', item });
        if (resposta.status !== 'sucesso') throw new Error(resposta.mensagem);
        limparFormularioCatalogo(); await carregarCatalogoPrecificacao();
    } catch (erro) { alert(`Erro: ${erro.message}`); }
});

async function excluirPrecoCatalogo(id) {
    if (!confirm('Excluir este preço do catálogo?')) return;
    const resposta = await chamarApi({ acao: 'excluir_preco_catalogo', id, usuario: obterUserLogado() });
    if (resposta.status !== 'sucesso') return alert(resposta.mensagem || 'Não foi possível excluir.');
    await carregarCatalogoPrecificacao();
}

async function carregarCatalogoPrecificacao() {
    const resposta = await chamarApi({ acao: 'listar_catalogo_precificacao' });
    if (resposta.status !== 'sucesso') throw new Error(resposta.mensagem);
    catalogoPrecificacao = resposta.catalogo || []; preencherCatalogoNoCalculo(); renderizarCatalogoPreco();
}

document.getElementById('pesquisaCatalogoPreco').addEventListener('input', renderizarCatalogoPreco);
document.getElementById('filtroPlataformaCatalogo').addEventListener('change', renderizarCatalogoPreco);

function limparFormularioPlataforma() {
    document.getElementById('formPlataformaPreco').reset(); document.getElementById('plataformaId').value = ''; document.getElementById('plataformaTipo').value = 'percentual'; atualizarCamposFaixas();
}
function atualizarCamposFaixas() { document.getElementById('camposFaixasShopee').hidden = document.getElementById('plataformaTipo').value !== 'shopee_faixas'; }
document.getElementById('plataformaTipo').addEventListener('change', atualizarCamposFaixas);
document.getElementById('btnNovaPlataformaPreco').addEventListener('click', () => { limparFormularioPlataforma(); document.getElementById('plataformaNome').focus(); });
document.getElementById('btnCancelarPlataformaPreco').addEventListener('click', limparFormularioPlataforma);

function editarPlataformaPreco(id, focar = true) {
    const item = plataformasPrecificacao.find(registro => registro.id === id); if (!item) return limparFormularioPlataforma();
    const campos = { plataformaId: item.id, plataformaNome: item.nome, plataformaTipo: item.tipo, plataformaComissao: item.comissao, plataformaTaxaFixa: item.taxaFixa, plataformaPagamento: item.pagamento, plataformaOutras: item.outras, plataformaComissaoBaixa: item.comissaoBaixa, plataformaFixa79: item.fixa79, plataformaFixa99: item.fixa99, plataformaFixa199: item.fixa199, plataformaFixa499: item.fixa499, plataformaAdicionalCpf: item.adicionalCpf };
    Object.entries(campos).forEach(([idCampo, valor]) => { document.getElementById(idCampo).value = valor ?? 0; });
    atualizarCamposFaixas(); if (focar) document.getElementById('plataformaNome').focus();
}

document.getElementById('formPlataformaPreco').addEventListener('submit', async evento => {
    evento.preventDefault();
    const plataforma = { id: document.getElementById('plataformaId').value, nome: document.getElementById('plataformaNome').value.trim(), tipo: document.getElementById('plataformaTipo').value, comissao: Number(document.getElementById('plataformaComissao').value) || 0, taxaFixa: Number(document.getElementById('plataformaTaxaFixa').value) || 0, pagamento: Number(document.getElementById('plataformaPagamento').value) || 0, outras: Number(document.getElementById('plataformaOutras').value) || 0, comissaoBaixa: Number(document.getElementById('plataformaComissaoBaixa').value) || 0, fixa79: Number(document.getElementById('plataformaFixa79').value) || 0, fixa99: Number(document.getElementById('plataformaFixa99').value) || 0, fixa199: Number(document.getElementById('plataformaFixa199').value) || 0, fixa499: Number(document.getElementById('plataformaFixa499').value) || 0, adicionalCpf: Number(document.getElementById('plataformaAdicionalCpf').value) || 0, usuario: obterUserLogado() };
    const mensagem = document.getElementById('mensagemPlataformaPreco'); mensagem.textContent = '⏳ Salvando...';
    try {
        const resposta = await chamarApi({ acao: 'salvar_plataforma_precificacao', plataforma });
        if (resposta.status !== 'sucesso') throw new Error(resposta.mensagem);
        plataformasPrecificacao = resposta.plataformas || []; preencherSeletoresPlataforma(); renderizarPlataformasPreco(); mensagem.style.color = 'var(--cor-sucesso)'; mensagem.textContent = '✅ Plataforma e taxas atualizadas.';
        document.getElementById('calcCanal').value = resposta.id; atualizarVisibilidadeRegraShopee();
    } catch (erro) { mensagem.style.color = 'var(--cor-alerta)'; mensagem.textContent = `❌ ${erro.message}`; }
});

function extrairCatalogoDaPlanilha(workbook, nomeArquivo) {
    const perfil = normalizarTextoFinanceiro(nomeArquivo).includes('cnpj') ? 'CNPJ' : normalizarTextoFinanceiro(nomeArquivo).includes('cpf') ? 'CPF' : 'GERAL';
    const shopee = plataformasPrecificacao.find(item => item.tipo === 'shopee_faixas');
    if (!shopee) throw new Error('Cadastre uma plataforma com regra de faixas Shopee antes de importar.');
    const itens = [];
    workbook.SheetNames.forEach(nomeAba => {
        if (normalizarTextoFinanceiro(nomeAba).includes('materiais e insumos')) return;
        const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[nomeAba], { header: 1, raw: true, defval: '' });
        const linhaCabecalho = linhas.findIndex(linha => linha.some(celula => normalizarTextoFinanceiro(celula) === 'produto'));
        if (linhaCabecalho < 0) return;
        const cabecalho = linhas[linhaCabecalho].map(normalizarTextoFinanceiro);
        const indice = (...titulos) => titulos.map(normalizarTextoFinanceiro).map(titulo => cabecalho.indexOf(titulo)).find(posicao => posicao >= 0) ?? -1;
        const col = { sku: indice('SKU (OPCIONAL)', 'SKU'), produto: indice('Produto', 'Nome do Produto'), qtd: indice('qtd kit', 'Quantidade'), custoUnit: indice('custo material por unid', 'Custo por unidade'), custoTotal: indice('Custo total'), preco: indice('Preço venda', 'Preço base'), promocional: indice('Preço promocional') };
        linhas.slice(linhaCabecalho + 1).forEach(linha => {
            const produto = String(linha[col.produto] || '').trim(); if (!produto) return;
            const quantidade = Math.max(1, Math.floor(numeroFinanceiro(linha[col.qtd]) || 1));
            const custoUnitario = numeroFinanceiro(linha[col.custoUnit]);
            const custoTotal = col.custoTotal >= 0 ? numeroFinanceiro(linha[col.custoTotal]) : custoUnitario * quantidade;
            const precoBase = numeroFinanceiro(linha[col.preco]);
            if (!precoBase || (!custoUnitario && !custoTotal)) return;
            itens.push({ sku: col.sku >= 0 ? String(linha[col.sku] || '').trim() : '', produto, quantidade, custoUnitario: custoUnitario || custoTotal / quantidade, plataformaId: shopee.id, perfil, precoBase, precoPromocional: col.promocional >= 0 ? numeroFinanceiro(linha[col.promocional]) : 0, origem: nomeArquivo, usuario: obterUserLogado() });
        });
    });
    return itens;
}

document.getElementById('arquivoPrecificacao').addEventListener('change', async evento => {
    const arquivo = evento.target.files?.[0]; if (!arquivo) return;
    const mensagem = document.getElementById('mensagemImportacaoPrecificacao');
    try {
        mensagem.textContent = '⏳ Analisando arquivo...';
        const workbook = XLSX.read(await arquivo.arrayBuffer(), { type: 'array', cellDates: true });
        importacaoPrecificacaoPendente = extrairCatalogoDaPlanilha(workbook, arquivo.name);
        if (!importacaoPrecificacaoPendente.length) throw new Error('Nenhum produto válido foi encontrado. Confira os títulos Produto, Custo e Preço venda.');
        document.getElementById('resumoPreviewPrecificacao').textContent = `${importacaoPrecificacaoPendente.length} produto(s)/preço(s) encontrados`;
        document.getElementById('previewImportacaoPrecificacao').hidden = false;
        mensagem.style.color = 'var(--texto-mutado)'; mensagem.textContent = `Arquivo ${arquivo.name} pronto para importação.`;
    } catch (erro) { importacaoPrecificacaoPendente = []; mensagem.style.color = 'var(--cor-alerta)'; mensagem.textContent = `❌ ${erro.message}`; }
    finally { evento.target.value = ''; }
});

function cancelarImportacaoPrecificacao() { importacaoPrecificacaoPendente = []; document.getElementById('previewImportacaoPrecificacao').hidden = true; }
document.getElementById('btnCancelarImportacaoPrecificacao').addEventListener('click', cancelarImportacaoPrecificacao);
document.getElementById('btnConfirmarImportacaoPrecificacao').addEventListener('click', async () => {
    if (!importacaoPrecificacaoPendente.length) return;
    const btn = document.getElementById('btnConfirmarImportacaoPrecificacao'); const mensagem = document.getElementById('mensagemImportacaoPrecificacao'); btn.disabled = true;
    try {
        const resposta = await chamarApi({ acao: 'importar_catalogo_precificacao', itens: importacaoPrecificacaoPendente, usuario: obterUserLogado() });
        if (resposta.status !== 'sucesso') throw new Error(resposta.mensagem);
        mensagem.style.color = 'var(--cor-sucesso)'; mensagem.textContent = `✅ ${resposta.inseridos} inserido(s) e ${resposta.atualizados} atualizado(s).`;
        cancelarImportacaoPrecificacao(); await carregarCatalogoPrecificacao();
    } catch (erro) { mensagem.style.color = 'var(--cor-alerta)'; mensagem.textContent = `❌ ${erro.message}`; }
    finally { btn.disabled = false; }
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
