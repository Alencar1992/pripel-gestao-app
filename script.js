const URL_API = "https://script.google.com/macros/s/AKfycbxo0HmHlzJklmZ8jM987fSb9ijS6XtaH-otVAZaaGfQbm22Tdgtx7moFdoYDRF5e9E4/exec";

// --- BANCO DE USUÁRIOS (Temporário no Front-end) ---
const usuariosPermitidos = [
    { login: "priscila", senha: "123", nomeCompleto: "Priscila da Silva Alencar" },
    { login: "osvaldo",  senha: "456", nomeCompleto: "Osvaldo Pereira" }
];

// --- LÓGICA DE LOGIN ---
const telaLogin = document.getElementById('tela-login');
const appContainer = document.getElementById('app-container');
const nomeUsuarioLogado = document.getElementById('nomeUsuarioLogado');
const textoBoasVindas = document.getElementById('textoBoasVindas');

document.getElementById('formLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    const userDigitado = document.getElementById('loginUser').value.toLowerCase().trim();
    const senhaDigitada = document.getElementById('loginSenha').value;
    const msgErro = document.getElementById('msgLogin');

    // Procura o usuário na lista
    const usuarioEncontrado = usuariosPermitidos.find(u => u.login === userDigitado && u.senha === senhaDigitada);

    if (usuarioEncontrado) {
        // Sucesso: Esconde login, mostra sistema e personaliza o nome
        telaLogin.style.display = 'none';
        appContainer.style.display = 'flex';
        nomeUsuarioLogado.innerText = usuarioEncontrado.nomeCompleto;
        
        // Pega o primeiro nome para dar boas vindas
        const primeiroNome = usuarioEncontrado.nomeCompleto.split(" ")[0];
        textoBoasVindas.innerText = `Olá, ${primeiroNome}! Aqui está o resumo do mês.`;
    } else {
        // Erro: Mostra mensagem
        msgErro.style.display = 'block';
    }
});

// Botão Sair
document.getElementById('btnSair').addEventListener('click', (e) => {
    e.preventDefault();
    appContainer.style.display = 'none';
    telaLogin.style.display = 'flex';
    document.getElementById('formLogin').reset();
    document.getElementById('msgLogin').style.display = 'none';
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
    // Esconde todas as telas e remove a cor de todos os menus
    Object.values(telas).forEach(t => t.style.display = 'none');
    Object.values(menus).forEach(m => m.parentElement.classList.remove('active'));
    
    // Mostra a tela selecionada e pinta o menu
    telas[telaAtivaId].style.display = 'block';
    menus[telaAtivaId].parentElement.classList.add('active');

    // Muda o texto de boas vindas dependendo da tela
    if(telaAtivaId === 'dashboard') {
        textoBoasVindas.style.display = 'block';
    } else {
        textoBoasVindas.style.display = 'none';
    }
}

menus.dashboard.addEventListener('click', (e) => { e.preventDefault(); trocarTela('dashboard'); });
menus.venda.addEventListener('click', (e) => { e.preventDefault(); trocarTela('venda'); });
menus.despesa.addEventListener('click', (e) => { e.preventDefault(); trocarTela('despesa'); });


// --- LÓGICA DE ENVIO (VENDAS E DESPESAS) MANTIDA IGUAL ---
// 3. LÓGICA DE ENVIO DE VENDAS
document.getElementById('formVenda').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnEnviarVenda');
    const msg = document.getElementById('mensagemVenda');
    
    btn.disabled = true;
    msg.innerText = "Enviando venda...";
    msg.style.color = "black";

    const dados = [
        document.getElementById('data').value,
        document.getElementById('cliente').value,
        document.getElementById('produto').value,
        document.getElementById('valor').value,
        document.getElementById('status').value
    ];

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({
                planilha: "vendas",
                dados: dados
            })
        });

        const resultado = await response.json();

        if (resultado.status === "sucesso") {
            msg.style.color = "green";
            msg.innerText = "Venda registrada com sucesso!";
            document.getElementById('formVenda').reset();
        } else {
            throw new Error(resultado.mensagem);
        }
    } catch (error) {
        msg.style.color = "red";
        msg.innerText = "Erro ao salvar: " + error.message;
    } finally {
        btn.disabled = false;
        setTimeout(() => msg.innerText = "", 4000);
    }
});
    // (O MESMO CÓDIGO DE ENVIO DE VENDAS QUE JÁ ESTAVA FUNCIONANDO)
});

document.getElementById('formDespesa').addEventListener('submit', async (e) => {
    e.preventDefault();
    // (O MESMO CÓDIGO DE ENVIO DE DESPESAS QUE JÁ ESTAVA FUNCIONANDO)
    // 4. LÓGICA DE ENVIO DE DESPESAS
document.getElementById('formDespesa').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnEnviarDespesa');
    const msg = document.getElementById('mensagemDespesa');
    
    btn.disabled = true;
    msg.innerText = "Enviando despesa...";
    msg.style.color = "black";

    const dados = [
        document.getElementById('dataDespesa').value,
        document.getElementById('categoriaDespesa').value,
        document.getElementById('valorDespesa').value,
        document.getElementById('statusDespesa').value
    ];

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({
                planilha: "despesas",
                dados: dados
            })
        });

        const resultado = await response.json();

        if (resultado.status === "sucesso") {
            msg.style.color = "green";
            msg.innerText = "Despesa registrada com sucesso!";
            document.getElementById('formDespesa').reset();
        } else {
            throw new Error(resultado.mensagem);
        }
    } catch (error) {
        msg.style.color = "red";
        msg.innerText = "Erro ao salvar: " + error.message;
    } finally {
        btn.disabled = false;
        setTimeout(() => msg.innerText = "", 4000);
    }
});

});
