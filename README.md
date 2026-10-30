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

Crie um arquivo em `content/problems/`. Campos:

| Campo | Uso |
|---|---|
| `slug`, `order`, `title` | Identificação e posição |
| `section` | ID de uma seção de `content/roadmap.yaml` |
| `difficulty` | `facil`, `medio` ou `dificil` |
| `topics` | Tópicos. Escreva `'NULL'` entre aspas |
| `statement` | Enunciado. Aceita `código` inline |
| `ordered` | Se a ordem das linhas é corrigida |
| `check` | Opcional. Consulta que confere o banco depois de UPDATE, INSERT ou DELETE |
| `solution` | Solução de referência |
| `hints`, `explanation` | Dicas progressivas e solução comentada |
| `traps` | Respostas erradas comuns que o corretor precisa reprovar |

`npm test` valida cada problema: a solução passa, a ordem esperada é determinística e toda armadilha é reprovada. Uma armadilha aprovada indica que falta um caso de borda em `hidden.sql`.

## Limitações conhecidas

- **Dialeto:** usa SQLite. Tópicos como `DATEADD`, `DATEPART`, stored procedures e `GRANT` não existem nele e exigiriam PGlite.
- **Respostas no cliente:** soluções e casos ocultos vão no bundle. Um ranking confiável exigiria correção no servidor.
- **Progresso:** fica no `localStorage`, sem conta de usuário.

## Conteúdo e licença

A licença do [roadmap.sh](https://roadmap.sh/sql) permite só uso pessoal do conteúdo e compartilhamento de links. Por isso, este projeto usa apenas nomes genéricos de tópicos e link para o site. Enunciados, dados e explicações são originais. Não copie textos nem imagens do roadmap.sh, nem de sites que ele indica. Antes de publicar, confirme com o autor ou com um advogado o uso da marca e da estrutura da trilha.
