const URL_API = "https://script.google.com/macros/s/AKfycbxo0HmHlzJklmZ8jM987fSb9ijS6XtaH-otVAZaaGfQbm22Tdgtx7moFdoYDRF5e9E4/exec";

const telaLogin = document.getElementById('tela-login');
const appContainer = document.getElementById('app-container');
const nomeUsuarioLogado = document.getElementById('nomeUsuarioLogado');
const textoBoasVindas = document.getElementById('textoBoasVindas');

// =======================================================
// MÓDULO NOVO: ATUALIZAR DASHBOARD FINANCEIRO
// =======================================================
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

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
            
            // Muda a cor do saldo dinamicamente (Vermelho se negativo, Roxo se positivo)
            if (resultado.saldo < 0) { txtSaldo.style.color = "var(--cor-alerta)"; } 
            else { txtSaldo.style.color = "var(--cor-destaque)"; }
        }
    } catch (error) {
        document.querySelector('.valor.saldo').innerText = "Erro ao carregar";
    }
}

// =======================================================
// 1. VERIFICAÇÃO DE LOGIN (sessionStorage)
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    const usuarioSalvo = sessionStorage.getItem('priPelUser');
    if (usuarioSalvo) {
        const dadosUser = JSON.parse(usuarioSalvo);
        telaLogin.style.display = 'none';
        appContainer.style.display = 'flex';
        nomeUsuarioLogado.innerText = dadosUser.nome;
        textoBoasVindas.innerText = `Olá, ${dadosUser.nome.split(" ")[0]}! Aqui está o resumo.`;
        carregarDashboard(); // <-- Carrega os números assim que abre o site
    }
});

function obterUserLogado() {
    const usuarioSalvo = sessionStorage.getItem('priPelUser');
    return usuarioSalvo ? JSON.parse(usuarioSalvo).login : "Desconhecido";
}

// =======================================================
// 2. ÁREA DE LOGIN (NAVEGAÇÃO E VALIDAÇÃO)
// =======================================================
const boxesLogin = { login: document.getElementById('box-login'), cad: document.getElementById('box-cadastro'), senha: document.getElementById('box-senha'), voltar: document.getElementById('link-voltar'), cadastrar: document.getElementById('link-cadastrar'), alterar: document.getElementById('link-alterar'), statusBox: document.getElementById('statusLogin') };
function exibirBox(alvo) { boxesLogin.statusBox.style.display = 'none'; boxesLogin.login.style.display = alvo === 'login' ? 'block' : 'none'; boxesLogin.cad.style.display = alvo === 'cad' ? 'block' : 'none'; boxesLogin.senha.style.display = alvo === 'senha' ? 'block' : 'none'; boxesLogin.voltar.style.display = alvo === 'login' ? 'none' : 'block'; boxesLogin.cadastrar.style.display = alvo === 'login' ? 'block' : 'none'; boxesLogin.alterar.style.display = alvo === 'login' ? 'block' : 'none'; }
document.getElementById('link-cadastrar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('cad'); }); document.getElementById('link-alterar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('senha'); }); document.getElementById('link-voltar').addEventListener('click', (e) => { e.preventDefault(); exibirBox('login'); });
window.toggleSenha = function(inputId, btn) { const input = document.getElementById(inputId); if (input.type === 'password') { input.type = 'text'; btn.innerText = '🙈'; } else { input.type = 'password'; btn.innerText = '👁️'; } };

const cadSenha = document.getElementById('cadSenha'); const cadSenhaConfirma = document.getElementById('cadSenhaConfirma'); const msgSenhaMatch = document.getElementById('msgSenhaMatch'); const btnSalvarCad = document.getElementById('btnSalvarCad');
function validarSenhas() { const s1 = cadSenha.value; const s2 = cadSenhaConfirma.value; if (s1 === '' || s2 === '') { msgSenhaMatch.innerText = ''; btnSalvarCad.disabled = true; return; } if (s1.length < 8 || s1.length > 12) { msgSenhaMatch.innerText = '❌ A senha deve ter entre 8 e 12 caracteres!'; msgSenhaMatch.style.color = 'var(--cor-alerta)'; btnSalvarCad.disabled = true; return; } if (s1 === s2) { msgSenhaMatch.innerText = '✅ Senhas válidas e iguais!'; msgSenhaMatch.style.color = 'var(--cor-sucesso)'; btnSalvarCad.disabled = false; } else { msgSenhaMatch.innerText = '❌ As senhas não coincidem!'; msgSenhaMatch.style.color = 'var(--cor-alerta)'; btnSalvarCad.disabled = true; } } cadSenha.addEventListener('input', validarSenhas); cadSenhaConfirma.addEventListener('input', validarSenhas);
const novaSenha = document.getElementById('novaSenha'); const novaSenhaConfirma = document.getElementById('novaSenhaConfirma'); const msgTrocaSenhaMatch = document.getElementById('msgTrocaSenhaMatch'); const btnSalvarSenha = document.getElementById('btnSalvarSenha');
function validarTrocaSenhas() { const s1 = novaSenha.value; const s2 = novaSenhaConfirma.value; if (s1 === '' || s2 === '') { msgTrocaSenhaMatch.innerText = ''; btnSalvarSenha.disabled = true; return; } if (s1.length < 8 || s1.length > 12) { msgTrocaSenhaMatch.innerText = '❌ A senha deve ter entre 8 e 12 caracteres!'; msgTrocaSenhaMatch.style.color = 'var(--cor-alerta)'; btnSalvarSenha.disabled = true; return; } if (s1 === s2) { msgTrocaSenhaMatch.innerText = '✅ Senhas válidas e iguais!'; msgTrocaSenhaMatch.style.color = 'var(--cor-sucesso)'; btnSalvarSenha.disabled = false; } else { msgTrocaSenhaMatch.innerText = '❌ As senhas não coincidem!'; msgTrocaSenhaMatch.style.color = 'var(--cor-alerta)'; btnSalvarSenha.disabled = true; } } novaSenha.addEventListener('input', validarTrocaSenhas); novaSenhaConfirma.addEventListener('input', validarTrocaSenhas);

// ==========================================================
// 3. REQUISIÇÕES AO BANCO DE DADOS (GOOGLE SHEETS)
// ==========================================================
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = document.getElementById('btnEntrar'); btn.disabled = true; boxesLogin.statusBox.style.display = 'block'; boxesLogin.statusBox.style.color = "#FFD700"; boxesLogin.statusBox.innerText = "⏳ Conectando..."; const userDigitado = document.getElementById('loginUser').value.trim();
    try { const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "login", usuario: userDigitado, senha: document.getElementById('loginSenha').value }) }); const resultado = await response.json();
        if (resultado.status === "sucesso") { boxesLogin.statusBox.style.color = "#00C853"; boxesLogin.statusBox.innerText = "✅ Acesso Liberado!"; sessionStorage.setItem('priPelUser', JSON.stringify({ nome: resultado.nomeCompleto, login: userDigitado })); setTimeout(() => { telaLogin.style.display = 'none'; appContainer.style.display = 'flex'; nomeUsuarioLogado.innerText = resultado.nomeCompleto; textoBoasVindas.innerText = `Olá, ${resultado.nomeCompleto.split(" ")[0]}! Aqui está o resumo.`; document.getElementById('formLogin').reset(); boxesLogin.statusBox.style.display = 'none'; carregarDashboard(); }, 1000); } 
        else if (resultado.status === "expirada") { boxesLogin.statusBox.style.color = "#FF3D00"; boxesLogin.statusBox.innerText = "⚠️ " + resultado.mensagem; setTimeout(() => { exibirBox('senha'); document.getElementById('trocaUser').value = userDigitado; }, 3000); }
        else { boxesLogin.statusBox.style.color = "#FF3D00"; boxesLogin.statusBox.innerText = "❌ " + resultado.mensagem; }
    } catch (err) { boxesLogin.statusBox.style.color = "#FF3D00"; boxesLogin.statusBox.innerText = "❌ Erro de conexão."; } finally { btn.disabled = false; }
});

document.getElementById('formCadastro').addEventListener('submit', async (e) => { e.preventDefault(); const btn = document.getElementById('btnSalvarCad'); btn.disabled = true; boxesLogin.statusBox.style.display = 'block'; boxesLogin.statusBox.style.color = "#FFD700"; boxesLogin.statusBox.innerText = "⏳ Criando conta..."; try { const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "cadastrar", nome: document.getElementById('cadNome').value, usuario: document.getElementById('cadUser').value, senha: cadSenha.value }) }); const resultado = await response.json(); if (resultado.status === "sucesso") { boxesLogin.statusBox.style.color = "var(--cor-sucesso)"; boxesLogin.statusBox.innerText = "✅ Usuário criado!"; setTimeout(() => { document.getElementById('formCadastro').reset(); validarSenhas(); exibirBox('login'); }, 2000); } else { boxesLogin.statusBox.style.color = "var(--cor-alerta)"; boxesLogin.statusBox.innerText = "❌ " + resultado.mensagem; btn.disabled = false; } } catch (err) { boxesLogin.statusBox.style.color = "var(--cor-alerta)"; boxesLogin.statusBox.innerText = "❌ Erro de conexão."; btn.disabled = false; } });
document.getElementById('formTrocaSenha').addEventListener('submit', async (e) => { e.preventDefault(); const btn = document.getElementById('btnSalvarSenha'); btn.disabled = true; boxesLogin.statusBox.style.display = 'block'; boxesLogin.statusBox.style.color = "#FFD700"; boxesLogin.statusBox.innerText = "⏳ Atualizando senha..."; try { const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "alterar_senha", usuario: document.getElementById('trocaUser').value, novaSenha: novaSenha.value }) }); const resultado = await response.json(); if (resultado.status === "sucesso") { boxesLogin.statusBox.style.color = "var(--cor-sucesso)"; boxesLogin.statusBox.innerText = "✅ Senha alterada com sucesso!"; setTimeout(() => { document.getElementById('formTrocaSenha').reset(); validarTrocaSenhas(); exibirBox('login'); }, 2000); } else { boxesLogin.statusBox.style.color = "var(--cor-alerta)"; boxesLogin.statusBox.innerText = "❌ " + resultado.mensagem; btn.disabled = false; } } catch (err) { boxesLogin.statusBox.style.color = "var(--cor-alerta)"; boxesLogin.statusBox.innerText = "❌ Erro de conexão."; btn.disabled = false; } });

// ==========================================================
// 4. APP PRINCIPAL (SUB-MENUS E ENVIOS)
// ==========================================================
document.getElementById('btnSair').addEventListener('click', (e) => { e.preventDefault(); sessionStorage.removeItem('priPelUser'); appContainer.style.display = 'none'; telaLogin.style.display = 'flex'; });
document.getElementById('btnToggleMenu').addEventListener('click', () => { document.querySelector('.sidebar').classList.toggle('recolhida'); });

const menuToggles = document.querySelectorAll('.menu-toggle'); menuToggles.forEach(toggle => { toggle.addEventListener('click', (e) => { e.preventDefault(); const submenu = toggle.nextElementSibling; const seta = toggle.querySelector('.seta'); if (submenu.style.display === 'block') { submenu.style.display = 'none'; seta.classList.remove('aberta'); } else { submenu.style.display = 'block'; seta.classList.add('aberta'); } }); });

const menusApp = { dashboard: document.getElementById('menu-dashboard'), venda: document.getElementById('menu-venda'), despesa: document.getElementById('menu-despesa'), precificacao: document.getElementById('menu-precificacao'), resumo: document.getElementById('menu-resumo'), fluxo: document.getElementById('menu-fluxo'), cronograma: document.getElementById('menu-cronograma'), parametros: document.getElementById('menu-parametros'), custos: document.getElementById('menu-custos') };
const telasApp = { dashboard: document.getElementById('tela-dashboard'), venda: document.getElementById('tela-venda'), despesa: document.getElementById('tela-despesa'), precificacao: document.getElementById('tela-precificacao'), resumo: document.getElementById('tela-resumo'), fluxo: document.getElementById('tela-fluxo'), cronograma: document.getElementById('tela-cronograma'), parametros: document.getElementById('tela-parametros'), custos: document.getElementById('tela-custos') };

function trocarTelaApp(telaAtivaId) { Object.values(telasApp).forEach(t => t.style.display = 'none'); document.querySelectorAll('.sidebar nav ul li').forEach(li => li.classList.remove('active')); if (telasApp[telaAtivaId]) telasApp[telaAtivaId].style.display = 'block'; if (menusApp[telaAtivaId]) menusApp[telaAtivaId].parentElement.classList.add('active'); textoBoasVindas.style.display = (telaAtivaId === 'dashboard') ? 'block' : 'none'; }
Object.keys(menusApp).forEach(key => { if (menusApp[key]) { menusApp[key].addEventListener('click', (e) => { e.preventDefault(); trocarTelaApp(key); }); } });

document.getElementById('btnCancelarVenda').addEventListener('click', () => { document.getElementById('formVenda').reset(); });

// ==========================================================
// MÓDULO NOVO: MÁSCARA DE MOEDA (CAIXA ELETRÔNICO)
// ==========================================================
function aplicarMascaraMoeda(e) {
    let valor = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
    if (valor === '') {
        e.target.value = '';
        return;
    }
    // Divide por 100 para criar os centavos e formata
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    valor = valor.replace('.', ','); // Troca ponto por vírgula para os centavos
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); // Coloca o ponto de milhar
    e.target.value = valor;
}

// Aplica a função para formatar na hora que digita
document.getElementById('custo').addEventListener('input', aplicarMascaraMoeda);
document.getElementById('valor').addEventListener('input', aplicarMascaraMoeda);
document.getElementById('valorDespesa').addEventListener('input', aplicarMascaraMoeda);

// Função para transformar "1.500,50" em número de banco de dados (1500.50) antes de enviar
function limparMoedaParaEnvio(valorFormatado) {
    if (!valorFormatado) return "0";
    return (parseInt(valorFormatado.replace(/\D/g, ''), 10) / 100).toString();
}

// ==========================================================
// ENVIO PARA O BANCO DE DADOS (ATUALIZADO)
// ==========================================================

// VENDAS 
document.getElementById('formVenda').addEventListener('submit', async (e) => { 
    e.preventDefault(); const btn = document.getElementById('btnEnviarVenda'); const msg = document.getElementById('mensagemVenda'); btn.disabled = true; msg.style.color = "var(--texto-claro)"; msg.innerText = "Enviando..."; 
    
    // Limpa os valores em Reais para enviar para a planilha como número
    const custoLimpo = limparMoedaParaEnvio(document.getElementById('custo').value);
    const valorLimpo = limparMoedaParaEnvio(document.getElementById('valor').value);
    
    const dados = [ document.getElementById('data').value, document.getElementById('cliente').value, document.getElementById('categoriaProduto').value, document.getElementById('formaPagamento').value, custoLimpo, valorLimpo ]; 
    try { const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ planilha: "vendas", dados: dados, usuarioLogado: obterUserLogado() }) }); const resultado = await res.json(); 
    if (resultado.status === "sucesso") { msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Salvo com sucesso!"; document.getElementById('formVenda').reset(); carregarDashboard(); } else throw new Error(resultado.mensagem); } catch (err) { msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro: " + err.message; } finally { btn.disabled = false; setTimeout(() => msg.innerText = "", 4000); } 
});

// DESPESAS 
document.getElementById('formDespesa').addEventListener('submit', async (e) => { 
    e.preventDefault(); const btn = document.getElementById('btnEnviarDespesa'); const msg = document.getElementById('mensagemDespesa'); btn.disabled = true; msg.style.color = "var(--texto-claro)"; msg.innerText = "Enviando..."; 
    
    // Limpa o valor em Reais para enviar para a planilha como número
    const valorDespesaLimpo = limparMoedaParaEnvio(document.getElementById('valorDespesa').value);

    const dados = [ document.getElementById('dataDespesa').value, document.getElementById('categoriaDespesa').value, valorDespesaLimpo, document.getElementById('statusDespesa').value ]; 
    try { const res = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ planilha: "despesas", dados: dados, usuarioLogado: obterUserLogado() }) }); const resultado = await res.json(); 
    if (resultado.status === "sucesso") { msg.style.color = "var(--cor-sucesso)"; msg.innerText = "Salvo com sucesso!"; document.getElementById('formDespesa').reset(); carregarDashboard(); } else throw new Error(resultado.mensagem); } catch (err) { msg.style.color = "var(--cor-alerta)"; msg.innerText = "Erro: " + err.message; } finally { btn.disabled = false; setTimeout(() => msg.innerText = "", 4000); } 
});

// ==========================================================
// MÓDULO NOVO: CARREGAR FLUXO DE CAIXA (EXTRATO)
// ==========================================================
async function carregarFluxoCaixa() {
    const tbody = document.getElementById('corpoTabelaFluxo');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">⏳ Buscando histórico no banco de dados...</td></tr>';
    
    try {
        const response = await fetch(URL_API, { method: 'POST', body: JSON.stringify({ acao: "buscar_fluxo" }) });
        const resultado = await response.json();
        
        if (resultado.status === "sucesso") {
            tbody.innerHTML = ''; // Limpa a mensagem de carregando
            
            if (resultado.dados.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--texto-mutado);">Nenhum lançamento encontrado ainda.</td></tr>';
                return;
            }
            
            resultado.dados.forEach(item => {
                const tr = document.createElement('tr');
                const isEntrada = item.tipo === "Entrada";
                
                // Escolhe as cores e sinais (+ ou -) dependendo se é venda ou despesa
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

// Botão manual de recarregar a tabela
document.getElementById('btnAtualizarFluxo').addEventListener('click', carregarFluxoCaixa);

// O pulo do gato: Faz a tabela carregar sozinha sempre que você clica no menu "Fluxo de Caixa"
menusApp.fluxo.addEventListener('click', () => {
    carregarFluxoCaixa();
});

// ==========================================================
// MÓDULO NOVO: CALCULADORA DE PRECIFICAÇÃO
// ==========================================================

// Aplica a máscara de moeda nos novos campos de R$
document.getElementById('calcCustoMaterial').addEventListener('input', aplicarMascaraMoeda);
document.getElementById('calcCustoExtra').addEventListener('input', aplicarMascaraMoeda);

function calcularPrecificacao() {
    // Pega os valores digitados (ou zero se estiver vazio)
    const matVal = parseFloat(limparMoedaParaEnvio(document.getElementById('calcCustoMaterial').value)) || 0;
    const extVal = parseFloat(limparMoedaParaEnvio(document.getElementById('calcCustoExtra').value)) || 0;
    const margem = parseFloat(document.getElementById('calcMargem').value) || 0;
    const taxa = parseFloat(document.getElementById('calcTaxa').value) || 0;

    const custoTotal = matVal + extVal;
    
    // Cálculo: O lucro é baseado na margem sobre o custo total
    const lucroBruto = custoTotal * (margem / 100);
    let precoSugerido = 0;
    
    // Calcula o preço final embutindo a taxa do cartão para não ter prejuízo
    if (taxa < 100) {
        precoSugerido = (custoTotal + lucroBruto) / (1 - (taxa / 100));
    }

    const valorTaxa = precoSugerido * (taxa / 100);
    const lucroLiquido = precoSugerido - custoTotal - valorTaxa;

    // Atualiza a tela
    document.getElementById('calcPrecoFinal').innerText = formatarMoeda(precoSugerido);
    document.getElementById('calcCustoTotalOut').innerText = formatarMoeda(custoTotal);
    document.getElementById('calcLucroOut').innerText = formatarMoeda(lucroLiquido);
}

// Escuta tudo o que for digitado nos 4 campos e calcula na mesma hora
['calcCustoMaterial', 'calcCustoExtra', 'calcMargem', 'calcTaxa'].forEach(id => {
    document.getElementById(id).addEventListener('input', calcularPrecificacao);
});

// Botão de Limpar
document.getElementById('btnLimparCalc').addEventListener('click', () => {
    document.getElementById('formPrecificacao').reset();
    calcularPrecificacao(); // Roda a função para zerar os números da tela
});
// ==========================================================
// MÓDULO NOVO: CALCULADORA DE PRECIFICAÇÃO (REGRAS SHOPEE)
// ==========================================================

// Aplica a máscara de moeda nos campos novos
document.getElementById('calcCustoMaterial').addEventListener('input', aplicarMascaraMoeda);
document.getElementById('calcCustoExtra').addEventListener('input', aplicarMascaraMoeda);

// Alternar visual entre Shopee e Link de Pagamento
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
    
    // O Lucro é calculado sobre o Custo. Target = Custo + Lucro (O que você precisa receber limpo)
    const lucroBruto = custoTotal * (margem / 100);
    const target = custoTotal + lucroBruto; 

    let precoSugerido = 0;
    let valorTaxa = 0;

    if (canal === 'shopee') {
        const isCPF = document.getElementById('calcShopeeTipo').value === 'cpf';
        const taxaFixaCPF = isCPF ? 3 : 0;
        
        // Matemática Reversa: Testa as 4 faixas da imagem para descobrir o preço de venda (P)
        // Faixa 1 (Até 79,99): 20% + 4 + CPF
        let p1 = (target + 4 + taxaFixaCPF) / 0.80;
        
        // Faixa 2 (80 a 99,99): 14% + 16 + CPF
        let p2 = (target + 16 + taxaFixaCPF) / 0.86;
        
        // Faixa 3 (100 a 199,99): 14% + 20 + CPF
        let p3 = (target + 20 + taxaFixaCPF) / 0.86;
        
        // Faixa 4 (Acima de 200): 14% + 26 + CPF
        let p4 = (target + 26 + taxaFixaCPF) / 0.86;

        // O robô verifica qual dessas faixas é a matematicamente correta
        if (p1 < 80) { precoSugerido = p1; } 
        else if (p2 >= 80 && p2 < 100) { precoSugerido = p2; } 
        else if (p3 >= 100 && p3 < 200) { precoSugerido = p3; } 
        else { precoSugerido = p4; }

        // Recalcula o desconto da Shopee para exibir na tela
        if (precoSugerido < 80) valorTaxa = (precoSugerido * 0.20) + 4 + taxaFixaCPF;
        else if (precoSugerido < 100) valorTaxa = (precoSugerido * 0.14) + 16 + taxaFixaCPF;
        else if (precoSugerido < 200) valorTaxa = (precoSugerido * 0.14) + 20 + taxaFixaCPF;
        else valorTaxa = (precoSugerido * 0.14) + 26 + taxaFixaCPF;

    } else {
        // Regra do Link de Pagamento (Porcentagem Fixa)
        const taxaLink = parseFloat(document.getElementById('calcTaxaLink').value) || 0;
        if (taxaLink < 100) {
            precoSugerido = target / (1 - (taxaLink / 100));
        }
        valorTaxa = precoSugerido * (taxaLink / 100);
    }

    const lucroLiquido = precoSugerido - custoTotal - valorTaxa;

    // Joga os valores na tela
    document.getElementById('calcPrecoFinal').innerText = formatarMoeda(precoSugerido);
    document.getElementById('calcCustoTotalOut').innerText = formatarMoeda(custoTotal);
    document.getElementById('calcTaxaOut').innerText = formatarMoeda(valorTaxa);
    document.getElementById('calcLucroOut').innerText = formatarMoeda(lucroLiquido);
}

// Escuta os campos e calcula na mesma hora em que você digita
['calcCustoMaterial', 'calcCustoExtra', 'calcMargem', 'calcTaxaLink', 'calcShopeeTipo', 'calcCanal'].forEach(id => {
    document.getElementById(id).addEventListener('input', calcularPrecificacao);
});

// Botão de Limpar
document.getElementById('btnLimparCalc').addEventListener('click', () => {
    document.getElementById('formPrecificacao').reset();
    calcularPrecificacao(); // Zera os números
});
// Controle do Modal de Vendas
const modalVenda = document.getElementById('modalVenda');
document.getElementById('btnAbrirModalVenda').addEventListener('click', () => { modalVenda.style.display = 'block'; });
document.getElementById('btnFecharModalVenda').addEventListener('click', () => { modalVenda.style.display = 'none'; });

// Lógica de adicionar produtos à lista temporária (Step 1)
let listaProdutosVenda = [];

document.getElementById('btnAddProdutoLista').addEventListener('click', () => {
    const nome = document.getElementById('add-prod-nome').value;
    const valor = parseFloat(limparMoedaParaEnvio(document.getElementById('add-prod-valor').value)) || 0;
    const qtd = parseInt(document.getElementById('add-prod-qtd').value) || 1;

    if(nome && valor > 0) {
        listaProdutosVenda.push({ nome, valor, qtd, subtotal: valor * qtd });
        renderizarListaResumo();
        // Limpa campos
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

    listaProdutosVenda.forEach((p, index) => {
        total += p.subtotal;
        const div = document.createElement('div');
        div.innerHTML = `<span>${p.qtd}x ${p.nome}</span> <span>${formatarMoeda(p.subtotal)}</span>`;
        container.appendChild(div);
    });

    totalTxt.innerText = formatarMoeda(total);
}
