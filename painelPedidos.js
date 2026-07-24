/* ==============================================================
   CONFIGURAÇÃO GERAL E MAPAS DE COLUNAS
   ============================================================== */
const MAPA_COLUNAS = {
  idPedido:             ["ID DO PEDIDO"],
  opcaoEnvio:           ["OPÇÃO DE ENVIO", "OPCAO DE ENVIO"],
  dataPrevista:         ["DATA PREVISTA DE ENVIO"],
  dataCriacaoPedido:    ["DATA DE CRIAÇÃO DO PEDIDO", "DATA DE CRIACAO DO PEDIDO"],
  horaPagamentoPedido:  ["HORA DO PAGAMENTO DO PEDIDO"],
  nomeProduto:          ["NOME DO PRODUTO"],
  nomeVariacao:         ["NOME DA VARIAÇÃO", "NOME DA VARIACAO"],
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

let DIAS_PRODUCAO = 5;
function atualizarPrazoProducao(dias) { DIAS_PRODUCAO = Math.max(1, Number(dias) || 5); if (pedidosProcessados.length) { pedidosProcessados.forEach(p => { const calculo = calcularProgramacaoEnvio(p.dtCompra); p.prazoProducao = calculo.prazo; p.diasRestantes = calculo.diasRestantes; }); atualizarTela(); } }
const OPCOES_STATUS_PEDIDO = ["PRODUÇÃO", "EMBALAGEM", "CANCELADO", "FEITO", "POSTADO"];

/* ==============================================================
   ESTADO GLOBAL E UTILITÁRIOS
   ============================================================== */
let pedidosProcessados = [];
let idPedidoEmEdicao = null;
let linhasOriginais = [];
let indicesColunasAtuais = {};
let nomeArquivoAtual = "";
let abaAtual = "PRODUÇÃO";
let temasCadastrados = []; // <- NOVA VARIÁVEL
let temaEmEdicao = "";
let etapasProducao = [];
let modoVisualizacaoPedidos = "cards";
let filtroPrazoAtivo = "todos";

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
  if (valor === null || valor === undefined || valor === "") return null;
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }
  if (typeof valor === "number") {
    if (!Number.isFinite(valor)) return null;
    const dataBase = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return new Date(dataBase.getUTCFullYear(), dataBase.getUTCMonth(), dataBase.getUTCDate());
  }
  if (typeof valor === "string") {
    const texto = valor.trim().replace(/^["']|["']$/g, "");
    if (!texto || texto === "-") return null;

    // Algumas exportações trazem o número serial do Excel como texto.
    if (/^\d{5}(?:[.,]\d+)?$/.test(texto)) {
      return converterParaData(Number(texto.replace(",", ".")));
    }

    // Aceita data com horário: DD/MM/AAAA HH:mm, DD-MM-AAAA HH:mm e ISO.
    const soData = texto.split(/[ T]/)[0];
    let m = soData.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    m = soData.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

    const dataInterpretada = new Date(texto);
    if (!Number.isNaN(dataInterpretada.getTime())) {
      return new Date(dataInterpretada.getFullYear(), dataInterpretada.getMonth(), dataInterpretada.getDate());
    }
  }
  return null;
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
  const nomesAmigaveis = {
    idPedido: "ID DO PEDIDO",
    opcaoEnvio: "OPÇÃO DE ENVIO",
    dataPrevista: "DATA PREVISTA DE ENVIO",
    dataCriacaoPedido: "DATA DE CRIAÇÃO DO PEDIDO",
    horaPagamentoPedido: "HORA DO PAGAMENTO DO PEDIDO",
    nomeProduto: "NOME DO PRODUTO",
    nomeVariacao: "NOME DA VARIAÇÃO",
    quantidade: "QUANTIDADE",
    numProdutos: "Nº PRODUTOS PEDIDOS",
    comprador: "COMPRADOR",
    endereco: "ENDEREÇO"
  };
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
    return bruto ? JSON.parse(bruto) : { temaManual: "", nomeCrianca: "", idade: "", observacoes: "", dataPostagem: "" };
  } catch(erro) { return { temaManual: "", nomeCrianca: "", idade: "", observacoes: "", dataPostagem: "" }; }
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
      dataPostagem: dadosDoArquivo.dataPostagem || "",
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

    const dtCompraValor = pegar("horaPagamentoPedido") || pegar("dataCriacaoPedido");
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
      idPedido: idPedidoValor,
      opcaoEnvio: pegar("opcaoEnvio"),
      dataPrevista: pegar("dataPrevista"),
      dataCriacaoPedido: converterParaData(pegar("dataCriacaoPedido")),
      horaPagamentoPedido: pegar("horaPagamentoPedido"),
      dtCompra: converterParaData(dtCompraValor),
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
    <button type="button" class="stat-card filtro-prazo-card" data-filtro="todos" style="cursor:pointer;${filtroPrazoAtivo === "todos" ? "outline:2px solid var(--teal);" : ""}"><div class="num">${total}</div><div class="label">Total (Em Produção)</div></button>
    <button type="button" class="stat-card filtro-prazo-card" data-filtro="atrasados" style="cursor:pointer;border-left:4px solid var(--cor-alerta);${filtroPrazoAtivo === "atrasados" ? "outline:2px solid var(--cor-alerta);" : ""}"><div class="num" style="color:var(--cor-alerta);">${atrasados}</div><div class="label">Atrasados</div></button>
    <button type="button" class="stat-card filtro-prazo-card" data-filtro="urgentes" style="cursor:pointer;border-left:4px solid var(--cor-destaque);${filtroPrazoAtivo === "urgentes" ? "outline:2px solid var(--cor-destaque);" : ""}"><div class="num" style="color:var(--cor-destaque);">${urgentes}</div><div class="label">Urgentes (0-1 dia)</div></button>
    <button type="button" class="stat-card filtro-prazo-card" data-filtro="noprazo" style="cursor:pointer;border-left:4px solid var(--cor-sucesso);${filtroPrazoAtivo === "noprazo" ? "outline:2px solid var(--cor-sucesso);" : ""}"><div class="num" style="color:var(--cor-sucesso);">${noPrazo}</div><div class="label">No prazo</div></button>
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

  if (modoVisualizacaoPedidos === "lista") {
    box.innerHTML = `<div class="table-responsive"><table style="width:100%;border-collapse:collapse;"><thead><tr><th>Pedido</th><th>Tema</th><th>Comprador</th><th>Prazo</th><th>Status</th><th></th></tr></thead><tbody>${ordenados.map(p => {
      const edicao = carregarEdicaoPedido(p.idPedido), status = carregarStatusPedido(p.idPedido), tema = edicao.temaManual || p.nomeVariacao || "";
      return `<tr class="tag"><td class="mono">#${escapeHtml(p.idPedido)}</td><td><input class="tema-topo-input" data-id="${escapeHtml(p.idPedido)}" list="ppTemasFiltroList" value="${escapeHtml(tema)}" style="min-width:170px;"></td><td>${escapeHtml(p.comprador) || "—"}</td><td>${formatarData(p.prazoProducao)}</td><td><input class="status-input" data-id="${escapeHtml(p.idPedido)}" list="ppEtapasList" value="${escapeHtml(status)}" placeholder="Digite o status..."><div class="campo-data-postagem" style="display:${normalizarTexto(status) === "POSTADO" ? "block" : "none"};"><input type="date" class="data-postagem-input" data-id="${escapeHtml(p.idPedido)}" value="${escapeHtml(edicao.dataPostagem || "")}"></div></td><td><button class="btn-editar" data-id="${escapeHtml(p.idPedido)}" type="button">Detalhes</button></td></tr>`;
    }).join("")}</tbody></table></div>`;
    return;
  }

  box.innerHTML = ordenados.map(p => {
    const statusPrazo = classificarStatus(p.diasRestantes);
    const diasTexto = p.diasRestantes === null ? "sem data" : p.diasRestantes < 0 ? `${Math.abs(p.diasRestantes)} dia(s) atrasado` : `${p.diasRestantes} dia(s) restante(s)`;

    const statusPedidoAtual = carregarStatusPedido(p.idPedido);
    const edicao = carregarEdicaoPedido(p.idPedido);
    
    const temaSelecionado = edicao.temaManual || p.nomeVariacao || "";

    const temInfoCrianca = edicao.nomeCrianca || edicao.idade || edicao.observacoes;
    const blocoInfoCrianca = temInfoCrianca ? `
        <div class="info-crianca" style="background:var(--paper-2); padding:10px; border-radius:5px; margin-top:10px;">
          ${edicao.nomeCrianca ? `<strong>Criança:</strong> ${escapeHtml(edicao.nomeCrianca)}<br>` : ""}
          ${edicao.idade ? `<strong>Idade:</strong> ${escapeHtml(edicao.idade)}<br>` : ""}
          ${edicao.observacoes ? `<strong>Obs:</strong> ${escapeHtml(edicao.observacoes)}` : ""}
        </div>` : "";
    const campoDataPostagem = `
      <div class="campo-data-postagem" style="display:${normalizarTexto(statusPedidoAtual) === "POSTADO" ? "block" : "none"};margin:10px 0;">
        <label style="font-size:.75rem;font-weight:bold;color:var(--ink-soft);">DATA DA POSTAGEM</label>
        <input type="date" class="data-postagem-input" data-id="${escapeHtml(p.idPedido)}" value="${escapeHtml(edicao.dataPostagem || "")}" style="width:100%;margin-top:4px;">
      </div>`;

    return `
      <div class="tag" style="border-top: 4px solid ${statusPrazo.cor}; background: var(--card-bg); padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px;">
        <div class="tag-top" style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span class="tag-id mono" style="font-weight:bold;">#${escapeHtml(p.idPedido) || "—"}</span>
          <span class="badge" style="background:${statusPrazo.cor}; color:white; padding:4px 8px; border-radius:4px; font-size:0.8rem;">${statusPrazo.texto}</span>
        </div>
        
        <input type="text" class="tema-topo-input" data-id="${escapeHtml(p.idPedido)}" list="ppTemasFiltroList" value="${escapeHtml(temaSelecionado)}" placeholder="Digite ou selecione o tema..." aria-label="Tema do pedido" style="width:100%;margin:0 0 5px;color:var(--teal);font-size:1.2rem;font-weight:bold;border:0;border-bottom:1px dashed var(--border);background:transparent;padding:3px 0;">
        <div class="tema" style="font-size:0.85rem; color:var(--ink-soft); margin-bottom: 12px; line-height: 1.4;">${escapeHtml(p.nomeProduto) || ""}</div>

        <dl style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size:0.85rem; margin-bottom:15px;">
          <dt style="color:var(--ink-soft);">Comprador</dt><dd style="margin:0; font-weight:bold;">${escapeHtml(p.comprador) || "—"}</dd>
          <dt style="color:var(--ink-soft);">Quantidade</dt><dd style="margin:0; font-weight:bold;">${escapeHtml(p.quantidade) || "—"}</dd>
          <dt style="color:var(--ink-soft);">DT Compra</dt><dd style="margin:0; font-weight:bold;">${formatarData(p.dtCompra)}</dd>
        </dl>
        <div style="font-size:.85rem;margin:-5px 0 15px;"><span style="display:block;color:var(--ink-soft);">Endereço</span><strong style="display:block;margin-top:3px;line-height:1.35;">${escapeHtml(p.endereco) || "—"}</strong></div>
        <div class="producao-line" style="background:var(--paper-2); padding:10px; border-radius:5px; margin-bottom:15px; display:flex; justify-content:space-between;">
          <span>Prazo: <strong>${formatarData(p.prazoProducao)}</strong></span>
          <span style="color:${statusPrazo.cor}; font-weight:bold;">${diasTexto}</span>
        </div>
        <div class="status-row" style="display:flex; gap:10px;">
          <!-- Substituído o Select por um Input Editável -->
          <input type="text" class="status-input" data-id="${escapeHtml(p.idPedido)}" list="ppEtapasList"
                 value="${escapeHtml(statusPedidoAtual)}" placeholder="Digite o status..." 
                 style="flex:1; padding:8px; border:1px solid var(--border); border-radius:5px; background:var(--card-bg); color:var(--ink);">
                 
          <button class="btn-editar" data-id="${escapeHtml(p.idPedido)}" type="button" style="padding:8px 15px; background:var(--teal); color:white; border:none; border-radius:5px; cursor:pointer;">✎ Detalhes</button>
        </div>
        ${campoDataPostagem}
        ${blocoInfoCrianca}
      </div>
    `;
  }).join("");
}

/* ==============================================================
   EVENTOS (UPLOAD, BUSCA E EDIÇÃO)
   ============================================================== */

async function apiTemas(payload) {
  const response = await fetch(URL_API, { method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(payload) });
  const result = await response.json();
  if (result.status !== "sucesso") throw new Error(result.mensagem || "Operação não concluída.");
  return result;
}

async function carregarEtapasProducao() {
  try {
    const resultado = await chamarApi({ acao: "listar_etapas" });
    if (resultado.status !== "sucesso") throw new Error(resultado.mensagem || "Não foi possível carregar as etapas.");
    etapasProducao = resultado.etapas || [];
    const datalist = document.getElementById("ppEtapasList");
    datalist.replaceChildren();
    etapasProducao.forEach(etapa => { const option = document.createElement("option"); option.value = etapa; datalist.appendChild(option); });
    renderizarEtapasProducao();
    atualizarListaValoresFiltro();
  } catch (erro) {
    const mensagem = document.getElementById("mensagemEtapasProducao");
    mensagem.style.color = "var(--cor-alerta)";
    mensagem.textContent = erro.message;
  }
}

function renderizarEtapasProducao() {
  const lista = document.getElementById("listaEtapasProducao");
  lista.replaceChildren();
  etapasProducao.forEach((etapa, indice) => {
    const linha = document.createElement("div");
    linha.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:var(--bg-fundo);border-radius:8px;";
    const nome = document.createElement("span");
    nome.textContent = `${indice + 1}. ${etapa}`;
    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.textContent = "🗑️";
    excluir.title = "Excluir etapa";
    excluir.style.cssText = "width:auto;padding:5px 9px;background:var(--cor-alerta);";
    excluir.addEventListener("click", () => excluirEtapaProducao(etapa));
    linha.append(nome, excluir);
    lista.appendChild(linha);
  });
}

async function adicionarEtapaProducao() {
  const input = document.getElementById("novaEtapaProducao");
  const etapa = input.value.trim();
  if (!etapa) return;
  try {
    const resultado = await chamarApi({ acao: "salvar_etapa", etapa, usuario: obterUserLogado() });
    if (resultado.status !== "sucesso") throw new Error(resultado.mensagem || "Não foi possível cadastrar a etapa.");
    input.value = "";
    etapasProducao = resultado.etapas || [];
    await carregarEtapasProducao();
  } catch (erro) { alert(erro.message); }
}

async function excluirEtapaProducao(etapa) {
  if (!confirm(`Excluir a etapa ${etapa}?`)) return;
  try {
    const resultado = await chamarApi({ acao: "excluir_etapa", etapa, usuario: obterUserLogado() });
    if (resultado.status !== "sucesso") throw new Error(resultado.mensagem || "Não foi possível excluir a etapa.");
    await carregarEtapasProducao();
  } catch (erro) { alert(erro.message); }
}

async function carregarHistoricoPedido(pedido) {
  const box = document.getElementById("ppHistoricoPedido");
  box.textContent = "Carregando...";
  try {
    const resultado = await chamarApi({ acao: "buscar_historico_producao", pedido });
    if (resultado.status !== "sucesso") throw new Error(resultado.mensagem || "Não foi possível carregar o histórico.");
    box.replaceChildren();
    if (!(resultado.historico || []).length) { box.textContent = "Nenhuma alteração registrada."; return; }
    resultado.historico.forEach(item => {
      const linha = document.createElement("div");
      linha.style.cssText = "padding:6px 0;border-bottom:1px solid var(--border);";
      linha.textContent = `${item.data} — ${item.campo}: “${item.anterior || 'vazio'}” → “${item.novo || 'vazio'}” (${item.usuario})`;
      box.appendChild(linha);
    });
  } catch (erro) { box.textContent = `Erro: ${erro.message}`; }
}

document.getElementById("btnAdicionarEtapa").addEventListener("click", adicionarEtapaProducao);
document.getElementById("novaEtapaProducao").addEventListener("keydown", evento => { if (evento.key === "Enter") { evento.preventDefault(); adicionarEtapaProducao(); } });

async function carregarTemas() {
  try {
    const result = await apiTemas({acao:"listar_temas"});
    temasCadastrados = [...new Set((result.temas || []).map(t => String(t).trim()).filter(Boolean))];
    const listaFiltro = document.getElementById("ppTemasFiltroList");
    if (listaFiltro) {
      listaFiltro.innerHTML = temasCadastrados
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map(tema => `<option value="${escapeHtml(tema)}"></option>`)
        .join("");
    }
    atualizarListaValoresFiltro();
    atualizarTela();
  } catch (e) {
    const status = document.getElementById("ppTemaStatus");
    status.style.color = "var(--cor-alerta)"; status.textContent = e.message;
  }
}

function abrirModalTema(tema = "") {
  temaEmEdicao = String(tema || "").trim();
  document.getElementById("ppTemaModalTitulo").textContent = temaEmEdicao ? "Editar tema" : "Cadastrar tema";
  document.getElementById("ppNovoTema").value = temaEmEdicao;
  document.getElementById("ppTemaStatus").textContent = "";
  document.getElementById("ppBtnExcluirTema").style.display = temaEmEdicao ? "inline-block" : "none";
  document.getElementById("ppTemaModalOverlay").style.display = "flex";
  setTimeout(() => document.getElementById("ppNovoTema").focus(), 0);
}

function fecharModalTema() {
  document.getElementById("ppTemaModalOverlay").style.display = "none";
  temaEmEdicao = "";
}

async function cadastrarTema() {
  const input=document.getElementById("ppNovoTema"), button=document.getElementById("ppBtnCadastrarTema"), status=document.getElementById("ppTemaStatus");
  const tema=input.value.trim();
  if (!tema) { status.style.color="var(--cor-alerta)"; status.textContent="Digite o nome do tema."; return; }
  button.disabled=true; status.textContent="Salvando...";
  try {
    if (temaEmEdicao) await apiTemas({acao:"renomear_tema",temaAtual:temaEmEdicao,novoTema:tema});
    else await apiTemas({acao:"cadastrar_tema",tema});
    await carregarTemas();
    fecharModalTema();
  }
  catch(e) { status.style.color="var(--cor-alerta)"; status.textContent=e.message; }
  finally { button.disabled=false; }
}

async function excluirTema() {
  if (!temaEmEdicao || !confirm(`Excluir o tema "${temaEmEdicao}"? Ele também será removido dos pedidos que o utilizam.`)) return;
  const button=document.getElementById("ppBtnExcluirTema"), status=document.getElementById("ppTemaStatus");
  button.disabled=true; status.textContent="Excluindo...";
  try { await apiTemas({acao:"excluir_tema",tema:temaEmEdicao}); await carregarTemas(); fecharModalTema(); }
  catch(e) { status.style.color="var(--cor-alerta)"; status.textContent=e.message; }
  finally { button.disabled=false; }
}

function definirEstadoAbas() {
  const producaoAtiva = abaAtual === "PRODUÇÃO";
  const btnProducao = document.getElementById("btnTabProducao");
  const btnFinalizados = document.getElementById("btnTabFinalizados");

  btnProducao.style.background = producaoAtiva ? "var(--teal)" : "var(--card-bg)";
  btnProducao.style.color = producaoAtiva ? "white" : "var(--ink-soft)";
  btnProducao.style.border = producaoAtiva ? "none" : "1px solid var(--border)";

  btnFinalizados.style.background = producaoAtiva ? "var(--card-bg)" : "var(--teal)";
  btnFinalizados.style.color = producaoAtiva ? "var(--ink-soft)" : "white";
  btnFinalizados.style.border = producaoAtiva ? "1px solid var(--border)" : "none";
}

function atualizarListaValoresFiltro() {
  const tipo = document.getElementById("ppFilterTipo").value;
  const valores = tipo === "status" ? etapasProducao : temasCadastrados;
  const lista = document.getElementById("ppFiltroValoresList");
  lista.replaceChildren();
  [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")).forEach(valor => {
    const option = document.createElement("option"); option.value = valor; lista.appendChild(option);
  });
}

async function garantirValorCadastrado(tipo, valor) {
  if (!valor) return;
  const colecao = tipo === "status" ? etapasProducao : temasCadastrados;
  if (colecao.some(item => normalizarTexto(item) === normalizarTexto(valor))) return;
  if (tipo === "status") {
    const resultado = await chamarApi({ acao: "salvar_etapa", etapa: valor, usuario: obterUserLogado() });
    if (resultado.status !== "sucesso") throw new Error(resultado.mensagem || "Não foi possível cadastrar o status.");
    etapasProducao.push(valor);
    const option = document.createElement("option"); option.value = valor; document.getElementById("ppEtapasList").appendChild(option);
  } else {
    await apiTemas({ acao: "cadastrar_tema", tema: valor, usuario: obterUserLogado() });
    temasCadastrados.push(valor);
    const option = document.createElement("option"); option.value = valor; document.getElementById("ppTemasFiltroList").appendChild(option);
  }
  atualizarListaValoresFiltro();
}

function pedidosFiltradosAtuais(aplicarPrazo = true) {
  const termoGeral = normalizarTexto(document.getElementById("ppSearchInput").value);
  const tipoFiltro = document.getElementById("ppFilterTipo").value;
  const termoFiltro = normalizarTexto(document.getElementById("ppFilterValor").value);

  return pedidosProcessados.filter(pedido => {
    const status = normalizarTexto(carregarStatusPedido(pedido.idPedido));
    const edicao = carregarEdicaoPedido(pedido.idPedido);
    const tema = normalizarTexto(edicao.temaManual || pedido.nomeVariacao);

    if (abaAtual === "PRODUÇÃO" && (status === "FEITO" || status === "POSTADO")) {
      return false;
    }

    const correspondeGeral = !termoGeral
      || normalizarTexto(pedido.idPedido).includes(termoGeral)
      || normalizarTexto(pedido.comprador).includes(termoGeral)
      || normalizarTexto(pedido.nomeVariacao).includes(termoGeral);
    const correspondeFiltro = !termoFiltro || (tipoFiltro === "status" ? status : tema).includes(termoFiltro);
    const correspondePrazo = !aplicarPrazo || filtroPrazoAtivo === "todos"
      || (filtroPrazoAtivo === "atrasados" && pedido.diasRestantes !== null && pedido.diasRestantes < 0)
      || (filtroPrazoAtivo === "urgentes" && pedido.diasRestantes !== null && pedido.diasRestantes >= 0 && pedido.diasRestantes <= 1)
      || (filtroPrazoAtivo === "noprazo" && pedido.diasRestantes !== null && pedido.diasRestantes > 1);

    return correspondeGeral && correspondeFiltro && correspondePrazo;
  });
}

function atualizarTela() {
  renderizarEstatisticas(pedidosFiltradosAtuais(false));
  renderizarPedidos(pedidosFiltradosAtuais(true));
}

async function carregarDadosDoBanco(statusDesejado = abaAtual) {
  const ordersBox = document.getElementById("ppOrdersBox");
  ordersBox.innerHTML = "<p style='text-align:center; padding:20px; color:var(--ink-soft);'>Carregando dados do banco...</p>";

  try {
    const response = await fetch(URL_API, {
      method: "POST",
      body: JSON.stringify({ acao: "buscar_pedidos", statusFiltro: statusDesejado }),
    });
    const resultado = await response.json();

    if (!response.ok || resultado.status !== "sucesso" || !Array.isArray(resultado.dados)) {
      throw new Error(resultado.mensagem || "Não foi possível carregar os pedidos.");
    }

    pedidosProcessados = resultado.dados.map(row => {
      const dataCompra = converterParaData(row[6]);
      const prazos = calcularProgramacaoEnvio(dataCompra);
      salvarStatusPedido(String(row[0] ?? ""), row[12] ?? "");
      salvarEdicaoPedido(String(row[0] ?? ""), { temaManual: row[2] ?? "", nomeCrianca: row[13] ?? "", idade: row[14] ?? "", observacoes: row[15] ?? "", dataPostagem: row[16] ?? "" });

      return {
        idPedido: String(row[0] ?? ""),
        comprador: row[1] ?? "",
        nomeVariacao: row[2] ?? "",
        nomeProduto: row[3] ?? "",
        quantidade: row[4] ?? "",
        endereco: row[5] ?? "",
        dtCompra: dataCompra,
        prazoProducao: prazos.prazo,
        diasRestantes: prazos.diasRestantes,
      };
    });

    document.getElementById("ppSearchBox").style.display = "block";
    atualizarTela();
  } catch (erro) {
    console.error("Erro ao buscar dados do banco:", erro);
    ordersBox.innerHTML = `<p style="text-align:center; padding:20px; color:var(--cor-alerta);">${escapeHtml(erro.message)}</p>`;
  }
}

async function selecionarAba(novaAba) {
  abaAtual = novaAba;
  definirEstadoAbas();
  await carregarDadosDoBanco(novaAba);
}

document.getElementById("btnTabProducao").addEventListener("click", () => selecionarAba("PRODUÇÃO"));
document.getElementById("btnTabFinalizados").addEventListener("click", () => selecionarAba("FINALIZADO"));
document.getElementById("ppSearchInput").addEventListener("input", atualizarTela);
document.getElementById("ppFilterTipo").addEventListener("change", () => { document.getElementById("ppFilterValor").value = ""; atualizarListaValoresFiltro(); atualizarTela(); });
document.getElementById("ppFilterValor").addEventListener("input", atualizarTela);
document.getElementById("ppFilterValor").addEventListener("change", async evento => {
  try { await garantirValorCadastrado(document.getElementById("ppFilterTipo").value, evento.target.value.trim()); }
  catch (erro) { alert(erro.message); }
  atualizarTela();
});
document.getElementById("ppBtnVistaCards").addEventListener("click", () => { modoVisualizacaoPedidos = "cards"; document.getElementById("ppBtnVistaCards").style.background = "var(--teal)"; document.getElementById("ppBtnVistaLista").style.background = "var(--card-bg)"; atualizarTela(); });
document.getElementById("ppBtnVistaLista").addEventListener("click", () => { modoVisualizacaoPedidos = "lista"; document.getElementById("ppBtnVistaLista").style.background = "var(--teal)"; document.getElementById("ppBtnVistaLista").style.color = "white"; document.getElementById("ppBtnVistaCards").style.background = "var(--card-bg)"; atualizarTela(); });
document.getElementById("ppStatsBox").addEventListener("click", evento => { const card = evento.target.closest(".filtro-prazo-card"); if (!card) return; filtroPrazoAtivo = card.dataset.filtro; atualizarTela(); });
document.getElementById("ppBtnAbrirTema").addEventListener("click", () => abrirModalTema());
document.getElementById("ppBtnCadastrarTema").addEventListener("click", cadastrarTema);
document.getElementById("ppBtnExcluirTema").addEventListener("click", excluirTema);
document.getElementById("ppBtnCancelarTema").addEventListener("click", fecharModalTema);
document.getElementById("ppTemaModalOverlay").addEventListener("click", e => { if (e.target.id === "ppTemaModalOverlay") fecharModalTema(); });
document.getElementById("ppNovoTema").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); cadastrarTema(); } });

document.getElementById("ppFileInput").addEventListener("change", async function(evento) {
  const arquivo = evento.target.files[0];
  if (!arquivo) return;

  const statusBox = document.getElementById("ppFileStatus");
  statusBox.textContent = "Lendo arquivo...";

  try {
    const dadosBrutos = new Uint8Array(await arquivo.arrayBuffer());
    const planilha = XLSX.read(dadosBrutos, { type: "array", cellDates: true });
    const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json(primeiraAba, { header: 1, defval: "" });
    const resultado = processarPlanilha(linhas);

    pedidosProcessados = resultado.pedidos;
    linhasOriginais = linhas;
    indicesColunasAtuais = resultado.indices;
    nomeArquivoAtual = arquivo.name.replace(/\.[^.]+$/, "");

    statusBox.textContent = `Arquivo: ${arquivo.name} — enviando pedidos...`;
    document.getElementById("ppDiagnostico").innerHTML = diagnosticarColunas(resultado.indices);
    document.getElementById("ppSearchBox").style.display = "block";
    document.getElementById("ppBtnSalvarPlanilha").style.display = "inline-block";
    atualizarTela();

    const dados = pedidosProcessados.map(pedido => {
      const edicao = carregarEdicaoPedido(pedido.idPedido);
      return [
        pedido.idPedido,
        pedido.comprador,
        edicao.temaManual || pedido.nomeVariacao,
        pedido.nomeProduto,
        pedido.quantidade,
        pedido.endereco,
        pedido.dtCompra ? pedido.dtCompra.toISOString() : "",
        new Date().toISOString(),
      ];
    });
    const producoesImportadas = pedidosProcessados.map(pedido => {
      const edicao = carregarEdicaoPedido(pedido.idPedido);
      return { pedido: pedido.idPedido, etapa: carregarStatusPedido(pedido.idPedido) || "AGUARDANDO", crianca: edicao.nomeCrianca || "", idade: edicao.idade || "", observacoes: edicao.observacoes || "", dataPostagem: edicao.dataPostagem || "" };
    });

    const response = await fetch(URL_API, {
      method: "POST",
      body: JSON.stringify({ acao: "salvar_historico_lote", dados, producoes: producoesImportadas, usuario: obterUserLogado() }),
    });
    const resposta = await response.json();

    if (!response.ok || resposta.status === "erro") {
      throw new Error(resposta.mensagem || "Não foi possível salvar os pedidos.");
    }

    const inseridos = Number(resposta.inseridos || 0);
    const atualizados = Number(resposta.atualizados || 0);
    statusBox.textContent = `Sucesso! ${inseridos} novo(s) e ${atualizados} pedido(s) existente(s) atualizado(s).`;
    await selecionarAba("PRODUÇÃO");
  } catch (erro) {
    console.error("Erro ao importar planilha:", erro);
    statusBox.textContent = `Erro: ${erro.message || "Confira se o arquivo é CSV ou XLSX válido."}`;
  } finally {
    evento.target.value = "";
  }
});

document.getElementById("ppOrdersBox").addEventListener("change", async function(evento) {
  if (evento.target.classList.contains("status-input")) {
    const idPedido = evento.target.dataset.id;
    const novoStatus = evento.target.value.trim();
    const edicaoAtual = carregarEdicaoPedido(idPedido);
    const statusNormalizado = normalizarTexto(novoStatus);

    try { await garantirValorCadastrado("status", novoStatus); }
    catch (erro) { alert(erro.message); return; }

    if (statusNormalizado === "POSTADO" && !edicaoAtual.dataPostagem) {
      salvarStatusPedido(idPedido, novoStatus);
      const cardPostado = evento.target.closest(".tag");
      const campoPostagem = cardPostado ? cardPostado.querySelector(".campo-data-postagem") : null;
      if (campoPostagem) campoPostagem.style.display = "block";
      const inputPostagem = campoPostagem ? campoPostagem.querySelector(".data-postagem-input") : null;
      if (inputPostagem) inputPostagem.focus();
      return;
    }

    try {
      const resultadoProducao = await chamarApi({ acao: "salvar_producao", producao: { pedido: idPedido, etapa: novoStatus, crianca: edicaoAtual.nomeCrianca, idade: edicaoAtual.idade, observacoes: edicaoAtual.observacoes, dataPostagem: edicaoAtual.dataPostagem || "", usuario: obterUserLogado() } });
      if (resultadoProducao.status !== "sucesso") throw new Error(resultadoProducao.mensagem || "Não foi possível salvar o status.");
      salvarStatusPedido(idPedido, novoStatus);
    } catch (erro) {
      alert(erro.message);
      await carregarDadosDoBanco(abaAtual);
      return;
    }

    if (abaAtual === "PRODUÇÃO" && (statusNormalizado === "FEITO" || statusNormalizado === "POSTADO")) {
      const card = evento.target.closest(".tag");
      if (card) {
        card.style.opacity = "0.4";
        card.style.pointerEvents = "none";
      }

      try {
        const response = await fetch(URL_API, {
          method: "POST",
          body: JSON.stringify({
            acao: "atualizar_status_banco",
            idPedido,
            novoStatusSistema: "FINALIZADO",
          }),
        });
        const resultado = await response.json();

        if (!response.ok || resultado.status === "erro") {
          throw new Error(resultado.mensagem || "Não foi possível finalizar o pedido.");
        }

        await selecionarAba(statusNormalizado === "POSTADO" ? "FINALIZADO" : abaAtual);
      } catch (erro) {
        console.error("Erro ao finalizar pedido:", erro);
        if (card) {
          card.style.opacity = "1";
          card.style.pointerEvents = "auto";
        }
        alert(erro.message);
      }
    } else {
      atualizarTela();
    }
  }

  if (evento.target.classList.contains("data-postagem-input")) {
    const idPedido = evento.target.dataset.id;
    const dataPostagem = evento.target.value;
    if (!dataPostagem) return;
    const edicao = carregarEdicaoPedido(idPedido);
    const etapa = carregarStatusPedido(idPedido) || "POSTADO";
    try {
      const resultado = await chamarApi({ acao: "salvar_producao", producao: { pedido: idPedido, etapa: "POSTADO", crianca: edicao.nomeCrianca, idade: edicao.idade, observacoes: edicao.observacoes, dataPostagem, usuario: obterUserLogado() } });
      if (resultado.status !== "sucesso") throw new Error(resultado.mensagem || "Não foi possível salvar a postagem.");
      edicao.dataPostagem = dataPostagem;
      salvarEdicaoPedido(idPedido, edicao);
      salvarStatusPedido(idPedido, etapa);
      const finalizacao = await chamarApi({ acao: "atualizar_status_banco", idPedido, novoStatusSistema: "FINALIZADO" });
      if (finalizacao.status !== "sucesso") throw new Error(finalizacao.mensagem || "Não foi possível finalizar o pedido.");
      await selecionarAba("FINALIZADO");
    } catch (erro) { alert(erro.message); }
  }

  if (evento.target.classList.contains("tema-topo-input")) {
    const input = evento.target, idPedido = input.dataset.id, tema = input.value.trim();
    input.disabled = true;
    try {
      await garantirValorCadastrado("tema", tema);
      await apiTemas({acao:"atualizar_tema_pedido",idPedido,tema,usuario:obterUserLogado()});
      const dados=carregarEdicaoPedido(idPedido); dados.temaManual=tema; salvarEdicaoPedido(idPedido,dados);
    } catch(e) { alert(e.message); }
    finally { input.disabled=false; }
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  if (typeof carregarParametros === "function") await carregarParametros(false);
  definirEstadoAbas();
  carregarTemas();
  carregarEtapasProducao();
  atualizarListaValoresFiltro();
  carregarDadosDoBanco("PRODUÇÃO");
});

document.getElementById("ppOrdersBox").addEventListener("click", async function(evento){
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
  await carregarHistoricoPedido(idPedidoEmEdicao);
  
  document.getElementById("ppModalOverlay").style.display = "flex";
});

function fecharModalEdicao() {
  document.getElementById("ppModalOverlay").style.display = "none";
  idPedidoEmEdicao = null;
}

document.getElementById("ppBtnCancelarModal").addEventListener("click", fecharModalEdicao);
document.getElementById("ppModalOverlay").addEventListener("click", function(evento){ if (evento.target.id === "ppModalOverlay") fecharModalEdicao(); });

document.getElementById("ppBtnSalvarModal").addEventListener("click", async function(){
  if (!idPedidoEmEdicao) return;
  
  const inputTema = document.getElementById("ppInputTema");
  
  const dadosAtualizados = {
    temaManual: inputTema ? inputTema.value.trim() : "",
    nomeCrianca: document.getElementById("ppInputNomeCrianca").value.trim(),
    idade: document.getElementById("ppInputIdade").value.trim(),
    observacoes: document.getElementById("ppInputObservacoes").value.trim(),
  };

  try {
    dadosAtualizados.dataPostagem = carregarEdicaoPedido(idPedidoEmEdicao).dataPostagem || "";
    const resultado = await chamarApi({ acao: "salvar_producao", producao: { pedido: idPedidoEmEdicao, etapa: carregarStatusPedido(idPedidoEmEdicao), crianca: dadosAtualizados.nomeCrianca, idade: dadosAtualizados.idade, observacoes: dadosAtualizados.observacoes, dataPostagem: dadosAtualizados.dataPostagem, usuario: obterUserLogado() } });
    if (resultado.status !== "sucesso") throw new Error(resultado.mensagem || "Não foi possível salvar os detalhes.");
    if (dadosAtualizados.temaManual) await apiTemas({ acao: "atualizar_tema_pedido", idPedido: idPedidoEmEdicao, tema: dadosAtualizados.temaManual, usuario: obterUserLogado() });
    salvarEdicaoPedido(idPedidoEmEdicao, dadosAtualizados);
  } catch (erro) {
    alert(erro.message);
    return;
  }
  
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
