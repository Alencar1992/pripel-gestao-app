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


/* ==========================================================
   painelPedidos.js
   Toda a lógica do Painel de Pedidos (Kit Festa), separada do seu
   script.js principal para não misturar os dois códigos.
   Inclua no index.html, LOGO DEPOIS de <script src="script.js"></script>:
     <script src="painelPedidos.js"></script>
   ========================================================== */

/* ==============================================================
   CONFIGURAÇÃO: nomes das colunas esperadas na planilha.
   Guardamos aqui uma "chave interna" (usada no código) e uma
   lista de possíveis nomes de coluna (para o app reconhecer a
   coluna mesmo com pequenas variações de escrita/acentuação).
   ============================================================== */
const MAPA_COLUNAS = {
  idPedido:      ["ID DO PEDIDO"],
  dataPrevista:  ["DATA PREVISTA DE ENVIO"],
  nomeProduto:   ["NOME DO PRODUTO"],
  nomeVariacao:  ["NOME DA VARIACAO", "NOME DA VARIAÇÃO"],
  quantidade:    ["QUANTIDADE"],
  numProdutos:   ["NUMERO DE PRODUTOS PEDIDOS", "NÚMERO DE PRODUTOS PEDIDOS"],
  comprador:     ["NOME DE USUARIO (COMPRADOR)", "NOME DE USUÁRIO (COMPRADOR)"],
  endereco:      ["ENDERECO DE ENTREGA", "ENDEREÇO DE ENTREGA"],
};

/* ==============================================================
   CONFIGURAÇÃO: colunas OPCIONAIS de status/edição. Só existem
   se o usuário já tiver carregado um arquivo "_atualizado.xlsx"
   baixado anteriormente pelo próprio app. Ficam separadas do
   MAPA_COLUNAS principal para não gerar aviso de "coluna não
   encontrada" no painel de diagnóstico quando o arquivo for uma
   planilha nova, sem essas colunas ainda.
   ============================================================== */
const MAPA_COLUNAS_OPCIONAIS = {
  statusSalvo:        ["STATUS DO PEDIDO"],
  nomeCriancaSalvo:    ["NOME DA CRIANÇA", "NOME DA CRIANCA"],
  idadeSalva:          ["IDADE"],
  observacoesSalvas:   ["OBSERVAÇÕES", "OBSERVACOES"],
};

const DIAS_PRODUCAO = 5; // prazo padrão: DT COMPRA + 5 dias corridos

/* ==============================================================
   [INÍCIO] normalizarTexto
   Remove acentos, remove pontuação (pontos, parênteses, hífens
   soltos etc.) e deixa em maiúsculas. Isso é importante porque
   cabeçalhos de planilha real às vezes vêm com pequenas variações
   (ex: "Dt. Compra" ou "DT  COMPRA" com espaço duplo) que, sem
   essa limpeza, quebrariam a comparação de nomes de coluna.
   ============================================================== */
function normalizarTexto(txt){
  return String(txt || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // remove acentos
    .replace(/[^\w\s]/g, " ")          // troca pontuação por espaço
    .replace(/\s+/g, " ")              // colapsa espaços duplicados
    .trim()
    .toUpperCase();
}
/* [FIM] normalizarTexto */


/* ==============================================================
   [INÍCIO] encontrarIndiceColuna
   Dado o cabeçalho da planilha (primeira linha) e uma lista de
   nomes possíveis, descobre em qual posição (índice) está a
   coluna procurada.
   ============================================================== */
function encontrarIndiceColuna(cabecalho, nomesPossiveis){
  const cabecalhoNormalizado = cabecalho.map(normalizarTexto);
  for (const nome of nomesPossiveis){
    const alvo = normalizarTexto(nome);
    const idx = cabecalhoNormalizado.findIndex(h => h === alvo || h.includes(alvo));
    if (idx !== -1) return idx;
  }
  return -1;
}
/* [FIM] encontrarIndiceColuna */


/* ==============================================================
   [INÍCIO] converterParaData
   Converte um valor vindo da planilha em um objeto Date do
   JavaScript, zerando as horas para comparar só o dia.
   Aceita: objeto Date, número de série do Excel, texto ISO
   "AAAA-MM-DD" (ex: 2026-07-03) e texto brasileiro "DD/MM/AAAA".
   Se houver hora junto (ex: "2026-07-03 10:25"), ela é ignorada.
   ============================================================== */
function converterParaData(valor){
  if (!valor) return null;

  if (valor instanceof Date){
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  // número de série do Excel (dias desde 30/12/1899)
  if (typeof valor === "number"){
    const dataBase = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return new Date(dataBase.getUTCFullYear(), dataBase.getUTCMonth(), dataBase.getUTCDate());
  }

  if (typeof valor === "string"){
    const soData = valor.trim().split(" ")[0]; // descarta a hora, se houver

    // formato ISO: AAAA-MM-DD
    let m = soData.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

    // formato brasileiro: DD/MM/AAAA
    m = soData.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }

  return null;
}
/* [FIM] converterParaData */


/* ==============================================================
   [INÍCIO] letraParaIndice
   Converte a letra de uma coluna de planilha (A, B, ..., N, ...,
   AA, AB...) para o índice numérico correspondente (A=0, B=1,
   N=13, P=15...). Usado para ler colunas pela posição exata,
   quando o nome da coluna não é confiável.
   ============================================================== */
function letraParaIndice(letra){
  let coluna = 0;
  for (let i = 0; i < letra.length; i++){
    coluna = coluna * 26 + (letra.toUpperCase().charCodeAt(i) - 64);
  }
  return coluna - 1;
}
/* [FIM] letraParaIndice */


/* ==============================================================
   [INÍCIO] pegarPorLetra
   Lê o valor de uma linha da planilha usando a letra da coluna
   (ex: "N", "P"), em vez do nome do cabeçalho.
   ============================================================== */
function pegarPorLetra(linha, letra){
  const indice = letraParaIndice(letra);
  const valor = linha[indice];
  return valor === undefined ? "" : String(valor).trim();
}
/* [FIM] pegarPorLetra */


/* ==============================================================
   [INÍCIO] calcularProgramacaoEnvio
   Regra do cliente: pega a DT COMPRA, soma 5 dias corridos, e
   calcula quantos dias restam a partir de hoje para a produção.
   Retorna a data-prazo e os dias restantes (pode ser negativo,
   o que indica pedido atrasado).
   ============================================================== */
function calcularProgramacaoEnvio(dtCompra){
  const dataCompra = converterParaData(dtCompra);
  if (!dataCompra) return { prazo: null, diasRestantes: null };

  const prazo = new Date(dataCompra);
  prazo.setDate(prazo.getDate() + DIAS_PRODUCAO);

  const hoje = new Date();
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  const diffMs = prazo - hojeSemHora;
  const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return { prazo, diasRestantes };
}
/* [FIM] calcularProgramacaoEnvio */


/* ==============================================================
   [INÍCIO] pegarTerceiraPalavra
   Separa um texto em palavras (por espaço) e devolve a 3ª delas.
   Ex: "Kit Festa Safari" -> ["Kit","Festa","Safari"] -> "Safari"
   Se o texto tiver menos de 3 palavras, devolve a última palavra
   disponível, para nunca ficar vazio à toa.
   ============================================================== */
function pegarTerceiraPalavra(texto){
  const palavras = String(texto || "").trim().split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return "";
  return palavras[2] || palavras[palavras.length - 1];
}
/* [FIM] pegarTerceiraPalavra */


/* ==============================================================
   [INÍCIO] calcularTema
   Regra do cliente: da coluna N, usamos somente a 3ª palavra
   (ex: "Kit Festa Safari" -> "Safari"). Essa palavra é somada
   com o valor da coluna P (variação curta).
   Ex: Coluna N = "Kit Festa Safari", Coluna P = "Kit 35 peças, Verde"
       => Tema = "Safari Kit 35 peças, Verde"
   ============================================================== */
function calcularTema(colunaNBruta, variacaoCurta){
  const temaCurto = pegarTerceiraPalavra(colunaNBruta);
  return [temaCurto, String(variacaoCurta || "").trim()]
    .filter(Boolean)
    .join(" ");
}
/* [FIM] calcularTema */


/* ==============================================================
   [INÍCIO] classificarStatus
   Define a cor/etiqueta de status a partir dos dias restantes
   para produção.
   ============================================================== */
function classificarStatus(diasRestantes){
  if (diasRestantes === null) return { texto: "SEM DATA", cor: "var(--ink-soft)" };
  if (diasRestantes < 0)      return { texto: "ATRASADO", cor: "var(--atraso)" };
  if (diasRestantes <= 1)     return { texto: "URGENTE",  cor: "var(--urgent)" };
  if (diasRestantes <= 3)     return { texto: "ATENÇÃO",  cor: "var(--mustard)" };
  return                            { texto: "NO PRAZO", cor: "var(--ok)" };
}
/* [FIM] classificarStatus */


/* ==============================================================
   [INÍCIO] formatarData
   Formata um objeto Date para o padrão brasileiro DD/MM/AAAA.
   ============================================================== */
function formatarData(data){
  if (!data) return "—";
  const dd = String(data.getDate()).padStart(2, "0");
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const yy = data.getFullYear();
  return `${dd}/${mm}/${yy}`;
}
/* [FIM] formatarData */


/* ==============================================================
   [INÍCIO] diagnosticarColunas
   Monta um texto simples dizendo quais colunas esperadas foram
   encontradas na planilha e quais NÃO foram. Isso ajuda a
   descobrir rapidamente se algum cabeçalho da planilha real está
   escrito diferente do esperado, sem precisar mexer no código.
   ============================================================== */
function diagnosticarColunas(indices){
  const nomesAmigaveis = {
    idPedido: "ID DO PEDIDO",
    dataPrevista: "DATA PREVISTA DE ENVIO",
    nomeProduto: "NOME DO PRODUTO",
    nomeVariacao: "NOME DA VARIAÇÃO",
    quantidade: "QUANTIDADE",
    numProdutos: "Nº PRODUTOS PEDIDOS",
    comprador: "COMPRADOR",
    endereco: "ENDEREÇO",
  };

  const naoEncontradas = Object.keys(indices)
    .filter(chave => indices[chave] === -1)
    .map(chave => nomesAmigaveis[chave] || chave);

  if (naoEncontradas.length === 0){
    return `<span style="color:var(--ok)">✓ Todas as colunas esperadas foram encontradas.</span>`;
  }
  return `<span style="color:var(--urgent)">⚠ Colunas não encontradas: ${naoEncontradas.join(", ")}
    — confira se o nome do cabeçalho na planilha bate com o esperado.</span>`;
}
/* [FIM] diagnosticarColunas */


/* ==============================================================
   CONFIGURAÇÃO: opções do status manual de cada pedido, definido
   pelo usuário do app (diferente do status de prazo, que é
   calculado automaticamente).
   ============================================================== */
const OPCOES_STATUS_PEDIDO = ["PRODUÇÃO", "EMBALAGEM", "CANCELADO", "FEITO", "POSTADO"];


/* ==============================================================
   [INÍCIO] escapeHtml
   Impede que textos digitados pelo usuário (ou vindos da
   planilha) quebrem o HTML da página ou insiram código
   indevidamente. Troca caracteres especiais por sua versão segura.
   ============================================================== */
function escapeHtml(texto){
  return String(texto ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
/* [FIM] escapeHtml */


/* ==============================================================
   [INÍCIO] armazenamento local do status e da edição de cada pedido
   Guarda no navegador (localStorage) o status escolhido e os
   dados digitados (nome da criança, idade, observações) para
   cada pedido, usando o ID do pedido como chave. Assim, essas
   informações continuam lá mesmo depois de fechar a aba — só
   somem se o usuário limpar os dados do navegador.
   ============================================================== */
function salvarStatusPedido(idPedido, statusValor){
  try{ localStorage.setItem("kitfesta_status_" + idPedido, statusValor); }
  catch(erro){ console.warn("Não foi possível salvar o status:", erro); }
}

function carregarStatusPedido(idPedido){
  try{ return localStorage.getItem("kitfesta_status_" + idPedido) || ""; }
  catch(erro){ return ""; }
}

function salvarEdicaoPedido(idPedido, dados){
  try{ localStorage.setItem("kitfesta_edicao_" + idPedido, JSON.stringify(dados)); }
  catch(erro){ console.warn("Não foi possível salvar a edição:", erro); }
}

function carregarEdicaoPedido(idPedido){
  try{
    const bruto = localStorage.getItem("kitfesta_edicao_" + idPedido);
    return bruto ? JSON.parse(bruto) : { nomeCrianca: "", idade: "", observacoes: "" };
  } catch(erro){
    return { nomeCrianca: "", idade: "", observacoes: "" };
  }
}
/* [FIM] armazenamento local do status e da edição de cada pedido */


/* ==============================================================
   [INÍCIO] sincronizarComArquivo
   Funciona como uma "rede de segurança": se o navegador ainda
   NÃO tem status/edição salvos para esse pedido (ex: é a primeira
   vez que esse computador abre o app, ou o cache foi limpo), mas
   o arquivo carregado já traz essa informação (porque é uma
   planilha "_atualizado.xlsx" salva antes pelo próprio app),
   copiamos os dados do arquivo para o navegador.
   Se o navegador JÁ tem alguma informação salva, ela é mantida
   (é considerada mais recente que o arquivo).
   ============================================================== */
function sincronizarComArquivo(idPedido, dadosDoArquivo){
  if (!idPedido) return;

  const statusJaSalvo = carregarStatusPedido(idPedido);
  if (!statusJaSalvo && dadosDoArquivo.status){
    salvarStatusPedido(idPedido, dadosDoArquivo.status);
  }

  const edicaoJaSalva = carregarEdicaoPedido(idPedido);
  const semEdicaoNoNavegador = !edicaoJaSalva.nomeCrianca && !edicaoJaSalva.idade && !edicaoJaSalva.observacoes;
  const temDadosNoArquivo = dadosDoArquivo.nomeCrianca || dadosDoArquivo.idade || dadosDoArquivo.observacoes;

  if (semEdicaoNoNavegador && temDadosNoArquivo){
    salvarEdicaoPedido(idPedido, {
      nomeCrianca: dadosDoArquivo.nomeCrianca || "",
      idade: dadosDoArquivo.idade || "",
      observacoes: dadosDoArquivo.observacoes || "",
    });
  }
}
/* [FIM] sincronizarComArquivo */


/* ==============================================================
   ESTADO GLOBAL: guarda os pedidos já processados, para permitir
   filtrar/buscar sem precisar reler o arquivo.
   ============================================================== */
let pedidosProcessados = [];

// Guarda qual pedido está sendo editado no modal no momento
let idPedidoEmEdicao = null;

// Guarda a planilha original (cabeçalho + todas as linhas, sem
// nenhum cálculo) e em qual coluna está o ID do pedido — são
// necessários para reconstruir o arquivo na hora de "Salvar".
let linhasOriginais = [];
let indicesColunasAtuais = {};
let nomeArquivoAtual = "";


/* ==============================================================
   [INÍCIO] processarPlanilha
   Recebe os dados brutos lidos do arquivo (array de arrays) e
   devolve uma lista de objetos "pedido", já com os campos
   calculados (Programação de Envio e Tema).
   ============================================================== */
function processarPlanilha(linhas){
  const cabecalho = linhas[0];

  // Descobre em qual coluna está cada informação
  const indices = {};
  for (const chave in MAPA_COLUNAS){
    indices[chave] = encontrarIndiceColuna(cabecalho, MAPA_COLUNAS[chave]);
  }

  // Descobre também as colunas opcionais (status/edição), que só
  // existem se esse arquivo já tiver sido salvo pelo app antes
  const indicesOpcionais = {};
  for (const chave in MAPA_COLUNAS_OPCIONAIS){
    indicesOpcionais[chave] = encontrarIndiceColuna(cabecalho, MAPA_COLUNAS_OPCIONAIS[chave]);
  }

  const dados = linhas.slice(1).filter(linha => linha.some(v => v !== undefined && v !== ""));

  const pedidos = dados.map(linha => {
    const pegar = (chave) => indices[chave] !== -1 ? linha[indices[chave]] : "";
    const pegarOpcional = (chave) => indicesOpcionais[chave] !== -1 ? linha[indicesOpcionais[chave]] : "";

    // DT COMPRA agora é lida direto da coluna L, pela posição
    // (mais confiável que tentar achar pelo nome do cabeçalho)
    const dtCompraValor = pegarPorLetra(linha, "L");
    const { prazo, diasRestantes } = calcularProgramacaoEnvio(dtCompraValor);

    // Tema simplificado: coluna N (usamos só a 3ª palavra) + coluna P
    const colunaNBruta = pegarPorLetra(linha, "N");
    const variacaoCurta = pegarPorLetra(linha, "P");
    const tema = calcularTema(colunaNBruta, variacaoCurta);

    const idPedidoValor = pegar("idPedido");

    // Se o navegador ainda não tem status/edição salvos para esse
    // pedido (ex: primeiro acesso nesse computador), mas o próprio
    // arquivo já traz essa informação (porque é um "_atualizado.xlsx"
    // salvo antes), usamos o arquivo como cópia de segurança.
    sincronizarComArquivo(idPedidoValor, {
      status: pegarOpcional("statusSalvo"),
      nomeCrianca: pegarOpcional("nomeCriancaSalvo"),
      idade: pegarOpcional("idadeSalva"),
      observacoes: pegarOpcional("observacoesSalvas"),
    });

    return {
      idPedido: idPedidoValor,
      dataPrevista: pegar("dataPrevista"),
      dtCompra: converterParaData(dtCompraValor),
      nomeProduto: pegar("nomeProduto"),
      nomeVariacao: pegar("nomeVariacao"),
      quantidade: pegar("quantidade"),
      numProdutos: pegar("numProdutos"),
      comprador: pegar("comprador"),
      endereco: pegar("endereco"),
      tema: tema,
      prazoProducao: prazo,
      diasRestantes: diasRestantes,
    };
  });

  return { pedidos, indices };
}
/* [FIM] processarPlanilha */


/* ==============================================================
   [INÍCIO] renderizarEstatisticas
   Mostra os números pontuais que o cliente pediu: total de
   pedidos, quantos estão atrasados, urgentes e no prazo.
   ============================================================== */
function renderizarEstatisticas(pedidos){
  const total = pedidos.length;
  const atrasados = pedidos.filter(p => p.diasRestantes !== null && p.diasRestantes < 0).length;
  const urgentes = pedidos.filter(p => p.diasRestantes !== null && p.diasRestantes >= 0 && p.diasRestantes <= 1).length;
  const noPrazo = pedidos.filter(p => p.diasRestantes !== null && p.diasRestantes > 1).length;

  const box = document.getElementById("ppStatsBox");
  box.style.display = "grid";
  box.innerHTML = `
    <div class="stat-card">
      <div class="num">${total}</div>
      <div class="label">Total de pedidos</div>
    </div>
    <div class="stat-card atrasado">
      <div class="num">${atrasados}</div>
      <div class="label">Atrasados</div>
    </div>
    <div class="stat-card urgente">
      <div class="num">${urgentes}</div>
      <div class="label">Urgentes (0-1 dia)</div>
    </div>
    <div class="stat-card ok">
      <div class="num">${noPrazo}</div>
      <div class="label">No prazo</div>
    </div>
  `;
}
/* [FIM] renderizarEstatisticas */


/* ==============================================================
   [INÍCIO] renderizarPedidos
   Desenha os cartões (etiquetas) de cada pedido na tela.
   ============================================================== */
function renderizarPedidos(pedidos){
  const box = document.getElementById("ppOrdersBox");
  const empty = document.getElementById("ppEmptyState");

  if (pedidos.length === 0){
    box.innerHTML = "";
    empty.style.display = "block";
    empty.querySelector("h2").textContent = "Nenhum pedido encontrado";
    empty.querySelector("p").textContent = "Tente ajustar a busca ou carregue outro arquivo.";
    return;
  }
  empty.style.display = "none";

  // ordena: mais urgente primeiro
  const ordenados = [...pedidos].sort((a, b) => {
    if (a.diasRestantes === null) return 1;
    if (b.diasRestantes === null) return -1;
    return a.diasRestantes - b.diasRestantes;
  });

  box.innerHTML = ordenados.map(p => {
    const statusPrazo = classificarStatus(p.diasRestantes);
    const diasTexto = p.diasRestantes === null
      ? "sem data"
      : p.diasRestantes < 0
        ? `${Math.abs(p.diasRestantes)} dia(s) atrasado`
        : `${p.diasRestantes} dia(s) restante(s)`;

    // status manual (Produção/Embalagem/etc.) e dados extras salvos localmente
    const statusPedidoAtual = carregarStatusPedido(p.idPedido);
    const opcoesStatusHtml = OPCOES_STATUS_PEDIDO.map(opcao =>
      `<option value="${opcao}" ${opcao === statusPedidoAtual ? "selected" : ""}>${opcao}</option>`
    ).join("");

    const edicao = carregarEdicaoPedido(p.idPedido);
    const temInfoCrianca = edicao.nomeCrianca || edicao.idade || edicao.observacoes;
    const blocoInfoCrianca = temInfoCrianca ? `
        <div class="info-crianca">
          ${edicao.nomeCrianca ? `<strong>Criança:</strong> ${escapeHtml(edicao.nomeCrianca)}<br>` : ""}
          ${edicao.idade ? `<strong>Idade:</strong> ${escapeHtml(edicao.idade)}<br>` : ""}
          ${edicao.observacoes ? `<strong>Obs:</strong> ${escapeHtml(edicao.observacoes)}` : ""}
        </div>` : "";

    return `
      <div class="tag" style="--status-color:${statusPrazo.cor}">
        <div class="tag-top">
          <span class="tag-id mono">#${escapeHtml(p.idPedido) || "—"}</span>
          <span class="badge">${statusPrazo.texto}</span>
        </div>
        <h3>${escapeHtml(p.tema) || escapeHtml(p.nomeProduto) || "Sem tema"}</h3>
        <div class="tema">${escapeHtml(p.nomeProduto) || ""}</div>
        <dl>
          <dt>Comprador</dt><dd>${escapeHtml(p.comprador) || "—"}</dd>
          <dt>Quantidade</dt><dd>${escapeHtml(p.quantidade) || "—"}</dd>
          <dt>Nº produtos</dt><dd>${escapeHtml(p.numProdutos) || "—"}</dd>
          <dt>Endereço</dt><dd>${escapeHtml(p.endereco) || "—"}</dd>
          <dt>DT Compra</dt><dd>${formatarData(p.dtCompra)}</dd>
          <dt>Prev. envio (planilha)</dt><dd>${escapeHtml(p.dataPrevista) || "—"}</dd>
        </dl>
        <div class="producao-line">
          <span>Prazo produção: <strong>${formatarData(p.prazoProducao)}</strong></span>
          <span class="dias">${diasTexto}</span>
        </div>
        <div class="status-row">
          <select class="status-select" data-id="${escapeHtml(p.idPedido)}">
            <option value="">Status do pedido...</option>
            ${opcoesStatusHtml}
          </select>
          <button class="btn-editar" data-id="${escapeHtml(p.idPedido)}" type="button">✎ Editar</button>
        </div>
        ${blocoInfoCrianca}
      </div>
    `;
  }).join("");
}
/* [FIM] renderizarPedidos */


/* ==============================================================
   [INÍCIO] listener do input de arquivo
   Quando o usuário escolhe o arquivo, lê o conteúdo com a
   biblioteca SheetJS, processa e desenha tudo na tela.
   ============================================================== */
document.getElementById("ppFileInput").addEventListener("change", function(evento){
  const arquivo = evento.target.files[0];
  if (!arquivo) return;

  document.getElementById("ppFileStatus").textContent = "Lendo arquivo...";

  const leitor = new FileReader();
  leitor.onload = function(e){
    try{
      const dadosBrutos = new Uint8Array(e.target.result);
      const planilha = XLSX.read(dadosBrutos, { type: "array", cellDates: true });
      const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
      const linhas = XLSX.utils.sheet_to_json(primeiraAba, { header: 1, defval: "" });

      const resultado = processarPlanilha(linhas);
      pedidosProcessados = resultado.pedidos;

      // guarda tudo que será necessário na hora de "Salvar planilha atualizada"
      linhasOriginais = linhas;
      indicesColunasAtuais = resultado.indices;
      nomeArquivoAtual = arquivo.name.replace(/\.[^.]+$/, ""); // tira a extensão

      document.getElementById("ppFileStatus").textContent =
        `Arquivo: ${arquivo.name} — ${pedidosProcessados.length} pedido(s) carregado(s).`;
      document.getElementById("ppDiagnostico").innerHTML = diagnosticarColunas(resultado.indices);
      document.getElementById("ppSearchBox").style.display = "block";
      document.getElementById("ppBtnSalvarPlanilha").style.display = "inline-block";

      renderizarEstatisticas(pedidosProcessados);
      renderizarPedidos(pedidosProcessados);
    } catch(erro){
      document.getElementById("ppFileStatus").textContent =
        "Não foi possível ler esse arquivo. Confira se é um .csv ou .xlsx válido.";
      console.error(erro);
    }
  };
  leitor.readAsArrayBuffer(arquivo);
});
/* [FIM] listener do input de arquivo */


/* ==============================================================
   [INÍCIO] pedidosFiltradosAtuais
   Aplica o termo de busca atual (se houver) sobre a lista
   completa de pedidos já carregados.
   ============================================================== */
function pedidosFiltradosAtuais(){
  const termo = normalizarTexto(document.getElementById("ppSearchInput").value);
  if (!termo) return pedidosProcessados;
  return pedidosProcessados.filter(p =>
    normalizarTexto(p.idPedido).includes(termo) ||
    normalizarTexto(p.comprador).includes(termo) ||
    normalizarTexto(p.tema).includes(termo)
  );
}
/* [FIM] pedidosFiltradosAtuais */


/* ==============================================================
   [INÍCIO] atualizarTela
   Redesenha os cartões respeitando a busca atual. Chamada tanto
   pela busca quanto depois de salvar um status ou uma edição,
   para que a tela sempre reflita o que está salvo.
   ============================================================== */
function atualizarTela(){
  renderizarPedidos(pedidosFiltradosAtuais());
}
/* [FIM] atualizarTela */


/* ==============================================================
   [INÍCIO] listener da busca
   Filtra os pedidos já carregados por ID, comprador ou tema,
   sem precisar reler o arquivo.
   ============================================================== */
document.getElementById("ppSearchInput").addEventListener("input", atualizarTela);
/* [FIM] listener da busca */


/* ==============================================================
   [INÍCIO] listener de status e edição (dentro dos cartões)
   Usa "delegação de evento": em vez de colocar um escutador em
   cada cartão (que seria recriado toda hora que a tela redesenha),
   colocamos UM escutador no container inteiro (#ordersBox) e
   verificamos qual elemento foi realmente clicado/alterado.
   ============================================================== */

// Quando o usuário muda o status (select) de um pedido
document.getElementById("ppOrdersBox").addEventListener("change", function(evento){
  if (!evento.target.classList.contains("status-select")) return;
  const idPedido = evento.target.dataset.id;
  salvarStatusPedido(idPedido, evento.target.value);
});

// Quando o usuário clica no botão "Editar" de um pedido
document.getElementById("ppOrdersBox").addEventListener("click", function(evento){
  const botao = evento.target.closest(".btn-editar");
  if (!botao) return;
  abrirModalEdicao(botao.dataset.id);
});
/* [FIM] listener de status e edição (dentro dos cartões) */


/* ==============================================================
   [INÍCIO] abrirModalEdicao / fecharModalEdicao
   Abre a janela de edição já preenchida com os dados salvos
   daquele pedido (se houver), e fecha a janela ao cancelar,
   salvar, ou clicar fora dela.
   ============================================================== */
function abrirModalEdicao(idPedido){
  idPedidoEmEdicao = idPedido;
  const dados = carregarEdicaoPedido(idPedido);
  document.getElementById("ppInputNomeCrianca").value = dados.nomeCrianca;
  document.getElementById("ppInputIdade").value = dados.idade;
  document.getElementById("ppInputObservacoes").value = dados.observacoes;
  document.getElementById("ppModalOverlay").classList.add("aberto");
}

function fecharModalEdicao(){
  document.getElementById("ppModalOverlay").classList.remove("aberto");
  idPedidoEmEdicao = null;
}

document.getElementById("ppBtnCancelarModal").addEventListener("click", fecharModalEdicao);

// Fecha o modal se o usuário clicar fora da caixa branca (na área escura)
document.getElementById("ppModalOverlay").addEventListener("click", function(evento){
  if (evento.target.id === "ppModalOverlay") fecharModalEdicao();
});

document.getElementById("ppBtnSalvarModal").addEventListener("click", function(){
  if (!idPedidoEmEdicao) return;
  const dados = {
    nomeCrianca: document.getElementById("ppInputNomeCrianca").value.trim(),
    idade: document.getElementById("ppInputIdade").value.trim(),
    observacoes: document.getElementById("ppInputObservacoes").value.trim(),
  };
  salvarEdicaoPedido(idPedidoEmEdicao, dados);
  fecharModalEdicao();
  atualizarTela();
});
/* [FIM] abrirModalEdicao / fecharModalEdicao */
/* ==============================================================
   [INÍCIO] garantirColuna
   Procura uma coluna pelo nome no cabeçalho; se não existir,
   cria (adiciona no final). Devolve a posição (índice) da coluna,
   nos dois casos. Isso evita duplicar colunas se o usuário salvar
   a planilha, editar de novo, e salvar outra vez.
   ============================================================== */
function garantirColuna(cabecalho, nomeColuna){
  const indiceExistente = cabecalho.findIndex(h => normalizarTexto(h) === normalizarTexto(nomeColuna));
  if (indiceExistente !== -1) return indiceExistente;
  cabecalho.push(nomeColuna);
  return cabecalho.length - 1;
}
/* [FIM] garantirColuna */


/* ==============================================================
   [INÍCIO] baixarPlanilhaAtualizada
   Pega a planilha ORIGINAL (tal como foi importada) e adiciona
   4 colunas no final: STATUS DO PEDIDO, NOME DA CRIANÇA, IDADE
   e OBSERVAÇÕES, preenchidas com o que está salvo no navegador
   para cada pedido. Depois gera um novo arquivo .xlsx para
   download — o navegador não pode sobrescrever o arquivo
   original sozinho (por segurança), então o resultado é sempre
   um novo arquivo, que substitui o antigo na sua pasta Downloads.
   ============================================================== */
function baixarPlanilhaAtualizada(){
  if (!linhasOriginais.length){
    alert("Carregue uma planilha primeiro.");
    return;
  }

  // Trabalha em cima de uma cópia, para nunca alterar os dados originais em memória
  const cabecalho = [...linhasOriginais[0]];

  const idxStatus = garantirColuna(cabecalho, "STATUS DO PEDIDO");
  const idxNomeCrianca = garantirColuna(cabecalho, "NOME DA CRIANÇA");
  const idxIdade = garantirColuna(cabecalho, "IDADE");
  const idxObservacoes = garantirColuna(cabecalho, "OBSERVAÇÕES");

  const indiceIdPedido = indicesColunasAtuais.idPedido;

  const linhasAtualizadas = linhasOriginais.slice(1).map(linhaOriginal => {
    const linha = [...linhaOriginal];
    const idPedido = indiceIdPedido !== -1 ? linha[indiceIdPedido] : "";

    const status = carregarStatusPedido(idPedido);
    const edicao = carregarEdicaoPedido(idPedido);

    linha[idxStatus] = status;
    linha[idxNomeCrianca] = edicao.nomeCrianca;
    linha[idxIdade] = edicao.idade;
    linha[idxObservacoes] = edicao.observacoes;

    return linha;
  });

  const planilhaFinal = [cabecalho, ...linhasAtualizadas];

  // Monta um arquivo .xlsx novo e dispara o download no navegador
  const novaAba = XLSX.utils.aoa_to_sheet(planilhaFinal);
  const novoLivro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(novoLivro, novaAba, "Pedidos");

  const nomeArquivoFinal = `${nomeArquivoAtual || "pedidos"}_atualizado.xlsx`;
  XLSX.writeFile(novoLivro, nomeArquivoFinal);
}
/* [FIM] baixarPlanilhaAtualizada */

document.getElementById("ppBtnSalvarPlanilha").addEventListener("click", baixarPlanilhaAtualizada);
