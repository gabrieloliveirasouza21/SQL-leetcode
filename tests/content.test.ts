import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { dataset, problems, sections } from '../src/content';
import { expectedOnSample, judge } from '../src/judge/judge';

const sqlProblems = problems.filter((p) => !p.options);
const quizzes = problems.filter((p) => p.options);

// Tópicos do roadmap de SQL que a trilha precisa cobrir.
const ROADMAP_TOPICS = [
  'Bancos relacionais', 'Tabelas', 'Linhas', 'Colunas', 'Benefícios e limitações do RDBMS', 'SQL vs NoSQL',
  'Palavras-chave SQL', 'Tipos de dados', 'Operadores', 'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
  'INSERT', 'UPDATE', 'DELETE', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'TRUNCATE TABLE',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'NOT NULL', 'CHECK',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'SELF JOIN', 'CROSS JOIN',
  'Subquery escalar', 'Subquery de coluna', 'Subquery de linha', 'Subquery de tabela', 'Subquery aninhada', 'Subquery correlacionada',
  'ABS', 'ROUND', 'MOD', 'CEILING', 'FLOOR', 'CASE', 'NULLIF', 'COALESCE',
  'CONCAT', 'LENGTH', 'SUBSTRING', 'REPLACE', 'UPPER', 'LOWER', 'DATE', 'TIME', 'TIMESTAMP', 'DATEPART', 'DATEADD',
  'Criar views', 'Alterar views', 'Apagar views', 'Usar índices', 'Gerenciar índices',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'ACID', 'Níveis de isolamento',
  'Integridade de dados', 'GRANT e REVOKE', 'Boas práticas de segurança', 'Stored procedures e funções', 'SQL dinâmico',
  'Análise de consultas', 'Reduzir subqueries', 'Otimizar joins', 'Projeção seletiva',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LEAD', 'LAG', 'CTE', 'CTE recursiva', 'PIVOT e UNPIVOT',
];

let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await initSqlJs();
});

describe('conteúdo', () => {
  it('toda seção conhecida e slug único', () => {
    const ids = new Set(sections.map((s) => s.id));
    for (const p of problems) expect(ids.has(p.section), p.slug).toBe(true);
    expect(new Set(problems.map((p) => p.slug)).size).toBe(problems.length);
    // YAML lê NULL sem aspas como nulo, e o chip do tópico sai vazio.
    for (const p of problems) expect(p.topics.every((t) => typeof t === 'string'), p.slug).toBe(true);
  });

  it('toda seção tem problema', () => {
    for (const s of sections) expect(problems.some((p) => p.section === s.id), s.id).toBe(true);
  });

  it('cobre todos os tópicos do roadmap', () => {
    const covered = new Set(problems.flatMap((p) => p.topics));
    expect(ROADMAP_TOPICS.filter((topic) => !covered.has(topic))).toEqual([]);
  });

  describe.each(quizzes.map((p) => [p.slug, p] as const))('quiz %s', (_slug, quiz) => {
    it('tem resposta válida e explica cada opção', () => {
      expect(quiz.options!.length).toBeGreaterThanOrEqual(3);
      expect(quiz.options![quiz.answer!]).toBeDefined();
      for (const option of quiz.options!) {
        expect(typeof option.text).toBe('string');
        expect(option.why.length).toBeGreaterThan(0);
      }
    });
  });

  describe.each(sqlProblems.map((p) => [p.slug, p] as const))('%s', (_slug, problem) => {
    it('a solução de referência é aceita', () => {
      expect(judge(SQL, dataset, problem, problem.solution)).toEqual({ status: 'accepted' });
    });

    it('o exemplo tem resultado visível', () => {
      expect(expectedOnSample(SQL, dataset, problem).rows.length).toBeGreaterThan(0);
    });

    it('a ordem esperada é determinística', () => {
      // O pragma inverte a ordem não garantida: um ORDER BY incompleto muda o resultado.
      const scrambled = `PRAGMA reverse_unordered_selects = ON;\n${dataset.schema}`;
      const baseline = {
        sample: expectedOnSample(SQL, dataset, problem),
        hidden: expectedOnSample(SQL, { ...dataset, sample: dataset.hidden }, problem),
      };
      expect(expectedOnSample(SQL, { ...dataset, schema: scrambled }, problem)).toEqual(baseline.sample);
      expect(expectedOnSample(SQL, { ...dataset, schema: scrambled, sample: dataset.hidden }, problem)).toEqual(baseline.hidden);
    });

    it.each(problem.traps.map((t) => [t.reason, t.sql] as const))('reprova: %s', (_reason, sql) => {
      expect(judge(SQL, dataset, problem, sql).status).not.toBe('accepted');
    });
  });
});

describe('corretor', () => {
  const problem = problems.find((p) => p.slug === 'veteranas-na-ativa')!;

  it('apelidos diferentes não reprovam', () => {
    const sql = "SELECT name AS banda FROM bands WHERE disbanded_year IS NULL AND formed_year < 2000 ORDER BY name";
    expect(judge(SQL, dataset, problem, sql).status).toBe('accepted');
  });

  it('erro de sintaxe vira verdict de erro', () => {
    expect(judge(SQL, dataset, problem, 'SELEC name').status).toBe('error');
  });

  it('erro de limite só aparece no caso oculto', () => {
    const sql = 'SELECT name FROM bands WHERE disbanded_year IS NULL AND formed_year <= 2000 ORDER BY name';
    expect(judge(SQL, dataset, problem, sql)).toMatchObject({ status: 'wrong', stage: 'hidden' });
  });

  it('ordem errada recebe mensagem específica', () => {
    const sql = 'SELECT name FROM bands WHERE disbanded_year IS NULL AND formed_year < 2000 ORDER BY name DESC';
    expect(judge(SQL, dataset, problem, sql)).toMatchObject({
      status: 'wrong',
      reason: 'As linhas estão certas, mas a ordem não está.',
    });
  });

  it('comando que apaga dados não contamina a execução seguinte', () => {
    expect(judge(SQL, dataset, problem, 'DROP TABLE bands').status).not.toBe('accepted');
    expect(judge(SQL, dataset, problem, problem.solution).status).toBe('accepted');
  });

  it('regra não é cumprida por comentário nem por texto', () => {
    const transaction = problems.find((p) => p.slug === 'ensaio-da-faxina')!;
    const sql = "-- BEGIN ROLLBACK\nDELETE FROM checkins WHERE gate = 'BEGIN ROLLBACK';";
    expect(judge(SQL, dataset, transaction, sql)).toMatchObject({ status: 'wrong', stage: 'rule' });
  });

  it('restrição ausente é apontada pelo comportamento', () => {
    const constraint = problems.find((p) => p.slug === 'limite-de-desconto')!;
    const sql = 'CREATE TABLE promotions (id INTEGER PRIMARY KEY, code TEXT NOT NULL, discount INTEGER NOT NULL);';
    expect(judge(SQL, dataset, constraint, sql)).toMatchObject({ status: 'wrong', stage: 'behavior' });
  });
});
