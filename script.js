const URL_API = "https://script.google.com/macros/s/AKfycbxo0HmHlzJklmZ8jM987fSb9ijS6XtaH-otVAZaaGfQbm22Tdgtx7moFdoYDRF5e9E4/exec";

// Elementos Globais
const telaLogin = document.getElementById('tela-login');
const appContainer = document.getElementById('app-container');
const nomeUsuarioLogado = document.getElementById('nomeUsuarioLogado');
const textoBoasVindas = document.getElementById('textoBoasVindas');

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

function limparMoedaParaEnvio(valorFormatado) {
    if (!valorFormatado) return "0";
    return (parseInt(valorFormatado.replace(/\D/g, ''), 10) / 100).toString();
}

function aplicarMascaraMoeda(e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor === '') { e.target.value = ''; return; }
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    valor = valor.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    e.target.value = valor;
}

// =======================================================
// CONTROLE DE TELAS E MENUS
// =======================================================
const menusApp = { 
    dashboard: document.getElementById('menu-dashboard'), 
    venda: document.getElementById('menu-venda'), 
    despesa: document.getElementById('menu-despesa'), 
    precificacao: document.getElementById('menu-precificacao'), 
    fluxo: document.getElementById('menu-fluxo') 
};
const telasApp = { 
    dashboard: document.getElementById('tela-dashboard'), 
    venda: document.getElementById('tela-venda'), 
    despesa: document.getElementById('tela-despesa'), 
    precificacao: document.getElementById('tela-precificacao'), 
    fluxo: document.getElementById('tela-fluxo') 
};

function trocarTelaApp(telaAtivaId) {
    Object.values(telasApp).forEach(t => t.style.display = 'none');
    if (telasApp[telaAtivaId]) telasApp[telaAtivaId].style.display = 'block';
}

Object.keys(menusApp).forEach(key => {
    if (menusApp[key]) {
        menusApp[key].addEventListener('click', (e) => { e.preventDefault(); trocarTelaApp(key); });
    }
});

// Menu Toggle e Submenus
document.getElementById('btnToggleMenu').addEventListener('click', () => appContainer.classList.toggle('recolhida'));
document.querySelectorAll('.menu-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const submenu = toggle.nextElementSibling;
        submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
    });
});

// =======================================================
// MODAL DE VENDAS
// =======================================================
const modalVenda = document.getElementById('modalVenda');
let listaProdutosVenda = [];

document.getElementById('btnAbrirModalVenda').addEventListener('click', () => modalVenda.style.display = 'block');
document.getElementById('btnFecharModalVenda').addEventListener('click', () => modalVenda.style.display = 'none');
document.getElementById('btnFiltrarVendas').addEventListener('click', () => alert('Filtro em desenvolvimento!'));

// Máscara no campo do modal
document.getElementById('add-prod-valor').addEventListener('input', aplicarMascaraMoeda);

document.getElementById('btnAddProdutoLista').addEventListener('click', () => {
    const nome = document.getElementById('add-prod-nome').value;
    const valor = parseFloat(limparMoedaParaEnvio(document.getElementById('add-prod-valor').value)) || 0;
    
    if(nome && valor > 0) {
        listaProdutosVenda.push({ nome, valor });
        renderizarListaResumo();
        document.getElementById('add-prod-nome').value = '';
        document.getElementById('add-prod-valor').value = '';
    }
});

function renderizarListaResumo() {
    const container = document.getElementById('lista-produtos-resumo');
    const totalTxt = document.getElementById('venda-total-acumulado');
    container.innerHTML = '';
    let total = 0;

    listaProdutosVenda.forEach((p) => {
        total += p.valor;
        const div = document.createElement('div');
        div.style = "display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #444";
        div.innerHTML = `<span>${p.nome}</span> <span>${formatarMoeda(p.valor)}</span>`;
        container.appendChild(div);
    });
    totalTxt.innerText = formatarMoeda(total);
}

// LOGIN SIMPLES (Para teste local enquanto não conecta API)
document.getElementById('formLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    telaLogin.style.display = 'none';
    appContainer.style.display = 'flex';
    nomeUsuarioLogado.innerText = "Lucas Alencar";
});

document.getElementById('btnSair').addEventListener('click', () => location.reload());
