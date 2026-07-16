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
let abaAtual = "PRODUÇÃO";
let temasCadastrados = []; // <- NOVA VARIÁVEL

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
    const edicao = carregarEdicaoPedido(p.idPedido);
    
    const temaSelecionado = edicao.temaManual || p.nomeVariacao || "";
    const opcoesTemaHtml = [...new Set([...temasCadastrados, temaSelecionado].filter(Boolean))].sort((x,y) => x.localeCompare(y, "pt-BR")).map(tema => `<option value="${escapeHtml(tema)}"${tema === temaSelecionado ? " selected" : ""}>${escapeHtml(tema)}</option>`).join("");
    const temaManualInput = `
        <div style="margin-bottom:15px;">
          <label style="font-size:.75rem;font-weight:bold;color:var(--ink-soft);text-transform:uppercase;">Tema</label>
          <select class="select-tema-card" data-id="${escapeHtml(p.idPedido)}" style="width:100%;margin-top:4px;padding:8px;border-radius:6px;border:1px solid var(--border);background:var(--paper-2);color:var(--ink);">
            <option value="">Selecione um tema...</option>${opcoesTemaHtml}
          </select>
          <span class="tema-save-status" style="display:block;min-height:16px;margin-top:4px;font-size:.75rem;"></span>
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

async function apiTemas(payload) {
  const response = await fetch(URL_API, { method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(payload) });
  const result = await response.json();
  if (result.status !== "sucesso") throw new Error(result.mensagem || "Operação não concluída.");
  return result;
}

async function carregarTemas() {
  try {
    const result = await apiTemas({acao:"listar_temas"});
    temasCadastrados = [...new Set((result.temas || []).map(t => String(t).trim()).filter(Boolean))];
    atualizarTela();
  } catch (e) {
    const status = document.getElementById("ppTemaStatus");
    status.style.color = "var(--cor-alerta)"; status.textContent = e.message;
  }
}

async function cadastrarTema() {
  const input=document.getElementById("ppNovoTema"), button=document.getElementById("ppBtnCadastrarTema"), status=document.getElementById("ppTemaStatus");
  const tema=input.value.trim();
  if (!tema) { status.style.color="var(--cor-alerta)"; status.textContent="Digite o nome do tema."; return; }
  button.disabled=true; status.textContent="Cadastrando...";
  try { await apiTemas({acao:"cadastrar_tema",tema}); input.value=""; status.style.color="var(--cor-sucesso)"; status.textContent="Tema cadastrado."; await carregarTemas(); }
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

function pedidosFiltradosAtuais() {
  const termoGeral = normalizarTexto(document.getElementById("ppSearchInput").value);
  const termoTema = normalizarTexto(document.getElementById("ppFilterTema").value);
  const termoStatus = normalizarTexto(document.getElementById("ppFilterStatus").value);

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
    const correspondeTema = !termoTema || tema.includes(termoTema);
    const correspondeStatus = !termoStatus || status.includes(termoStatus);

    return correspondeGeral && correspondeTema && correspondeStatus;
  });
}

function atualizarTela() {
  const pedidos = pedidosFiltradosAtuais();
  renderizarEstatisticas(pedidos);
  renderizarPedidos(pedidos);
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
      const dataCompra = row[6] ? new Date(row[6]) : null;
      const prazos = calcularProgramacaoEnvio(dataCompra);

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
document.getElementById("ppFilterTema").addEventListener("input", atualizarTela);
document.getElementById("ppFilterStatus").addEventListener("input", atualizarTela);
document.getElementById("ppBtnCadastrarTema").addEventListener("click", cadastrarTema);
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

    const response = await fetch(URL_API, {
      method: "POST",
      body: JSON.stringify({ acao: "salvar_historico_lote", dados }),
    });
    const resposta = await response.json();

    if (!response.ok || resposta.status === "erro") {
      throw new Error(resposta.mensagem || "Não foi possível salvar os pedidos.");
    }

    statusBox.textContent = `Sucesso! ${resposta.inseridos ?? dados.length} pedido(s) processado(s).`;
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
    salvarStatusPedido(idPedido, novoStatus);

    const statusNormalizado = normalizarTexto(novoStatus);
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

        await carregarDadosDoBanco(abaAtual);
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

  if (evento.target.classList.contains("select-tema-card")) {
    const select=evento.target, idPedido=select.dataset.id, tema=select.value, status=select.parentElement.querySelector(".tema-save-status");
    select.disabled=true; status.textContent="Salvando...";
    try {
      await apiTemas({acao:"atualizar_tema_pedido",idPedido,tema});
      const dados=carregarEdicaoPedido(idPedido); dados.temaManual=tema; salvarEdicaoPedido(idPedido,dados);
      status.style.color="var(--cor-sucesso)"; status.textContent="Tema salvo.";
    } catch(e) { status.style.color="var(--cor-alerta)"; status.textContent=e.message; }
    finally { select.disabled=false; }
  }
});

window.addEventListener("DOMContentLoaded", () => {
  definirEstadoAbas();
  carregarTemas();
  carregarDadosDoBanco("PRODUÇÃO");
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
