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
  'calcProduto', 'formProduto', 'ppEtapasList', 'ppHistoricoPedido'
].forEach(id => assert.match(html, new RegExp(`id=["']${id}["']`), `ID ausente: ${id}`));

[
  'resumo_mensal', 'carregar_parametros', 'salvar_parametros', 'criar_backup',
  'listar_produtos', 'salvar_produto', 'listar_despesas', 'listar_vendas'
].forEach(acao => assert.ok(script.includes(acao), `Ação ausente em script.js: ${acao}`));

[
  'salvar_producao', 'buscar_historico_producao', 'listar_etapas',
  'data-postagem-input', 'POSTADO'
].forEach(item => assert.ok(pedidos.includes(item), `Integração ausente em painelPedidos.js: ${item}`));

assert.match(css, /@media\s*\(max-width:\s*768px\)/, 'Regra responsiva para tablet/celular ausente.');
assert.match(css, /\.table-responsive\s*\{[^}]*overflow-x:\s*auto/s, 'Rolagem responsiva de tabelas ausente.');

console.log('Smoke test aprovado: sintaxe, módulos, controles e responsividade verificados.');
