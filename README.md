# PriPel Gestão

Aplicativo web para vendas, despesas, precificação e acompanhamento da produção da PriPel. O frontend é hospedado no GitHub Pages e usa Google Apps Script como API para uma planilha Google Sheets.

## Módulos concluídos

- Autenticação e política de senhas.
- Dashboard e fluxo de caixa.
- Vendas em três etapas, pesquisa, edição e cancelamento.
- Despesas, categorias, filtros, edição, quitação e exclusão.
- Produtos, matéria-prima, custos extras e margem.
- Precificação integrada aos produtos e taxas configuráveis.
- Cronograma, etapas configuráveis e detalhes da criança.
- Data obrigatória ao marcar um pedido como `POSTADO`.
- Histórico completo de alterações da produção.
- Resumo mensal, lucro real e comparação com o mês anterior.
- Parâmetros e backup pelo aplicativo.

## Arquitetura

- `index.html`: estrutura das telas.
- `style.css`: identidade visual e responsividade.
- `script.js`: navegação, financeiro, vendas, despesas, produtos, resumo e parâmetros.
- `painelPedidos.js`: Cronograma, temas, etapas e histórico da produção.
- Google Apps Script: API e regras de negócio.
- Google Sheets: persistência e auditoria.

## Implantação do frontend

O GitHub Pages deve usar o branch `main` e a raiz do repositório. Depois de uma publicação, aguarde o workflow do Pages e atualize o navegador com `Ctrl + F5`.

## Implantação do backend

1. Abra o projeto no Google Apps Script.
2. Substitua o código pelo backend entregue com a versão atual.
3. Acesse **Implantar > Gerenciar implantações**.
4. Edite a implantação existente.
5. Selecione **Nova versão** e implante.
6. Mantenha a URL da implantação existente para não precisar alterar o frontend.

## Planilhas principais

- `vendas`
- `despesas`
- `produtos`
- `Historico_Pedidos`
- `produção`
- `usuarios`
- `temas`
- `etapas_producao`
- `historico_producao`
- `parametros`
- `shopee_financeiro`
- `plataformas_precificacao`
- `catalogo_precificacao`

Não altere a ordem das colunas manualmente. Novas categorias, etapas e taxas devem ser cadastradas pelo aplicativo.

## Lucro real

O resumo utiliza:

`Receitas confirmadas - despesas pagas - custos dos produtos`

O custo dos produtos é gravado na venda. Para registros antigos sem custo, o resumo tenta localizar o produto atual pelo nome e calcular matéria-prima mais custos extras.

## Conciliação financeira da Shopee

1. Baixe na Shopee o relatório de rendimento no formato Excel (`Income...xlsx`).
2. Abra **Gestão Financeira > Despesas**.
3. Em **Resultado real da Shopee**, clique em **Importar relatório**.
4. Confira receita bruta, taxas da Shopee, valor liberado, despesas internas pagas e custos identificados.

O sistema lê as abas `Summary` e `Renda` pelos títulos do relatório. O cálculo parte do valor efetivamente liberado e não desconta as taxas da Shopee novamente. Se algum produto do relatório ainda não estiver associado a um custo cadastrado, o resultado será marcado como **Análise parcial**, evitando indicar lucro incorreto.

## Precificação multiplataforma

A tela **Gestão Financeira > Precificação** possui:

- carga inicial das planilhas Shopee CPF e CNPJ;
- importação de `.xlsx`, `.xls` e `.csv`;
- catálogo de produtos com custo, quantidade, preço base e promocional;
- perfis CPF e CNPJ separados;
- cadastro manual e edição de produtos/preços;
- taxas editáveis por plataforma;
- cadastro de novas plataformas;
- cálculo por faixas da Shopee ou percentual padrão.

As regras iniciais da Shopee foram reproduzidas das planilhas fornecidas: 20% + R$ 4 até R$ 79,99; 14% com taxas fixas de R$ 16, R$ 20 e R$ 26 nas faixas seguintes; adicional de R$ 3 para CPF. Mercado Livre, TikTok Shop e WhatsApp são criados com taxas zeradas para configuração pelo administrador, evitando utilizar percentuais desatualizados.

## Rotina de backup

1. Abra **Configurações > Parâmetros**.
2. Clique em **Criar backup agora**.
3. O sistema cria cópias ocultas e datadas das abas principais.
4. Faça o backup antes de importações grandes, mudanças de parâmetros e fechamentos mensais.

Os backups anteriores não são apagados automaticamente. Para recuperar dados, abra a planilha, exiba a aba de backup desejada e copie os registros necessários para a aba principal.

## Checklist de testes

Execute primeiro o teste automatizado:

```bash
node tests/smoke.test.js
```

1. Entrar com `admin/admin` e com um usuário comum.
2. Criar, editar e cancelar uma venda.
3. Confirmar que a venda aparece no Dashboard e no Cronograma.
4. Criar uma despesa pendente e quitá-la.
5. Confirmar que somente a despesa paga aparece no Fluxo de Caixa.
6. Cadastrar um produto e selecioná-lo na Precificação.
7. Alterar etapa, criança, idade e observações de um pedido.
8. Selecionar `POSTADO`, informar a data e conferir a finalização.
9. Abrir o histórico do pedido.
10. Comparar o Resumo mensal com o mês anterior.
11. Alterar taxas, prazo e categorias em Parâmetros.
12. Criar um backup e verificar as abas ocultas.
13. Repetir os fluxos em computador e celular.
14. Importar um relatório `Income` e conferir os totais com a aba `Summary`.

## Diagnóstico

- Use `Ctrl + F5` para descartar arquivos antigos do navegador.
- Confirme se a implantação ativa do Apps Script é a versão mais recente.
- Erros retornados pelo backend são exibidos junto ao formulário ou ação correspondente.
- O erro de `favicon.ico` no console não afeta as funções do aplicativo.
