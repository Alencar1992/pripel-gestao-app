const URL_API = "SUA_URL_AQUI"; // Cole aqui a URL que você gerou no Apps Script

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
