// 1. SUA URL DO GOOGLE APPS SCRIPT
const URL_API = "https://script.google.com/macros/s/AKfycbxo0HmHlzJklmZ8jM987fSb9ijS6XtaH-otVAZaaGfQbm22Tdgtx7moFdoYDRF5e9E4/exec";

// 2. ELEMENTOS DE NAVEGAÇÃO
const menuVenda = document.getElementById('menu-venda');
const menuDespesa = document.getElementById('menu-despesa');
const telaVenda = document.getElementById('tela-venda');
const telaDespesa = document.getElementById('tela-despesa');

// Troca para tela de Vendas
menuVenda.addEventListener('click', (e) => {
    e.preventDefault();
    telaVenda.style.display = 'block';
    telaDespesa.style.display = 'none';
    menuVenda.parentElement.classList.add('active');
    menuDespesa.parentElement.classList.remove('active');
});

// Troca para tela de Despesas
menuDespesa.addEventListener('click', (e) => {
    e.preventDefault();
    telaVenda.style.display = 'none';
    telaDespesa.style.display = 'block';
    menuDespesa.parentElement.classList.add('active');
    menuVenda.parentElement.classList.remove('active');
});

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
