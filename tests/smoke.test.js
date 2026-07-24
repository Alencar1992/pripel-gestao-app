const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const raiz = path.resolve(__dirname, '..');
const ler = arquivo => fs.readFileSync(path.join(raiz, arquivo), 'utf8');
const html = ler('index.html');
const script = ler('script.js');
const pedidos = ler('painelPedidos.js');
const stellinha = ler('stellinha.js');
const chamados = ler('chamados.js');
const css = ler('style.css');

new Function(script);
new Function(pedidos);
new Function(stellinha);
new Function(chamados);

[
  'mesResumo', 'resumoLucro', 'formParametros', 'btnCriarBackup',
  'calcProduto', 'formProduto', 'ppEtapasList', 'ppHistoricoPedido',
  'ppFilterTipo', 'ppFilterValor', 'ppListaFiltroGerenciavel',
  'ppBtnVistaCards', 'ppBtnVistaLista', 'btnTabAguardando'
].forEach(id => assert.match(html, new RegExp(`id=["']${id}["']`), `ID ausente: ${id}`));

[
  'resumo_mensal', 'carregar_parametros', 'salvar_parametros', 'criar_backup',
  'listar_produtos', 'salvar_produto', 'listar_despesas', 'listar_vendas'
].forEach(acao => assert.ok(script.includes(acao), `Ação ausente em script.js: ${acao}`));

assert.ok(script.includes('definirMenuRecolhido(true)'), 'Menu não recolhe automaticamente após navegar.');
assert.match(html, /class="menu-icon"/, 'Ícones vetoriais do menu ausentes.');
assert.match(css, /\.sidebar\.recolhida\s*\{[^}]*width:\s*76px/s, 'Modo compacto do menu lateral ausente.');

[
  'salvar_producao', 'buscar_historico_producao', 'listar_etapas',
  'data-postagem-input', 'POSTADO', 'tema-topo-input', 'filtro-prazo-card'
].forEach(item => assert.ok(pedidos.includes(item), `Integração ausente em painelPedidos.js: ${item}`));

assert.ok(html.includes('Data de postagem (PriPel)'), 'Filtro por data de postagem ausente.');
assert.ok(pedidos.includes('DATA LIMITE'), 'Card não exibe o rótulo Data limite.');
assert.ok(pedidos.includes('PRAZO: <strong>${formatarData(p.prazoProducao)}'), 'Card não exibe o prazo calculado pela data da compra.');
assert.ok(pedidos.includes('<strong>${formatarData(p.dataPrevista)}</strong>'), 'Card não exibe separadamente a data limite da planilha.');
assert.ok(!pedidos.includes('dataPrevista || p.prazoProducao'), 'Prazo e data limite não podem ser tratados como a mesma informação.');
assert.match(pedidos, /prazo\.setDate\(prazo\.getDate\(\) \+ DIAS_PRODUCAO\)/, 'Prazo não é calculado pela data da compra mais os dias de produção.');
assert.ok(pedidos.includes('ⓘ Informações'), 'Botão Informações ausente.');
assert.match(pedidos, /idade:\s*row\[14\]\s*\|\|\s*"0"/, 'Idade vazia não é normalizada para zero.');
assert.ok(pedidos.includes('class="table-responsive tabela-pedidos-lista"'), 'Modo lista não usa tabela própria em largura total.');
assert.ok(pedidos.includes('<th>Endereço</th>'), 'Modo lista não exibe o endereço.');
assert.ok(pedidos.includes('<th>Prazo</th><th>Data limite</th>'), 'Modo lista não separa prazo e data limite.');
assert.ok(pedidos.includes('<th>Data postagem</th>'), 'Modo lista não exibe a data de postagem.');
assert.ok(css.includes('.pp-scope .orders.orders-lista'), 'Modo lista não remove a grade usada pelos cards.');
assert.match(html, /id="ppBtnAbrirTema"[^>]*hidden/, 'Compatibilidade do botão removido deve permanecer invisível.');
assert.ok(pedidos.includes('statusEhAguardandoInicio'), 'Separação de pedidos aguardando início ausente.');
assert.ok(pedidos.includes('data-filtro="atencao"'), 'Filtro de atenção entre 2 e 3 dias ausente.');
assert.ok(pedidos.includes('filtro-opcao-excluir'), 'Exclusão de opções de filtro ausente.');
assert.ok(!pedidos.includes('pegarPorLetra'), 'A importação não pode depender de letras fixas de coluna.');
assert.ok(!pedidos.includes('letraParaIndice'), 'A importação não pode converter letras fixas em índices.');
[
  'ID DO PEDIDO', 'OPÇÃO DE ENVIO', 'DATA PREVISTA DE ENVIO',
  'DATA DE CRIAÇÃO DO PEDIDO', 'HORA DO PAGAMENTO DO PEDIDO',
  'NOME DO PRODUTO', 'NOME DA VARIAÇÃO'
].forEach(titulo => assert.ok(pedidos.includes(titulo), `Cabeçalho obrigatório ausente: ${titulo}`));
assert.match(pedidos, /const dtCompraValor = pegar\("horaPagamentoPedido"\) \|\| pegar\("dataCriacaoPedido"\)/, 'Prazo não usa o título da hora do pagamento.');
assert.ok(pedidos.includes('Formato principal do CSV: AAAA-MM-DD HH:mm'), 'Conversor não documenta o formato de data limite do CSV.');
assert.ok(pedidos.includes('data.getFullYear() !== Number(ano)'), 'Conversor não valida datas inexistentes.');
assert.ok(pedidos.includes('.replace(/\\u00A0/g, " ")'), 'Conversor não trata espaços especiais do CSV.');
assert.match(pedidos, /const dataCompra = converterParaData\(row\[6\]\)/, 'Data devolvida pelo banco não usa o conversor normalizado.');

assert.match(css, /@media\s*\(max-width:\s*768px\)/, 'Regra responsiva para tablet/celular ausente.');
assert.match(css, /\.table-responsive\s*\{[^}]*overflow-x:\s*auto/s, 'Rolagem responsiva de tabelas ausente.');
assert.match(html, /id="stellinhaLauncher"/, 'Botão da Stellinha ausente.');
assert.match(html, /id="stellinhaPanel"/, 'Painel da Stellinha ausente.');
assert.ok(stellinha.includes('1. Ajuda') && stellinha.includes('2. Suporte técnico'), 'Direcionamento inicial da Stellinha incompleto.');
assert.ok(stellinha.includes('listar_base_conhecimento'), 'Consulta à base externa da Stellinha ausente.');
assert.ok(stellinha.includes('abrir_chamado'), 'Fluxo de abertura de chamado ausente.');
assert.ok(stellinha.includes('Protocolo:'), 'Confirmação do protocolo de suporte ausente.');
assert.ok(stellinha.includes('Ainda estou aprendendo sobre esse assunto'), 'Mensagem de aprendizado da Stellinha ausente.');
assert.ok(!stellinha.includes('consultar_web_stellinha'), 'Stellinha não deve depender de API externa.');
assert.ok(stellinha.includes('Como localizar um backup criado?'), 'Orientação para localizar backups ausente.');
assert.ok(stellinha.includes('PALAVRAS_COMUNS'), 'Busca da Stellinha não ignora palavras genéricas.');
assert.match(css, /\.stellinha-panel\s*\{/, 'Estilos do painel da Stellinha ausentes.');
assert.match(html, /id="tela-atendimento"/, 'Central de atendimento ausente.');
assert.match(html, /id="notificacaoTesteChamado"/, 'Pop-up de teste do chamado ausente.');
assert.ok(chamados.includes('AGUARDANDO TESTE'), 'Fluxo de envio para teste ausente.');
assert.ok(chamados.includes('confirmar_teste_chamado'), 'Confirmação do teste do usuário ausente.');
assert.ok(chamados.includes('adiar_teste_chamado'), 'Adiamento do teste ausente.');
assert.ok(chamados.includes('15000'), 'Repetição do pop-up a cada 15 segundos ausente.');
assert.ok(chamados.includes('60 * 60 * 1000'), 'Lembrete de 60 minutos ausente.');
assert.ok(chamados.includes('ehAdministrador() ? "Gerenciar" : "Visualizar"'), 'Ações de chamado não estão separadas por perfil.');
assert.ok(chamados.includes('cancelar_chamado'), 'Cancelamento do próprio chamado ausente.');
assert.match(html, /id="btnAbrirChamadoUsuario"/, 'Abertura de chamado para usuário ausente.');
assert.match(html, /id="acoesAdminChamado"/, 'Controles exclusivos do administrador ausentes.');
assert.match(html, /id="acoesUsuarioChamado"/, 'Controles restritos do usuário ausentes.');
assert.ok(chamados.includes('chamadoSelecionado.status === "AGUARDANDO TESTE"'), 'Usuário pode finalizar chamado fora da etapa de teste.');

console.log('Smoke test aprovado: sintaxe, módulos, controles e responsividade verificados.');
