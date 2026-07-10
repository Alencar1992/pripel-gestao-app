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

/* ==========================================================
   PAINEL DE PEDIDOS (Kit Festa) — estilos isolados na classe
   .pp-scope, adaptados para o tema do PriPel Gestão.
   ========================================================== */
.pp-scope {
    --paper:      var(--bg-painel, #1e1e24);   /* Fundo geral com fallback caso a variável falhe */
    --paper-2:    rgba(255, 255, 255, 0.05);   /* Superfície de destaque leve */
    --ink:        var(--texto-claro, #ffffff); /* Texto principal */
    --ink-soft:   var(--texto-mutado, #a0a0b0);/* Texto secundário */
    --teal:       var(--cor-destaque, #6c5ce7);/* Cor principal/marca */
    --mustard:    #FFB300;                     /* Status "Atenção" */
    --urgent:     #FF7A45;                     /* Status "Urgente" */
    --atraso:     var(--cor-alerta, #ff4757);  /* Status "Atrasado" */
    --ok:         var(--cor-sucesso, #2ed573); /* Status "No Prazo" */
    --postado:    #4FA3E3;                     /* Status "Postado" */
    --border:     var(--borda, #2f3542);       /* Bordas globais */
    --card-bg:    var(--bg-fundo, #2f3640);    /* Fundo dos cartões */
}

.pp-scope, .pp-scope * { 
    box-sizing: border-box; 
}

.pp-scope {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    padding-bottom: 60px;
}

.pp-scope h1, .pp-scope h2, .pp-scope h3 {
    font-family: 'Fraunces', serif;
    margin: 0;
}

.pp-scope .mono { 
    font-family: 'JetBrains Mono', monospace; 
}

.pp-scope header {
    background: var(--teal);
    color: #ffffff; /* Fixado branco para garantir contraste com o fundo teal */
    padding: 28px 20px 32px;
    border-radius: 0 0 16px 16px; /* Adiciona um toque moderno no cabeçalho */
    margin-bottom: 15px;
}

.pp-scope header .wrap {
    max-width: 1000px;
    margin: 0 auto;
}

.pp-scope header h1 {
    font-size: clamp(1.5rem, 4vw, 2.1rem);
    font-weight: 700;
}

.pp-scope header p {
    margin: 6px 0 0;
    color: rgba(255, 255, 255, 0.85); /* Suaviza o texto secundário mantendo contraste */
    font-size: 0.95rem;
}

.pp-scope .upload-box {
    max-width: 1000px;
    margin: -20px auto 0;
    padding: 0 20px;
}

.pp-scope .upload-card {
    background: var(--card-bg);
    border: 1.5px dashed var(--border);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.pp-scope .upload-card label.btn, 
.pp-scope .upload-card button.btn {
    background: var(--teal);
    color: #fff;
    font-weight: 600;
    padding: 11px 18px;
    border-radius: 9px;
    cursor: pointer;
    border: none;
    font-size: 0.92rem;
    transition: all 0.2s ease;
}

.pp-scope .upload-card label.btn:hover, 
.pp-scope .upload-card button.btn:hover { 
    transform: translateY(-2px); 
    filter: brightness(1.1);
}

.pp-scope .btn-ok { 
    background: var(--ok) !important; 
    color: #fff !important; 
}

.pp-scope .upload-card input[type=file] { 
    display: none; 
}

.pp-scope .file-status {
    font-size: 0.88rem;
    color: var(--ink-soft);
}

.pp-scope .stats {
    max-width: 1000px;
    margin: 20px auto 0;
    padding: 0 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
}

.pp-scope .stat-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 16px;
    transition: transform 0.2s ease;
}

.pp-scope .stat-card:hover {
    transform: translateY(-2px);
}

.pp-scope .stat-card .num {
    font-family: 'Fraunces', serif;
    font-size: 1.8rem;
    font-weight: 700;
}

.pp-scope .stat-card .label {
    font-size: 0.78rem;
    color: var(--ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.pp-scope .stat-card.urgente .num { color: var(--urgent); }
.pp-scope .stat-card.atrasado .num { color: var(--atraso); }
.pp-scope .stat-card.ok .num { color: var(--ok); }

.pp-scope .search-row {
    max-width: 1000px;
    margin: 18px auto 0;
    padding: 0 20px;
}

.pp-scope .search-row input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    background: var(--card-bg);
    color: var(--ink);
    transition: border-color 0.2s ease;
}

.pp-scope .search-row input:focus {
    outline: none;
    border-color: var(--teal);
}

.pp-scope .orders {
    max-width: 1000px;
    margin: 18px auto 0;
    padding: 0 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 14px;
}

.pp-scope .tag {
    position: relative;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 16px 16px 22px;
    overflow: hidden;
    transition: box-shadow 0.2s ease;
}

.pp-scope .tag:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.pp-scope .tag::before {
    content: "";
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 7px;
    background: var(--status-color, var(--ok));
}

.pp-scope .tag::after {
    content: "";
    position: absolute;
    left: 10px; top: 16px;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--card-bg); /* Corrigido para não usar papel branco fixo */
    border: 1.5px solid var(--border);
}

.pp-scope .tag-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
}

.pp-scope .tag-id {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    color: var(--ink-soft);
}

.pp-scope .badge {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 3px 9px;
    border-radius: 999px;
    color: #fff;
    background: var(--status-color, var(--ok));
    white-space: nowrap;
}

.pp-scope .tag h3 {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--teal);
    line-height: 1.25;
    margin-bottom: 3px;
}

.pp-scope .tema {
    font-size: 0.78rem;
    color: var(--ink-soft);
    font-weight: 400;
    line-height: 1.35;
    margin-bottom: 10px;
}

.pp-scope .tag dl {
    margin: 0;
    display: grid;
    grid-template-columns: auto 1fr;
    row-gap: 4px;
    column-gap: 8px;
    font-size: 0.85rem;
}

.pp-scope .tag dt { color: var(--ink-soft); }
.pp-scope .tag dd { margin: 0; text-align: right; }

.pp-scope .producao-line {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed var(--border);
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.85rem;
}

.pp-scope .producao-line .dias {
    font-family: 'Fraunces', serif;
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--status-color, var(--ok));
}

.pp-scope .empty-state {
    max-width: 1000px;
    margin: 60px auto;
    padding: 0 20px;
    text-align: center;
    color: var(--ink-soft);
}

.pp-scope .empty-state h2 { 
    color: var(--ink); 
    margin-bottom: 8px; 
}

.pp-scope .status-row {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed var(--border);
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.pp-scope .status-select {
    flex: 1;
    min-width: 130px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font-family: 'Inter', sans-serif;
    font-size: 0.82rem;
    background: var(--card-bg); /* Corrigido: Agora respeita o tema escuro */
    color: var(--ink);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.pp-scope .status-select:focus {
    outline: none;
    border-color: var(--teal);
    box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.2);
}

.pp-scope .btn-editar {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--paper-2);
    color: var(--ink);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.pp-scope .btn-editar:hover { 
    background: var(--mustard); 
    color: #1e1e24; /* Contraste forte ao passar o mouse na cor mostarda */
    border-color: var(--mustard);
}

.pp-scope .info-crianca {
    margin-top: 8px;
    padding: 8px 10px;
    background: var(--paper-2);
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--ink);
    line-height: 1.5;
}

.pp-scope .info-crianca strong { color: var(--teal); }

.pp-scope .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7); /* Fundo um pouco mais escuro para melhor foco no modal */
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
}

.pp-scope .modal-overlay.aberto { display: flex; }

.pp-scope .modal-box {
    background: var(--card-bg); /* Corrigido: Agora respeita o tema escuro/claro do app */
    color: var(--ink);
    border-radius: 14px;
    padding: 22px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
}

.pp-scope .modal-box h3 {
    margin-bottom: 4px;
    font-size: 1.1rem;
    color: var(--teal);
}

.pp-scope .modal-box .modal-sub {
    font-size: 0.8rem;
    color: var(--ink-soft);
    margin-bottom: 14px;
}

.pp-scope .modal-box label {
    display: block;
    font-size: 0.78rem;
    color: var(--ink-soft);
    margin: 10px 0 4px;
}

.pp-scope .modal-box input, 
.pp-scope .modal-box textarea {
    width: 100%;
    padding: 9px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    background: var(--paper); /* Adicionado: fundo condizente com o tema */
    color: var(--ink);
    transition: border-color 0.2s ease;
}

.pp-scope .modal-box input:focus, 
.pp-scope .modal-box textarea:focus {
    outline: none;
    border-color: var(--teal);
}

.pp-scope .modal-box textarea { 
    resize: vertical; 
    min-height: 70px; 
}

.pp-scope .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 16px;
}

.pp-scope .modal-actions button {
    padding: 9px 16px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.pp-scope .btn-cancelar { 
    background: var(--paper-2); 
    color: var(--ink); 
}

.pp-scope .btn-cancelar:hover {
    background: rgba(255, 255, 255, 0.1);
}

.pp-scope .btn-salvar { 
    background: var(--mustard); 
    color: #1e1e24; /* Contraste adequado com o fundo mostarda */
}

.pp-scope .btn-salvar:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
}

@media (max-width: 480px) {
    .pp-scope .orders { 
        grid-template-columns: 1fr; 
    }
}
