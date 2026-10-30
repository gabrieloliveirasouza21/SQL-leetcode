# Trilha SQL

Plataforma estilo LeetCode organizada como uma trilha de estudo. O aluno resolve problemas de SQL e recebe correção automática no navegador, sem servidor.

## Rodar

```bash
npm install
npm run dev
npm test
```

## Como a correção funciona

Cada envio roda em um banco novo, dentro de um Web Worker com limite de 4 segundos.

1. Executa a query do aluno e a solução de referência nos dados do exemplo (`content/dataset/sample.sql`).
2. Repete nos casos ocultos (`content/dataset/hidden.sql`), que têm empates, limites, nulos e IDs diferentes.
3. Compara os resultados por posição de coluna, então apelidos não importam. A ordem só conta quando `ordered: true`.

## Adicionar um problema

Crie um arquivo em `content/problems/`, com um problema ou uma lista deles. Depois, adicione o `slug` ao subtópico certo em `content/roadmap.yaml`. É esse arquivo que define a hierarquia, a ordem e as etiquetas de cada problema, e um problema pode aparecer em vários subtópicos. Campos:

| Campo | Uso |
|---|---|
| `slug`, `title` | Identificação |
| `difficulty` | `facil`, `medio` ou `dificil` |
| `statement` | Enunciado. Aceita `código` inline |
| `ordered` | Se a ordem das linhas é corrigida |
| `check` | Opcional. Consulta que confere o banco depois do comando do aluno. Use em INSERT, UPDATE, DELETE e DDL |
| `setup` | Opcional. SQL aplicado antes do comando do aluno, como uma view que ele vai alterar |
| `must_use`, `forbid` | Opcional. Termos exigidos ou proibidos no SQL enviado. Comentários e textos entre aspas não contam |
| `accepts`, `rejects` | Opcional. Comandos que o banco precisa aceitar ou recusar. Use para testar restrições |
| `options`, `answer` | Só em problemas conceituais. Lista de `text` e `why`, e o índice da resposta certa. Esses problemas não têm `solution` |
| `solution` | Solução de referência |
| `hints`, `explanation` | Dicas progressivas e solução comentada |
| `traps` | Respostas erradas comuns que o corretor precisa reprovar |

`npm test` valida cada problema: a solução passa, a ordem esperada é determinística e toda armadilha é reprovada. Uma armadilha aprovada indica que falta um caso de borda em `hidden.sql`. O teste também falha se um problema ficar fora da trilha ou se um tópico ou subtópico ficar sem problema.

## Limitações conhecidas

- **Dialeto:** usa SQLite. `DATEADD`, `DATEPART`, `TRUNCATE`, `PIVOT` e `UNPIVOT` são praticados com os equivalentes do SQLite. Stored procedures, SQL dinâmico e `GRANT` não existem nele, então viraram problemas conceituais. Praticar esses tópicos de verdade exigiria PGlite.
- **Transações:** o corretor confere o estado final e a presença dos comandos, não o efeito de concorrência entre sessões.
- **Respostas no cliente:** soluções e casos ocultos vão no bundle. Um ranking confiável exigiria correção no servidor.
- **Progresso:** fica no `localStorage`, sem conta de usuário.

## Conteúdo e licença

A licença do [roadmap.sh](https://roadmap.sh/sql) permite só uso pessoal do conteúdo e compartilhamento de links. Este projeto reproduz os nomes e a organização dos tópicos e subtópicos do roadmap de SQL, com crédito e link. Enunciados, dados e explicações são originais. Reproduzir a organização pode exigir autorização, então confirme com o autor antes de divulgar o projeto. Não copie textos nem imagens do roadmap.sh, nem de sites que ele indica.
