(function () {
  "use strict";

  let chamados = [];
  let chamadoSelecionado = null;
  let chamadoTesteAtual = null;
  let timerReexibicao = null;

  const corpo = document.getElementById("corpoTabelaChamados");
  const modal = document.getElementById("modalAtendimentoChamado");
  const overlayTeste = document.getElementById("notificacaoTesteChamado");

  function usuarioAtual() {
    try { return JSON.parse(sessionStorage.getItem("priPelUser") || "{}").login || ""; }
    catch (_) { return ""; }
  }

  function ehAdministrador() {
    return usuarioAtual().trim().toLowerCase() === "admin";
  }

  window.atualizarAcessoChamados = function () {
    const menu = document.getElementById("menu-atendimento");
    if (menu) menu.parentElement.style.display = usuarioAtual() ? "" : "none";
    const admin = ehAdministrador();
    document.getElementById("tituloTelaChamados").textContent = admin ? "Atendimento de Chamados" : "Meus Chamados";
    document.getElementById("subtituloTelaChamados").textContent = admin
      ? "Avalie, trate, envie para teste e conclua os tickets da Stellinha."
      : "Abra chamados pela Stellinha e acompanhe, cancele ou finalize seus próprios atendimentos.";
    document.getElementById("btnAbrirChamadoUsuario").hidden = admin;
    if (usuarioAtual()) consultarNotificacoesChamados();
  };

  function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function classeStatus(status) {
    return "status-ticket status-" + String(status || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
  }

  function renderizarIndicadores() {
    const box = document.getElementById("indicadoresChamados");
    const status = ["ABERTO", "EM ANÁLISE", "EM TRATAMENTO", "AGUARDANDO TESTE", "CONCLUÍDO", "CANCELADO"];
    box.innerHTML = status.map(item => `<button type="button" data-filtro-status="${item}"><strong>${chamados.filter(c => c.status === item).length}</strong><span>${item}</span></button>`).join("");
  }

  function renderizarChamados() {
    const termo = document.getElementById("pesquisaChamados").value.trim().toLowerCase();
    const filtro = document.getElementById("filtroStatusChamados").value;
    const filtrados = chamados.filter(c => {
      const texto = `${c.protocolo} ${c.usuario} ${c.modulo} ${c.tipo} ${c.descricao}`.toLowerCase();
      return (!termo || texto.includes(termo)) && (!filtro || c.status === filtro);
    });
    if (!filtrados.length) {
      corpo.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;">Nenhum chamado encontrado.</td></tr>';
      return;
    }
    corpo.innerHTML = filtrados.map(c => `<tr>
      <td class="mono">${escapar(c.protocolo)}</td><td>${escapar(c.usuario)}</td><td>${escapar(c.modulo)}</td>
      <td>${escapar(c.tipo)}</td><td>${escapar(c.urgencia)}</td>
      <td><span class="${classeStatus(c.status)}">${escapar(c.status)}</span></td>
      <td>${escapar(c.atualizadoEm || c.abertoEm)}</td>
      <td><button type="button" class="btn-gerenciar-chamado" data-protocolo="${escapar(c.protocolo)}">${ehAdministrador() ? "Gerenciar" : "Visualizar"}</button></td>
    </tr>`).join("");
  }

  window.carregarChamados = async function () {
    corpo.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;">Carregando chamados...</td></tr>';
    try {
      const resultado = await chamarApi({ acao:"listar_chamados", usuario:usuarioAtual() });
      if (resultado.status !== "sucesso") throw new Error(resultado.mensagem);
      chamados = resultado.chamados || [];
      renderizarIndicadores();
      renderizarChamados();
    } catch (erro) {
      corpo.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--cor-alerta);">${escapar(erro.message)}</td></tr>`;
    }
  };

  function abrirChamado(protocolo) {
    chamadoSelecionado = chamados.find(c => c.protocolo === protocolo);
    if (!chamadoSelecionado) return;
    document.getElementById("chamadoProtocoloModal").textContent = chamadoSelecionado.protocolo;
    document.getElementById("chamadoTituloModal").textContent = `${chamadoSelecionado.modulo} — ${chamadoSelecionado.tipo}`;
    document.getElementById("chamadoParecer").value = chamadoSelecionado.parecer || "";
    document.getElementById("chamadoMensagemCliente").value = chamadoSelecionado.mensagemCliente || "";
    const admin = ehAdministrador();
    document.getElementById("camposAdminChamado").hidden = !admin;
    document.getElementById("acoesAdminChamado").hidden = !admin;
    document.getElementById("acoesUsuarioChamado").hidden = admin;
    const podeCancelar = !["CONCLUÍDO", "CANCELADO"].includes(chamadoSelecionado.status);
    const podeFinalizar = chamadoSelecionado.status === "AGUARDANDO TESTE";
    document.getElementById("btnCancelarChamadoUsuario").hidden = !podeCancelar;
    document.getElementById("btnFinalizarChamadoUsuario").hidden = !podeFinalizar;
    document.getElementById("mensagemAtendimentoChamado").textContent = "";
    document.getElementById("chamadoDetalhesModal").innerHTML = `
      <div><span>Usuário</span><strong>${escapar(chamadoSelecionado.usuario)}</strong></div>
      <div><span>Urgência</span><strong>${escapar(chamadoSelecionado.urgencia)}</strong></div>
      <div class="full"><span>Descrição</span><strong>${escapar(chamadoSelecionado.descricao)}</strong></div>
      <div class="full"><span>Passos realizados</span><strong>${escapar(chamadoSelecionado.passos)}</strong></div>
      <div><span>Esperado</span><strong>${escapar(chamadoSelecionado.esperado)}</strong></div>
      <div><span>Encontrado</span><strong>${escapar(chamadoSelecionado.encontrado)}</strong></div>
      ${chamadoSelecionado.mensagemCliente ? `<div class="full"><span>Retorno para teste</span><strong>${escapar(chamadoSelecionado.mensagemCliente)}</strong></div>` : ""}`;
    modal.hidden = false;
  }

  async function acaoUsuarioChamado(acao) {
    if (!chamadoSelecionado || ehAdministrador()) return;
    const mensagemBox = document.getElementById("mensagemAtendimentoChamado");
    mensagemBox.textContent = "Salvando...";
    try {
      const resultado = await chamarApi({ acao, usuario:usuarioAtual(), protocolo:chamadoSelecionado.protocolo });
      if (resultado.status !== "sucesso") throw new Error(resultado.mensagem);
      mensagemBox.textContent = resultado.mensagem;
      await carregarChamados();
      setTimeout(() => { modal.hidden = true; }, 700);
    } catch (erro) {
      mensagemBox.textContent = erro.message;
    }
  }

  async function atualizarChamado(status, enviarTeste) {
    if (!chamadoSelecionado) return;
    const mensagemBox = document.getElementById("mensagemAtendimentoChamado");
    const parecer = document.getElementById("chamadoParecer").value.trim();
    const mensagemCliente = document.getElementById("chamadoMensagemCliente").value.trim();
    if (enviarTeste && !mensagemCliente) {
      mensagemBox.textContent = "Escreva a mensagem que será mostrada ao usuário.";
      return;
    }
    mensagemBox.textContent = "Salvando...";
    try {
      const resultado = await chamarApi({ acao:"atualizar_chamado", usuario:usuarioAtual(), protocolo:chamadoSelecionado.protocolo, status, parecer, mensagemCliente });
      if (resultado.status !== "sucesso") throw new Error(resultado.mensagem);
      mensagemBox.textContent = enviarTeste ? "Chamado enviado para teste do usuário." : "Chamado atualizado.";
      await carregarChamados();
      setTimeout(() => { modal.hidden = true; }, 700);
    } catch (erro) {
      mensagemBox.textContent = erro.message;
    }
  }

  async function consultarNotificacoesChamados() {
    const usuario = usuarioAtual();
    if (!usuario || chamadoTesteAtual || !overlayTeste.hidden) return;
    try {
      const resultado = await chamarApi({ acao:"consultar_notificacoes_chamados", usuario });
      if (resultado.status === "sucesso" && resultado.chamado) mostrarNotificacaoTeste(resultado.chamado);
    } catch (_) {}
  }

  function mostrarNotificacaoTeste(chamado) {
    chamadoTesteAtual = chamado;
    document.getElementById("protocoloTesteChamado").textContent = chamado.protocolo;
    document.getElementById("mensagemTesteChamado").textContent = chamado.mensagemCliente || "O ajuste foi realizado. Teste a função e confirme o resultado.";
    overlayTeste.hidden = false;
    const card = overlayTeste.querySelector(".notificacao-teste-card");
    card.classList.remove("explodir");
    void card.offsetWidth;
    card.classList.add("explodir");
  }

  function ocultarComRepeticaoCurta() {
    overlayTeste.hidden = true;
    clearTimeout(timerReexibicao);
    timerReexibicao = setTimeout(() => {
      if (chamadoTesteAtual) mostrarNotificacaoTeste(chamadoTesteAtual);
    }, 15000);
  }

  document.getElementById("btnAtualizarChamados").addEventListener("click", carregarChamados);
  document.getElementById("btnAbrirChamadoUsuario").addEventListener("click", () => {
    document.getElementById("stellinhaLauncher")?.click();
  });
  document.getElementById("pesquisaChamados").addEventListener("input", renderizarChamados);
  document.getElementById("filtroStatusChamados").addEventListener("change", renderizarChamados);
  document.getElementById("indicadoresChamados").addEventListener("click", e => {
    const btn = e.target.closest("[data-filtro-status]");
    if (!btn) return;
    document.getElementById("filtroStatusChamados").value = btn.dataset.filtroStatus;
    renderizarChamados();
  });
  corpo.addEventListener("click", e => {
    const btn = e.target.closest(".btn-gerenciar-chamado");
    if (btn) abrirChamado(btn.dataset.protocolo);
  });
  document.getElementById("btnFecharAtendimento").addEventListener("click", () => { modal.hidden = true; });
  modal.addEventListener("click", e => { if (e.target === modal) modal.hidden = true; });
  document.querySelectorAll(".btn-status-chamado").forEach(btn => btn.addEventListener("click", () => atualizarChamado(btn.dataset.status, false)));
  document.getElementById("btnEnviarChamadoTeste").addEventListener("click", () => atualizarChamado("AGUARDANDO TESTE", true));
  document.getElementById("btnConcluirChamadoAdmin").addEventListener("click", () => atualizarChamado("CONCLUÍDO", false));
  document.getElementById("btnCancelarChamadoUsuario").addEventListener("click", () => acaoUsuarioChamado("cancelar_chamado"));
  document.getElementById("btnFinalizarChamadoUsuario").addEventListener("click", () => acaoUsuarioChamado("confirmar_teste_chamado"));

  overlayTeste.addEventListener("click", e => {
    if (!e.target.closest("#btnLembrarTesteDepois") && !e.target.closest("#btnConfirmarTesteChamado")) ocultarComRepeticaoCurta();
  });
  document.getElementById("btnLembrarTesteDepois").addEventListener("click", async () => {
    if (!chamadoTesteAtual) return;
    try { await chamarApi({ acao:"adiar_teste_chamado", usuario:usuarioAtual(), protocolo:chamadoTesteAtual.protocolo, minutos:60 }); } catch (_) {}
    chamadoTesteAtual = null;
    overlayTeste.hidden = true;
    clearTimeout(timerReexibicao);
    setTimeout(consultarNotificacoesChamados, 60 * 60 * 1000);
  });
  document.getElementById("btnConfirmarTesteChamado").addEventListener("click", async () => {
    if (!chamadoTesteAtual) return;
    const protocolo = chamadoTesteAtual.protocolo;
    try {
      const resultado = await chamarApi({ acao:"confirmar_teste_chamado", usuario:usuarioAtual(), protocolo });
      if (resultado.status !== "sucesso") throw new Error(resultado.mensagem);
      chamadoTesteAtual = null;
      overlayTeste.hidden = true;
      clearTimeout(timerReexibicao);
    } catch (erro) {
      document.getElementById("mensagemTesteChamado").textContent = erro.message;
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    atualizarAcessoChamados();
    setInterval(consultarNotificacoesChamados, 30000);
  });
})();
