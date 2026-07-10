const URL_API = "https://script.google.com/macros/s/AKfycbxo0HmHlzJklmZ8jM987fSb9ijS6XtaH-otVAZaaGfQbm22Tdgtx7moFdoYDRF5e9E4/exec";

const telaLogin = document.getElementById('tela-login');
const appContainer = document.getElementById('app-container');
const nomeUsuarioLogado = document.getElementById('nomeUsuarioLogado');
const textoBoasVindas = document.getElementById('textoBoasVindas');

// Utilitário de formatação de Moeda
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

// =======================================================
// 1. DASHBOARD E FLUXO DE CAIXA
// =======================================================
async function carregarDashboard() {
    document.querySelector('.valor.receita').innerText = "Carregando...";
    document.querySelector('.valor.despesa').innerText = "Carregando...";
    document.querySelector('.valor.saldo').innerText = "Carregando...";

    try {
        const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "resumo_dashboard" }) });
        const resultado = await response.json();

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
        const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "buscar_fluxo" }) });
        const resultado = await response.json();
        
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
                
                tr.innerHTML = `
                    <td style="color: var(--texto-mutado);">${item.dataF}</td>
                    <td style="font-weight: 500;">${item.descricao}</td>
                    <td><span class="badge-tipo ${badgeClass}">${item.tipo}</span></td>
                    <td class="${valorClass}">${sinal}${formatarMoeda(item.valor)}</td>
                `;
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
    if (s1.length < 8 || s1.length > 12) { msgSenhaMatch.innerText = '❌ A senha deve ter entre 8 e 12 caracteres!'; msgSenhaMatch.style.color = 'var(--cor-alerta)'; btnSalvarCad.disabled = true; return; } 
    if (s1 === s2) { msgSenhaMatch.innerText = '✅ Senhas válidas e iguais!'; msgSenhaMatch.style.color = 'var(--cor-sucesso)'; btnSalvarCad.disabled = false; } 
    else { msgSenhaMatch.innerText = '❌ As senhas não coincidem!'; msgSenhaMatch.style.color = 'var(--cor-alerta)'; btnSalvarCad.disabled = true; } 
} 
document.getElementById('cadSenha').addEventListener('input', validarSenhas); 
document.getElementById('cadSenhaConfirma').addEventListener('input', validarSenhas);

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = document.getElementById('btnEntrar'); btn.disabled = true; 
    boxesLogin.statusBox.style.display = 'block'; boxesLogin.statusBox.style.color = "#FFD700"; boxesLogin.statusBox.innerText = "⏳ Conectando..."; 
    const userDigitado = document.getElementById('loginUser').value.trim();
    try { 
        const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "login", usuario: userDigitado, senha: document.getElementById('loginSenha').value }) }); 
        const resultado = await response.json();
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
    } catch (err) { boxesLogin.statusBox.style.color = "#FF3D00"; boxesLogin.statusBox.innerText = "❌ Erro de conexão."; } finally { btn.disabled = false; }
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
        const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ planilha: "vendas", dados: dados, usuarioLogado: obterUserLogado() }) }); 
        const resultado = await res.json(); 
        if (resultado.status === "sucesso") { msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Salvo com sucesso!"; document.getElementById('formVenda').reset(); carregarDashboard(); } 
        else throw new Error(resultado.mensagem); 
    } catch (err) { msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro: " + err.message; } 
    finally { btn.disabled = false; setTimeout(() => msg.innerText = "", 4000); } 
});

document.getElementById('formDespesa').addEventListener('submit', async (e) => { 
    e.preventDefault(); const btn = document.getElementById('btnEnviarDespesa'); const msg = document.getElementById('mensagemDespesa'); 
    btn.disabled = true; msg.style.color = "var(--texto-claro)"; msg.innerText = "Enviando..."; 
    
    const valorDespesaLimpo = limparMoedaParaEnvio(document.getElementById('valorDespesa').value);
    const dados = [ document.getElementById('dataDespesa').value, document.getElementById('categoriaDespesa').value, valorDespesaLimpo, document.getElementById('statusDespesa').value ]; 
    
    try { 
        const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ planilha: "despesas", dados: dados, usuarioLogado: obterUserLogado() }) }); 
        const resultado = await res.json(); 
        if (resultado.status === "sucesso") { msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Salvo com sucesso!"; document.getElementById('formDespesa').reset(); carregarDashboard(); } 
        else throw new Error(resultado.mensagem); 
    } catch (err) { msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro: " + err.message; } 
    finally { btn.disabled = false; setTimeout(() => msg.innerText = "", 4000); } 
});

// =======================================================
// 5. CALCULADORA DE PRECIFICAÇÃO (REGRAS SHOPEE)
// =======================================================
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
        const taxaFixaCPF = isCPF ? 3 : 0;
        
        let p1 = (target + 4 + taxaFixaCPF) / 0.80;
        let p2 = (target + 16 + taxaFixaCPF) / 0.86;
        let p3 = (target + 20 + taxaFixaCPF) / 0.86;
        let p4 = (target + 26 + taxaFixaCPF) / 0.86;

        if (p1 < 80) { precoSugerido = p1; } 
        else if (p2 >= 80 && p2 < 100) { precoSugerido = p2; } 
        else if (p3 >= 100 && p3 < 200) { precoSugerido = p3; } 
        else { precoSugerido = p4; }

        if (precoSugerido < 80) valorTaxa = (precoSugerido * 0.20) + 4 + taxaFixaCPF;
        else if (precoSugerido < 100) valorTaxa = (precoSugerido * 0.14) + 16 + taxaFixaCPF;
        else if (precoSugerido < 200) valorTaxa = (precoSugerido * 0.14) + 20 + taxaFixaCPF;
        else valorTaxa = (precoSugerido * 0.14) + 26 + taxaFixaCPF;
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

document.getElementById('btnAbrirModalVenda').addEventListener('click', () => { modalVenda.style.display = 'block'; });
document.getElementById('btnFecharModalVenda').addEventListener('click', () => { modalVenda.style.display = 'none'; });

document.getElementById('add-prod-valor').addEventListener('input', aplicarMascaraMoeda);

document.getElementById('btnAddProdutoLista').addEventListener('click', () => {
    const nome = document.getElementById('add-prod-nome').value;
    const valor = parseFloat(limparMoedaParaEnvio(document.getElementById('add-prod-valor').value)) || 0;
    const qtd = parseInt(document.getElementById('add-prod-qtd').value) || 1;

    if(nome && valor > 0) {
        listaProdutosVenda.push({ nome, valor, qtd, subtotal: valor * qtd });
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

    listaProdutosVenda.forEach((p) => {
        total += p.subtotal;
        const div = document.createElement('div');
        div.innerHTML = `<span>${p.qtd}x ${p.nome}</span> <span style="font-weight:bold; float:right;">${formatarMoeda(p.subtotal)}</span>`;
        container.appendChild(div);
    });

    totalTxt.innerText = formatarMoeda(total);
}
