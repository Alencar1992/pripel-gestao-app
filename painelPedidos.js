/* ==============================================================
   CONFIGURAÇÃO GERAL E MAPAS DE COLUNAS
   ============================================================== */
const MAPA_COLUNAS = {
  idPedido:      ["ID DO PEDIDO"],
  dataPrevista:  ["DATA PREVISTA DE ENVIO"],
  nomeProduto:   ["NOME DO PRODUTO"], // Coluna N
  nomeVariacao:  ["NOME DA VARIACAO", "NOME DA VARIAÇÃO"], // Coluna P
  quantidade:    ["QUANTIDADE"],
  numProdutos:   ["NUMERO DE PRODUTOS PEDIDOS", "NÚMERO DE PRODUTOS PEDIDOS"],
  comprador:     ["NOME DE USUARIO (COMPRADOR)", "NOME DE USUÁRIO (COMPRADOR)"],
  endereco:      ["ENDERECO DE ENTREGA", "ENDEREÇO DE ENTREGA"],
};

const MAPA_COLUNAS_OPCIONAIS = {
  statusSalvo:        ["STATUS DO PEDIDO"],
  temaManualSalvo:    ["TEMA"], // Nova coluna para o tema digitado
  nomeCriancaSalvo:   ["NOME DA CRIANÇA", "NOME DA CRIANCA"],
  idadeSalva:         ["IDADE"],
  observacoesSalvas:  ["OBSERVAÇÕES", "OBSERVACOES"],
};

const DIAS_PRODUCAO = 5; 
const OPCOES_STATUS_PEDIDO = ["PRODUÇÃO", "EMBALAGEM", "CANCELADO", "FEITO", "POSTADO"];

/* ==============================================================
   ESTADO GLOBAL E UTILITÁRIOS
   ============================================================== */
let pedidosProcessados = [];
let idPedidoEmEdicao = null;
let linhasOriginais = [];
let indicesColunasAtuais = {};
let nomeArquivoAtual = "";
let abaAtual = "PRODUÇÃO"; // <- NOVA VARIÁVEL

function normalizarTexto(txt) {
  return String(txt || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

function encontrarIndiceColuna(cabecalho, nomesPossiveis) {
  const cabecalhoNormalizado = cabecalho.map(normalizarTexto);
  for (const nome of nomesPossiveis) {
    const alvo = normalizarTexto(nome);
    const idx = cabecalhoNormalizado.findIndex(h => h === alvo || h.includes(alvo));
    if (idx !== -1) return idx;
  }
  return -1;
}

function converterParaData(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  if (typeof valor === "number") {
    const dataBase = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return new Date(dataBase.getUTCFullYear(), dataBase.getUTCMonth(), dataBase.getUTCDate());
  }
  if (typeof valor === "string") {
    const soData = valor.trim().split(" ")[0];
    let m = soData.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    m = soData.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }
  return null;
}

function letraParaIndice(letra) {
  let coluna = 0;
  for (let i = 0; i < letra.length; i++) {
    coluna = coluna * 26 + (letra.toUpperCase().charCodeAt(i) - 64);
  }
  return coluna - 1;
}

function pegarPorLetra(linha, letra) {
  const indice = letraParaIndice(letra);
  const valor = linha[indice];
  return valor === undefined ? "" : String(valor).trim();
}

/* ==============================================================
   LÓGICA DE NEGÓCIO (PRAZOS E STATUS)
   ============================================================== */
function calcularProgramacaoEnvio(dtCompra) {
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

function classificarStatus(diasRestantes) {
  if (diasRestantes === null) return { texto: "SEM DATA", cor: "var(--ink-soft)" };
  if (diasRestantes < 0)      return { texto: "ATRASADO", cor: "var(--cor-alerta)" };
  if (diasRestantes <= 1)     return { texto: "URGENTE",  cor: "var(--cor-destaque)" };
  if (diasRestantes <= 3)     return { texto: "ATENÇÃO",  cor: "#f39c12" };
  return                            { texto: "NO PRAZO", cor: "var(--cor-sucesso)" };
}

function formatarData(data) {
  if (!data) return "—";
  const dd = String(data.getDate()).padStart(2, "0");
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const yy = data.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function diagnosticarColunas(indices) {
  const nomesAmigaveis = { idPedido: "ID DO PEDIDO", dataPrevista: "DATA PREVISTA DE ENVIO", nomeProduto: "NOME DO PRODUTO (N)", nomeVariacao: "NOME DA VARIAÇÃO (P)", quantidade: "QUANTIDADE", numProdutos: "Nº PRODUTOS PEDIDOS", comprador: "COMPRADOR", endereco: "ENDEREÇO" };
  const naoEncontradas = Object.keys(indices).filter(chave => indices[chave] === -1).map(chave => nomesAmigaveis[chave] || chave);
  if (naoEncontradas.length === 0) return `<span style="color:var(--cor-sucesso)">✓ Todas as colunas esperadas foram encontradas.</span>`;
  return `<span style="color:var(--cor-alerta)">⚠ Colunas não encontradas: ${naoEncontradas.join(", ")} — confira se o nome do cabeçalho bate.</span>`;
}

function escapeHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ==============================================================
   LOCAL STORAGE E SINCRONIZAÇÃO
   ============================================================== */
function salvarStatusPedido(idPedido, statusValor) { try { localStorage.setItem("kitfesta_status_" + idPedido, statusValor); } catch(erro) {} }
function carregarStatusPedido(idPedido) { try { return localStorage.getItem("kitfesta_status_" + idPedido) || ""; } catch(erro) { return ""; } }
function salvarEdicaoPedido(idPedido, dados) { try { localStorage.setItem("kitfesta_edicao_" + idPedido, JSON.stringify(dados)); } catch(erro) {} }
function carregarEdicaoPedido(idPedido) {
  try {
    const bruto = localStorage.getItem("kitfesta_edicao_" + idPedido);
    return bruto ? JSON.parse(bruto) : { temaManual: "", nomeCrianca: "", idade: "", observacoes: "" };
  } catch(erro) { return { temaManual: "", nomeCrianca: "", idade: "", observacoes: "" }; }
}

function sincronizarComArquivo(idPedido, dadosDoArquivo) {
  if (!idPedido) return;
  const statusJaSalvo = carregarStatusPedido(idPedido);
  if (!statusJaSalvo && dadosDoArquivo.status) salvarStatusPedido(idPedido, dadosDoArquivo.status);

  const edicaoJaSalva = carregarEdicaoPedido(idPedido);
  const semEdicaoNoNavegador = !edicaoJaSalva.temaManual && !edicaoJaSalva.nomeCrianca && !edicaoJaSalva.idade && !edicaoJaSalva.observacoes;
  const temDadosNoArquivo = dadosDoArquivo.temaManual || dadosDoArquivo.nomeCrianca || dadosDoArquivo.idade || dadosDoArquivo.observacoes;

  if (semEdicaoNoNavegador && temDadosNoArquivo) {
    salvarEdicaoPedido(idPedido, {
      temaManual: dadosDoArquivo.temaManual || "",
      nomeCrianca: dadosDoArquivo.nomeCrianca || "",
      idade: dadosDoArquivo.idade || "",
      observacoes: dadosDoArquivo.observacoes || "",
    });
  }
}

/* ==============================================================
   PROCESSAMENTO DE ARQUIVO E RENDERIZAÇÃO
   ============================================================== */
function processarPlanilha(linhas) {
  const cabecalho = linhas[0];
  const indices = {};
  for (const chave in MAPA_COLUNAS) indices[chave] = encontrarIndiceColuna(cabecalho, MAPA_COLUNAS[chave]);
  
  const indicesOpcionais = {};
  for (const chave in MAPA_COLUNAS_OPCIONAIS) indicesOpcionais[chave] = encontrarIndiceColuna(cabecalho, MAPA_COLUNAS_OPCIONAIS[chave]);

  const dados = linhas.slice(1).filter(linha => linha.some(v => v !== undefined && v !== ""));

  const pedidos = dados.map(linha => {
    const pegar = (chave) => indices[chave] !== -1 ? linha[indices[chave]] : "";
    const pegarOpcional = (chave) => indicesOpcionais[chave] !== -1 ? linha[indicesOpcionais[chave]] : "";

    const dtCompraValor = pegarPorLetra(linha, "L");
    const { prazo, diasRestantes } = calcularProgramacaoEnvio(dtCompraValor);

    const idPedidoValor = pegar("idPedido");

    sincronizarComArquivo(idPedidoValor, {
      status: pegarOpcional("statusSalvo"),
      temaManual: pegarOpcional("temaManualSalvo"),
      nomeCrianca: pegarOpcional("nomeCriancaSalvo"),
      idade: pegarOpcional("idadeSalva"),
      observacoes: pegarOpcional("observacoesSalvas"),
    });

    return {
      idPedido: idPedidoValor, dataPrevista: pegar("dataPrevista"), dtCompra: converterParaData(dtCompraValor),
      nomeProduto: pegar("nomeProduto"), nomeVariacao: pegar("nomeVariacao"), quantidade: pegar("quantidade"),
      numProdutos: pegar("numProdutos"), comprador: pegar("comprador"), endereco: pegar("endereco"),
      prazoProducao: prazo, diasRestantes: diasRestantes,
    };
  });

  return { pedidos, indices };
}

function renderizarEstatisticas(pedidos) {
  const total = pedidos.length;
  const atrasados = pedidos.filter(p => p.diasRestantes !== null && p.diasRestantes < 0).length;
  const urgentes = pedidos.filter(p => p.diasRestantes !== null && p.diasRestantes >= 0 && p.diasRestantes <= 1).length;
  const noPrazo = pedidos.filter(p => p.diasRestantes !== null && p.diasRestantes > 1).length;

  const box = document.getElementById("ppStatsBox");
  box.style.display = "grid";
  box.innerHTML = `
    <div class="stat-card"><div class="num">${total}</div><div class="label">Total (Em Produção)</div></div>
    <div class="stat-card" style="border-left: 4px solid var(--cor-alerta);"><div class="num" style="color:var(--cor-alerta);">${atrasados}</div><div class="label">Atrasados</div></div>
    <div class="stat-card" style="border-left: 4px solid var(--cor-destaque);"><div class="num" style="color:var(--cor-destaque);">${urgentes}</div><div class="label">Urgentes (0-1 dia)</div></div>
    <div class="stat-card" style="border-left: 4px solid var(--cor-sucesso);"><div class="num" style="color:var(--cor-sucesso);">${noPrazo}</div><div class="label">No prazo</div></div>
  `;
}

function renderizarPedidos(pedidos) {
  const box = document.getElementById("ppOrdersBox");
  const empty = document.getElementById("ppEmptyState");

  if (pedidos.length === 0) {
    box.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  const ordenados = [...pedidos].sort((a, b) => {
    if (a.diasRestantes === null) return 1;
    if (b.diasRestantes === null) return -1;
    return a.diasRestantes - b.diasRestantes;
  });

  box.innerHTML = ordenados.map(p => {
    const statusPrazo = classificarStatus(p.diasRestantes);
    const diasTexto = p.diasRestantes === null ? "sem data" : p.diasRestantes < 0 ? `${Math.abs(p.diasRestantes)} dia(s) atrasado` : `${p.diasRestantes} dia(s) restante(s)`;

    const statusPedidoAtual = carregarStatusPedido(p.idPedido);
    const opcoesStatusHtml = OPCOES_STATUS_PEDIDO.map(opcao => `<option value="${opcao}" ${opcao === statusPedidoAtual ? "selected" : ""}>${opcao}</option>`).join("");

    const edicao = carregarEdicaoPedido(p.idPedido);
    
    // Campo Editável de Tema no próprio card
    const temaManualInput = `
        <div style="margin-bottom: 15px;">
          <label style="font-size: 0.75rem; font-weight: bold; color: var(--ink-soft); text-transform: uppercase;">Tema</label>
          <input type="text" class="input-tema-card" data-id="${escapeHtml(p.idPedido)}" value="${escapeHtml(edicao.temaManual || "")}" placeholder="Digite o tema..." style="width: 100%; margin-top: 4px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--paper-2); color: var(--ink); font-size: 0.9rem; transition: border-color 0.2s ease;">
        </div>
    `;

    const temInfoCrianca = edicao.nomeCrianca || edicao.idade || edicao.observacoes;
    const blocoInfoCrianca = temInfoCrianca ? `
        <div class="info-crianca" style="background:var(--paper-2); padding:10px; border-radius:5px; margin-top:10px;">
          ${edicao.nomeCrianca ? `<strong>Criança:</strong> ${escapeHtml(edicao.nomeCrianca)}<br>` : ""}
          ${edicao.idade ? `<strong>Idade:</strong> ${escapeHtml(edicao.idade)}<br>` : ""}
          ${edicao.observacoes ? `<strong>Obs:</strong> ${escapeHtml(edicao.observacoes)}` : ""}
        </div>` : "";

    return `
      <div class="tag" style="border-top: 4px solid ${statusPrazo.cor}; background: var(--card-bg); padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px;">
        <div class="tag-top" style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span class="tag-id mono" style="font-weight:bold;">#${escapeHtml(p.idPedido) || "—"}</span>
          <span class="badge" style="background:${statusPrazo.cor}; color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem;">${statusPrazo.texto}</span>
        </div>
        
        <h3 style="margin: 0 0 5px 0; color: var(--teal); font-size: 1.2rem;">${escapeHtml(p.nomeVariacao) || "Sem Variação"}</h3>
        <div class="tema" style="font-size:0.85rem; color:var(--ink-soft); margin-bottom: 12px; line-height: 1.4;">${escapeHtml(p.nomeProduto) || ""}</div>
        
        ${temaManualInput}
        
        <dl style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size:0.85rem; margin-bottom:15px;">
          <dt style="color:var(--ink-soft);">Comprador</dt><dd style="margin:0; font-weight:bold;">${escapeHtml(p.comprador) || "—"}</dd>
          <dt style="color:var(--ink-soft);">Quantidade</dt><dd style="margin:0; font-weight:bold;">${escapeHtml(p.quantidade) || "—"}</dd>
          <dt style="color:var(--ink-soft);">Endereço</dt><dd style="margin:0; font-weight:bold;">${escapeHtml(p.endereco) || "—"}</dd>
          <dt style="color:var(--ink-soft);">DT Compra</dt><dd style="margin:0; font-weight:bold;">${formatarData(p.dtCompra)}</dd>
        </dl>
        <div class="producao-line" style="background:var(--paper-2); padding:10px; border-radius:5px; margin-bottom:15px; display:flex; justify-content:space-between;">
          <span>Prazo: <strong>${formatarData(p.prazoProducao)}</strong></span>
          <span style="color:${statusPrazo.cor}; font-weight:bold;">${diasTexto}</span>
        </div>
        <div class="status-row" style="display:flex; gap:10px;">
          <div class="status-row" style="display:flex; gap:10px;">
          <!-- Substituído o Select por um Input Editável -->
          <input type="text" class="status-input" data-id="${escapeHtml(p.idPedido)}" 
                 value="${escapeHtml(statusPedidoAtual)}" placeholder="Digite o status..." 
                 style="flex:1; padding:8px; border:1px solid var(--border); border-radius:5px; background:var(--card-bg); color:var(--ink);">
                 
          <button class="btn-editar" data-id="${escapeHtml(p.idPedido)}" type="button" style="padding:8px 15px; background:var(--teal); color:white; border:none; border-radius:5px; cursor:pointer;">✎ Detalhes</button>
        </div>
        ${blocoInfoCrianca}
      </div>
    `;
  }).join("");
}

/* ==============================================================
   EVENTOS (UPLOAD, BUSCA E EDIÇÃO)
   ============================================================== */
// --- LÓGICA DE NAVEGAÇÃO DAS ABAS ATUALIZADA ---
document.getElementById("btnTabProducao").addEventListener("click", function() {
    this.style.background = "var(--teal)"; this.style.color = "white"; this.style.border = "none";
    const btnFin = document.getElementById("btnTabFinalizados");
    btnFin.style.background = "var(--card-bg)"; btnFin.style.color = "var(--ink-soft)"; btnFin.style.border = "1px solid var(--border)";
    
    abaAtual = "PRODUÇÃO";
    carregarDadosDoBanco("PRODUÇÃO");
});

document.getElementById("btnTabFinalizados").addEventListener("click", function() {
    this.style.background = "var(--teal)"; this.style.color = "white"; this.style.border = "none";
    const btnProd = document.getElementById("btnTabProducao");
    btnProd.style.background = "var(--card-bg)"; btnProd.style.color = "var(--ink-soft)"; btnProd.style.border = "1px solid var(--border)";
    
    abaAtual = "FINALIZADO";
    carregarDadosDoBanco("FINALIZADO");
});


// --- LÓGICA DE FILTROS COM TEMA E STATUS ---
function pedidosFiltradosAtuais() {
  const termoGeral = normalizarTexto(document.getElementById("ppSearchInput").value);
  const termoTema = normalizarTexto(document.getElementById("ppFilterTema").value);
  const termoStatus = normalizarTexto(document.getElementById("ppFilterStatus").value);
  
  let pedidosAtivos = pedidosProcessados.filter(p => {
      const statusLocal = carregarStatusPedido(p.idPedido);
      const statusNorm = normalizarTexto(statusLocal);
      
      // Oculta os finalizados apenas se estivermos na aba de Produção
      if (abaAtual === "PRODUÇÃO" && (statusNorm === "FEITO" || statusNorm === "POSTADO")) {
          return false;
      }
      return true;
  });

  return pedidosAtivos.filter(p => {
      const edicao = carregarEdicaoPedido(p.idPedido);
      const temaAtual = normalizarTexto(edicao.temaManual || p.nomeVariacao);
      const statusAtual = normalizarTexto(carregarStatusPedido(p.idPedido));
      
      const bateGeral = !termoGeral || normalizarTexto(p.idPedido).includes(termoGeral) || normalizarTexto(p.comprador).includes(termoGeral);
      const bateTema = !termoTema || temaAtual.includes(termoTema);
      const bateStatus = !termoStatus || statusAtual.includes(termoStatus);
      
      return bateGeral && bateTema && bateStatus;
  });
}

function atualizarTela() { 
  const listaPronta = pedidosFiltradosAtuais();
  renderizarEstatisticas(listaPronta);
  renderizarPedidos(listaPronta); 
}

// Escuta a digitação nos três campos de filtro
document.getElementById("ppSearchInput").addEventListener("input", atualizarTela);
document.getElementById("ppFilterTema").addEventListener("input", atualizarTela);
document.getElementById("ppFilterStatus").addEventListener("input", atualizarTela);


// --- SALVAMENTO E AUTOMAÇÃO DO STATUS EDITÁVEL ---
document.getElementById("ppOrdersBox").addEventListener("change", async function(evento){
  
  // Salva o Campo de Status Livre
  if (evento.target.classList.contains("status-input")) {
    const idPedido = evento.target.dataset.id;
    const novoStatus = evento.target.value.trim();
    
    salvarStatusPedido(idPedido, novoStatus);

    const statusNorm = normalizarTexto(novoStatus);
    
    // Automação: Se o texto digitado for exatamente "FEITO" ou "POSTADO", envia para o banco
    if (abaAtual === "PRODUÇÃO" && (statusNorm === "FEITO" || statusNorm === "POSTADO")) {
      evento.target.closest(".tag").style.opacity = "0.4";
      evento.target.closest(".tag").style.pointerEvents = "none";

      try {
        await fetch(URL_API, {
          method: 'POST',
          body: JSON.stringify({
            acao: "atualizar_status_banco",
            idPedido: idPedido,
            novoStatusSistema: "FINALIZADO"
          })
        });
        atualizarTela(); 
      } catch (e) {
        console.error("Erro ao finalizar pedido:", e);
      }
    } else {
        atualizarTela(); // Atualiza para refletir o filtro de status em tempo real, se estiver ativo
    }
  }

  // Salva o campo de texto do Tema (Card)
  if (evento.target.classList.contains("input-tema-card")) {
    const idPedido = evento.target.dataset.id;
    const dados = carregarEdicaoPedido(idPedido);
    dados.temaManual = evento.target.value.trim();
    salvarEdicaoPedido(idPedido, dados);
    atualizarTela(); // Reflete no filtro de tema em tempo real
  }
});
// ---------------------------------------------------------------------------------


// Função reconstruída para carregar e montar os pedidos salvos no banco
async function carregarDadosDoBanco(statusDesejado) {
    document.getElementById("ppOrdersBox").innerHTML = "<p style='text-align:center; padding: 20px; color: var(--ink-soft);'>Carregando dados do banco...</p>";
    
    try {
        const response = await fetch(URL_API, { 
            method: 'POST', 
            body: JSON.stringify({ acao: "buscar_pedidos", statusFiltro: statusDesejado }) 
        });
        const resultado = await response.json();
        
        if (resultado.status === "sucesso") {
            // Reconstrói a lista global com base nas colunas do Sheets
            pedidosProcessados = resultado.dados.map(row => {
                const dataCompraObj = row[6] ? new Date(row[6]) : null;
                const prazos = calcularProgramacaoEnvio(dataCompraObj);
                
                return {
                    idPedido: String(row[0]),
                    comprador: row[1],
                    nomeVariacao: row[2], 
                    nomeProduto: row[3],
                    quantidade: row[4],
                    endereco: row[5],
                    dtCompra: dataCompraObj,
                    prazoProducao: prazos.prazo,
                    diasRestantes: prazos.diasRestantes
                };
            });
            atualizarTela();
        }
    } catch (e) {
        console.error("Erro ao buscar dados do banco:", e);
    }
}

// --- LÓGICA DE NAVEGAÇÃO DAS ABAS (PRODUÇÃO / FINALIZADOS) ---
document.getElementById("btnTabProducao").addEventListener("click", function() {
    this.style.background = "var(--teal)"; this.style.color = "white"; this.style.border = "none";
    const btnFin = document.getElementById("btnTabFinalizados");
    btnFin.style.background = "var(--card-bg)"; btnFin.style.color = "var(--ink-soft)"; btnFin.style.border = "1px solid var(--border)";
    
    carregarDadosDoBanco("PRODUÇÃO");
});

document.getElementById("btnTabFinalizados").addEventListener("click", function() {
    this.style.background = "var(--teal)"; this.style.color = "white"; this.style.border = "none";
    const btnProd = document.getElementById("btnTabProducao");
    btnProd.style.background = "var(--card-bg)"; btnProd.style.color = "var(--ink-soft)"; btnProd.style.border = "1px solid var(--border)";
    
    carregarDadosDoBanco("FINALIZADO");
});

// Dispara o carregamento automático dos pedidos em produção ao abrir o sistema
window.addEventListener('DOMContentLoaded', () => {
    carregarDadosDoBanco("PRODUÇÃO");
});
      // ---------------------------------------------------------------------------------

      atualizarTela();
    } catch(erro) {
      document.getElementById("ppFileStatus").textContent = "Erro na leitura. Confira se é .csv ou .xlsx válido.";
    }
  };
  leitor.readAsArrayBuffer(arquivo);
});

function pedidosFiltradosAtuais() {
  const termo = normalizarTexto(document.getElementById("ppSearchInput").value);
  
  // O SEGREDO ESTÁ AQUI: Filtra os pedidos que já foram marcados como FEITO ou POSTADO localmente.
  // Assim, a tela de produção fica sempre limpa.
  let pedidosAtivos = pedidosProcessados.filter(p => {
      const statusLocal = carregarStatusPedido(p.idPedido);
      return statusLocal !== "FEITO" && statusLocal !== "POSTADO";
  });

  if (!termo) return pedidosAtivos;
  return pedidosAtivos.filter(p => normalizarTexto(p.idPedido).includes(termo) || normalizarTexto(p.comprador).includes(termo) || normalizarTexto(p.nomeVariacao).includes(termo));
}

function atualizarTela() { 
  const listaPronta = pedidosFiltradosAtuais();
  renderizarEstatisticas(listaPronta); // Atualiza os números (ex: se o pedido sumir, o total diminui)
  renderizarPedidos(listaPronta); 
}

document.getElementById("ppSearchInput").addEventListener("input", atualizarTela);

// Listener Global para capturar mudanças no Status E no campo manual de Tema
document.getElementById("ppOrdersBox").addEventListener("change", async function(evento){
  
  // Lógica de Mover Status para o Banco de Dados
  if (evento.target.classList.contains("status-select")) {
    const idPedido = evento.target.dataset.id;
    const novoStatus = evento.target.value;
    
    salvarStatusPedido(idPedido, novoStatus);

    // Se marcou como FEITO ou POSTADO, tira da frente e manda pro banco
    if (novoStatus === "FEITO" || novoStatus === "POSTADO") {
      evento.target.closest(".tag").style.opacity = "0.4"; // Deixa transparente enquanto processa
      evento.target.closest(".tag").style.pointerEvents = "none"; // Impede duplo clique

      try {
        await fetch(URL_API, {
          method: 'POST',
          body: JSON.stringify({
            acao: "atualizar_status_banco",
            idPedido: idPedido,
            novoStatusSistema: "FINALIZADO"
          })
        });
        atualizarTela(); // A tela recarrega e o pedido some sozinho!
      } catch (e) {
        console.error("Erro de conexão ao finalizar pedido:", e);
      }
    }
  }

  // Lógica de Salvar o Tema Manual
  if (evento.target.classList.contains("input-tema-card")) {
    const idPedido = evento.target.dataset.id;
    const dados = carregarEdicaoPedido(idPedido);
    dados.temaManual = evento.target.value.trim();
    salvarEdicaoPedido(idPedido, dados);
  }
});

document.getElementById("ppOrdersBox").addEventListener("click", function(evento){
  const botao = evento.target.closest(".btn-editar");
  if (!botao) return;
  
  idPedidoEmEdicao = botao.dataset.id;
  const dados = carregarEdicaoPedido(idPedidoEmEdicao);
  
  // Preenche o modal
  const inputTema = document.getElementById("ppInputTema");
  if(inputTema) inputTema.value = dados.temaManual || "";
  
  document.getElementById("ppInputNomeCrianca").value = dados.nomeCrianca || "";
  document.getElementById("ppInputIdade").value = dados.idade || "";
  document.getElementById("ppInputObservacoes").value = dados.observacoes || "";
  
  document.getElementById("ppModalOverlay").style.display = "flex";
});

function fecharModalEdicao() {
  document.getElementById("ppModalOverlay").style.display = "none";
  idPedidoEmEdicao = null;
}

document.getElementById("ppBtnCancelarModal").addEventListener("click", fecharModalEdicao);
document.getElementById("ppModalOverlay").addEventListener("click", function(evento){ if (evento.target.id === "ppModalOverlay") fecharModalEdicao(); });

document.getElementById("ppBtnSalvarModal").addEventListener("click", function(){
  if (!idPedidoEmEdicao) return;
  
  const inputTema = document.getElementById("ppInputTema");
  
  salvarEdicaoPedido(idPedidoEmEdicao, {
    temaManual: inputTema ? inputTema.value.trim() : "",
    nomeCrianca: document.getElementById("ppInputNomeCrianca").value.trim(),
    idade: document.getElementById("ppInputIdade").value.trim(),
    observacoes: document.getElementById("ppInputObservacoes").value.trim(),
  });
  
  fecharModalEdicao();
  atualizarTela(); // Recarrega a tela para exibir o tema digitado
});

/* ==============================================================
   EXPORTAÇÃO DA PLANILHA ATUALIZADA
   ============================================================== */
function garantirColuna(cabecalho, nomeColuna) {
  const indiceExistente = cabecalho.findIndex(h => normalizarTexto(h) === normalizarTexto(nomeColuna));
  if (indiceExistente !== -1) return indiceExistente;
  cabecalho.push(nomeColuna);
  return cabecalho.length - 1;
}

document.getElementById("ppBtnSalvarPlanilha").addEventListener("click", function() {
  if (!linhasOriginais.length) { alert("Carregue uma planilha primeiro."); return; }

  const cabecalho = [...linhasOriginais[0]];
  const idxStatus = garantirColuna(cabecalho, "STATUS DO PEDIDO");
  const idxTemaManual = garantirColuna(cabecalho, "TEMA");
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
    linha[idxTemaManual] = edicao.temaManual;
    linha[idxNomeCrianca] = edicao.nomeCrianca;
    linha[idxIdade] = edicao.idade;
    linha[idxObservacoes] = edicao.observacoes;
    return linha;
  });

  const novaAba = XLSX.utils.aoa_to_sheet([cabecalho, ...linhasAtualizadas]);
  const novoLivro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(novoLivro, novaAba, "Pedidos");
  XLSX.writeFile(novoLivro, `${nomeArquivoAtual || "pedidos"}_atualizado.xlsx`);
});
