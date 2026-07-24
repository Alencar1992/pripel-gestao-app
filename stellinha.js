(function () {
  "use strict";

  const BASE_LOCAL = [
    { modulo:"Painel Principal", palavras:"dashboard painel saldo entradas saídas resumo", pergunta:"Como funciona o Painel Principal?", resposta:"O Painel Principal mostra as entradas, saídas e o saldo atual. Os valores são atualizados a partir das vendas e despesas registradas." },
    { modulo:"Vendas", palavras:"venda cliente pedido pagamento entrega cancelar editar pesquisar", pergunta:"Como cadastrar uma venda?", resposta:"Abra Gestão Financeira → Vendas e clique em Adicionar Nova Venda. Preencha cliente, produtos, tema, pagamento e entrega. Ao concluir, o sistema gera o número do pedido e atualiza o Dashboard e o Cronograma." },
    { modulo:"Vendas", palavras:"cancelar venda editar localizar pesquisa", pergunta:"Como editar ou cancelar uma venda?", resposta:"Na tela Vendas, localize o pedido pela pesquisa. Use Editar para corrigir os dados ou Cancelar para encerrar a venda. O cancelamento preserva o registro para histórico." },
    { modulo:"Despesas", palavras:"despesa cadastrar quitar excluir editar categoria período", pergunta:"Como controlar despesas?", resposta:"Em Gestão Financeira → Despesas você pode cadastrar, pesquisar, editar, quitar e excluir despesas. Use categoria e período para filtrar os registros." },
    { modulo:"Fluxo de Caixa", palavras:"fluxo caixa movimentação entrada saída histórico", pergunta:"O que aparece no Fluxo de Caixa?", resposta:"O Fluxo de Caixa reúne as movimentações financeiras registradas, separando entradas e saídas para facilitar a conferência." },
    { modulo:"Precificação", palavras:"precificação preço custo margem taxa shopee link", pergunta:"Como usar a Precificação?", resposta:"Informe os custos do produto e selecione a forma de venda. O sistema considera matéria-prima, custos extras, margem e as taxas configuradas para sugerir o preço." },
    { modulo:"Produtos e Custos", palavras:"produto matéria prima custo extra margem cadastrar excluir", pergunta:"Como cadastrar custos de um produto?", resposta:"Abra Configurações → Custos Base. Cadastre nome, matéria-prima, custos extras e margem desejada. Esses dados alimentam a Precificação." },
    { modulo:"Resumo", palavras:"resumo mensal lucro real resultado comparativo mês", pergunta:"Como consultar o resultado mensal?", resposta:"Em Gestão Financeira → Resumo, escolha o mês. A tela apresenta resultado, lucro real e comparação com o mês anterior." },
    { modulo:"Cronograma", palavras:"cronograma produção pedido aguardando status postado finalizado data postagem", pergunta:"Como funciona o Cronograma?", resposta:"O Cronograma separa pedidos aguardando início, em produção e finalizados. Você pode editar tema e status, registrar criança, idade, observações e informar a data ao marcar um pedido como POSTADO." },
    { modulo:"Cronograma", palavras:"prazo data limite compra cinco dias planilha envio", pergunta:"Qual a diferença entre Prazo e Data Limite?", resposta:"PRAZO é calculado pela data da compra mais 5 dias. DATA LIMITE vem da coluna “Data prevista de envio” da planilha importada." },
    { modulo:"Cronograma", palavras:"tema cadastrar editar excluir filtro", pergunta:"Como cadastrar ou editar um tema?", resposta:"No campo Tema, digite ou selecione uma opção. Um tema novo é cadastrado na lista. Use o lápis quando disponível para editar ou excluir o tema selecionado." },
    { modulo:"Cronograma", palavras:"filtro cards lista atrasado urgente atenção prazo tema status postagem", pergunta:"Como filtrar os pedidos?", resposta:"Use os cards de prazo ou o campo Filtrar por. É possível filtrar por tema, status ou data de postagem. Alterne entre Cards e Lista conforme a visualização desejada." },
    { modulo:"Parâmetros", palavras:"parâmetro prazo taxa categoria etapa produção configurar", pergunta:"O que posso configurar nos Parâmetros?", resposta:"Em Configurações → Parâmetros você define prazo de produção, taxas, categorias de despesas e etapas disponíveis para a produção." },
    { modulo:"Backup", palavras:"backup cópia segurança restaurar banco", pergunta:"Como criar um backup?", resposta:"Abra Configurações → Parâmetros e clique em Criar backup agora. O sistema cria cópias datadas das principais abas do banco sem apagar os backups anteriores." },
    { modulo:"Acesso", palavras:"login senha usuário cadastro alterar senha admin", pergunta:"Como acessar ou alterar a senha?", resposta:"Na tela inicial, use Cadastrar Usuário para criar uma conta ou Alterar Senha para definir uma nova senha. O administrador utiliza o acesso administrativo configurado pelo sistema." }
  ];

  const MODULOS = [...new Set(BASE_LOCAL.map(item => item.modulo))];
  const launcher = document.getElementById("stellinhaLauncher");
  const panel = document.getElementById("stellinhaPanel");
  const fechar = document.getElementById("stellinhaFechar");
  const mensagens = document.getElementById("stellinhaMensagens");
  const acoes = document.getElementById("stellinhaAcoes");
  const form = document.getElementById("stellinhaFormPergunta");
  const input = document.getElementById("stellinhaPergunta");
  let baseConhecimento = BASE_LOCAL.slice();
  let iniciou = false;
  let modo = "inicio";
  let etapaSuporte = 0;
  let chamado = {};

  const perguntasSuporte = [
    ["modulo", "Em qual tela ou função aconteceu o problema?", MODULOS],
    ["tipo", "Qual é o tipo do problema?", ["Erro na tela", "Dados incorretos", "Função não responde", "Acesso/Login", "Sugestão de melhoria", "Outro"]],
    ["descricao", "Descreva o problema com suas palavras.", null],
    ["passos", "Quais passos você fez antes do problema acontecer?", null],
    ["esperado", "O que você esperava que acontecesse?", null],
    ["encontrado", "O que aconteceu no lugar?", null],
    ["urgencia", "Qual é a urgência?", ["Baixa", "Normal", "Alta", "Sistema parado"]],
    ["contato", "Informe um telefone ou e-mail para retorno.", null]
  ];

  function normalizar(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\w\s]/g, " ");
  }

  function msg(texto, autor) {
    const div = document.createElement("div");
    div.className = "stellinha-msg " + (autor || "bot");
    div.textContent = texto;
    mensagens.appendChild(div);
    mensagens.scrollTop = mensagens.scrollHeight;
  }

  function botoes(opcoes, callback, principal) {
    acoes.replaceChildren();
    (opcoes || []).forEach((opcao, indice) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = opcao;
      if (principal && indice < 2) btn.classList.add("stellinha-acao-principal");
      btn.addEventListener("click", () => callback(opcao));
      acoes.appendChild(btn);
    });
  }

  function habilitarPergunta(placeholder) {
    form.hidden = false;
    input.placeholder = placeholder || "Digite sua pergunta...";
    input.focus();
  }

  function desabilitarPergunta() {
    form.hidden = true;
    input.value = "";
  }

  async function carregarBaseExterna() {
    try {
      const resultado = await chamarApi({ acao: "listar_base_conhecimento" });
      if (resultado.status === "sucesso" && Array.isArray(resultado.artigos) && resultado.artigos.length) {
        baseConhecimento = resultado.artigos;
      }
    } catch (_) {
      baseConhecimento = BASE_LOCAL.slice();
    }
  }

  function menuInicial() {
    modo = "inicio";
    desabilitarPergunta();
    msg("Olá! Eu sou a Stellinha. Como posso ajudar você hoje?");
    botoes(["1. Ajuda", "2. Suporte técnico"], opcao => {
      msg(opcao, "user");
      if (opcao.startsWith("1")) iniciarAjuda(); else iniciarSuporte();
    }, true);
  }

  function iniciarAjuda() {
    modo = "ajuda";
    msg("Em qual parte do PriPel você precisa de ajuda? Escolha um módulo ou escreva sua dúvida.");
    botoes(MODULOS.concat(["Voltar ao início"]), opcao => {
      msg(opcao, "user");
      if (opcao === "Voltar ao início") return menuInicial();
      const artigos = baseConhecimento.filter(item => item.modulo === opcao);
      if (!artigos.length) return responderPergunta(opcao);
      msg(artigos.map(item => `• ${item.pergunta}\n${item.resposta}`).join("\n\n"));
      botoes(["Fazer outra pergunta", "Suporte técnico", "Voltar ao início"], tratarAtalhoAjuda);
      habilitarPergunta("Digite outra dúvida...");
    });
    habilitarPergunta("Ex.: Como cadastrar uma venda?");
  }

  function tratarAtalhoAjuda(opcao) {
    msg(opcao, "user");
    if (opcao === "Suporte técnico") iniciarSuporte();
    else if (opcao === "Voltar ao início") menuInicial();
    else iniciarAjuda();
  }

  function responderPergunta(pergunta) {
    const termos = normalizar(pergunta).split(/\s+/).filter(t => t.length > 2);
    const encontrados = baseConhecimento.map(item => {
      const texto = normalizar(`${item.modulo} ${item.palavras || ""} ${item.pergunta} ${item.resposta}`);
      return { item, pontos: termos.reduce((soma, termo) => soma + (texto.includes(termo) ? 1 : 0), 0) };
    }).filter(r => r.pontos > 0).sort((a, b) => b.pontos - a.pontos).slice(0, 2);

    if (!encontrados.length) {
      msg("Ainda não encontrei uma orientação específica para essa pergunta. Posso transformar sua dúvida em um chamado para o Lucas.");
      botoes(["Abrir suporte técnico", "Tentar outra pergunta", "Voltar ao início"], opcao => {
        msg(opcao, "user");
        if (opcao === "Abrir suporte técnico") iniciarSuporte();
        else if (opcao === "Voltar ao início") menuInicial();
        else iniciarAjuda();
      });
      return;
    }
    msg(encontrados.map(r => `${r.item.pergunta}\n${r.item.resposta}`).join("\n\n"));
    botoes(["Fazer outra pergunta", "Suporte técnico", "Voltar ao início"], tratarAtalhoAjuda);
  }

  function iniciarSuporte() {
    modo = "suporte";
    etapaSuporte = 0;
    chamado = { usuario: typeof obterUserLogado === "function" ? obterUserLogado() : "Desconhecido" };
    msg("Vou preparar um chamado completo para o Lucas. Responda algumas perguntas rápidas.");
    perguntarSuporte();
  }

  function perguntarSuporte() {
    const atual = perguntasSuporte[etapaSuporte];
    if (!atual) return confirmarChamado();
    msg(atual[1]);
    if (atual[2]) {
      desabilitarPergunta();
      botoes(atual[2].concat(["Cancelar chamado"]), opcao => {
        msg(opcao, "user");
        if (opcao === "Cancelar chamado") return menuInicial();
        chamado[atual[0]] = opcao;
        etapaSuporte++;
        perguntarSuporte();
      });
    } else {
      botoes(["Cancelar chamado"], () => menuInicial());
      habilitarPergunta("Digite sua resposta...");
    }
  }

  function confirmarChamado() {
    desabilitarPergunta();
    const resumo = `Revise o chamado:\n\nMódulo: ${chamado.modulo}\nTipo: ${chamado.tipo}\nProblema: ${chamado.descricao}\nUrgência: ${chamado.urgencia}\nContato: ${chamado.contato}`;
    msg(resumo);
    botoes(["Enviar chamado", "Cancelar"], async opcao => {
      msg(opcao, "user");
      if (opcao === "Cancelar") return menuInicial();
      await enviarChamado();
    }, true);
  }

  async function enviarChamado() {
    acoes.replaceChildren();
    msg("Enviando o chamado...");
    try {
      const resultado = await chamarApi({ acao: "abrir_chamado", chamado });
      if (resultado.status !== "sucesso") throw new Error(resultado.mensagem || "Falha ao registrar.");
      msg(`Chamado enviado com sucesso!\nProtocolo: ${resultado.protocolo}\nO pedido foi registrado para análise do Lucas.`);
      botoes(["Nova ajuda", "Voltar ao início"], opcao => opcao === "Nova ajuda" ? iniciarAjuda() : menuInicial());
    } catch (erro) {
      msg("Não consegui registrar o chamado no servidor. O backend da Stellinha precisa ser publicado. Suas respostas continuam nesta conversa para você não perder o preenchimento.");
      botoes(["Tentar novamente", "Voltar ao início"], opcao => opcao === "Tentar novamente" ? enviarChamado() : menuInicial());
    }
  }

  form.addEventListener("submit", evento => {
    evento.preventDefault();
    const valor = input.value.trim();
    if (!valor) return;
    input.value = "";
    msg(valor, "user");
    if (modo === "suporte") {
      chamado[perguntasSuporte[etapaSuporte][0]] = valor;
      etapaSuporte++;
      perguntarSuporte();
    } else {
      responderPergunta(valor);
    }
  });

  launcher.addEventListener("click", () => {
    const abrir = !panel.classList.contains("aberta");
    panel.classList.toggle("aberta", abrir);
    panel.setAttribute("aria-hidden", String(!abrir));
    launcher.setAttribute("aria-expanded", String(abrir));
    if (abrir && !iniciou) {
      iniciou = true;
      menuInicial();
      carregarBaseExterna();
    }
  });
  fechar.addEventListener("click", () => {
    panel.classList.remove("aberta");
    panel.setAttribute("aria-hidden", "true");
    launcher.setAttribute("aria-expanded", "false");
  });
})();
