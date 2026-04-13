const URL_API = "https://script.google.com/macros/s/AKfycbxo0HmHlzJklmZ8jM987fSb9ijS6XtaH-otVAZaaGfQbm22Tdgtx7moFdoYDRF5e9E4/exec"; // Cole aqui a URL que você gerou no Apps Script

document.getElementById('formVenda').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnEnviar');
    const msg = document.getElementById('mensagem');
    
    btn.disabled = true;
    msg.innerText = "Enviando...";

    // Coleta os dados do formulário
    const dados = [
        document.getElementById('data').value,
        document.getElementById('cliente').value,
        document.getElementById('produto').value,
        document.getElementById('valor').value,
        document.getElementById('status').value
    ];

    // Monta o objeto para a sua API (conforme o código .gs que criamos)
    const payload = {
        planilha: "vendas", // Nome exato da aba na sua planilha
        dados: dados
    };

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify(payload)
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
    }
});
// --- LÓGICA DE NAVEGAÇÃO DO MENU ---
const menuVenda = document.getElementById('menu-venda');
const menuDespesa = document.getElementById('menu-despesa');
const telaVenda = document.getElementById('tela-venda');
const telaDespesa = document.getElementById('tela-despesa');

menuVenda.addEventListener('click', (e) => {
    e.preventDefault();
    telaVenda.style.display = 'block';
    telaDespesa.style.display = 'none';
    
    // Atualiza a cor de destaque no menu
    menuVenda.parentElement.classList.add('active');
    menuDespesa.parentElement.classList.remove('active');
});

menuDespesa.addEventListener('click', (e) => {
    e.preventDefault();
    telaVenda.style.display = 'none';
    telaDespesa.style.display = 'block';
    
    // Atualiza a cor de destaque no menu
    menuDespesa.parentElement.classList.add('active');
    menuVenda.parentElement.classList.remove('active');
});

// --- LÓGICA DE ENVIO DO FORMULÁRIO DE DESPESAS ---
document.getElementById('formDespesa').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnEnviarDespesa');
    const msg = document.getElementById('mensagemDespesa');
    
    btn.disabled = true;
    msg.innerText = "Enviando...";
    msg.style.color = "black";

    const dados = [
        document.getElementById('dataDespesa').value,
        document.getElementById('categoriaDespesa').value,
        document.getElementById('valorDespesa').value,
        document.getElementById('statusDespesa').value
    ];

    const payload = {
        planilha: "despesas", // Tem que ser o nome exato da aba na planilha
        dados: dados
    };

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify(payload)
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
        setTimeout(() => msg.innerText = "", 3000); // Limpa a mensagem após 3 segundos
    }
});
