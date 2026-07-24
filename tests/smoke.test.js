const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const raiz = path.resolve(__dirname, '..');
const ler = arquivo => fs.readFileSync(path.join(raiz, arquivo), 'utf8');
const html = ler('index.html');
const script = ler('script.js');
const pedidos = ler('painelPedidos.js');
const css = ler('style.css');

new Function(script);
new Function(pedidos);

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
assert.match(pedidos, /split\(\/\[ T\]\//, 'Conversor não aceita data acompanhada de horário.');
assert.match(pedidos, /const dataCompra = converterParaData\(row\[6\]\)/, 'Data devolvida pelo banco não usa o conversor normalizado.');

assert.match(css, /@media\s*\(max-width:\s*768px\)/, 'Regra responsiva para tablet/celular ausente.');
assert.match(css, /\.table-responsive\s*\{[^}]*overflow-x:\s*auto/s, 'Rolagem responsiva de tabelas ausente.');

console.log('Smoke test aprovado: sintaxe, módulos, controles e responsividade verificados.');
