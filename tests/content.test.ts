import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { dataset, problems, topicProblemSlugs, topics } from '../src/content';
import { expectedOnSample, judge } from '../src/judge/judge';

const sqlProblems = problems.filter((p) => !p.options);
const quizzes = problems.filter((p) => p.options);

let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await initSqlJs();
});

describe('conteúdo', () => {
  it('slug único', () => {
    expect(new Set(problems.map((p) => p.slug)).size).toBe(problems.length);
  });

  it('todo problema está na trilha e toda referência existe', () => {
    const known = new Set(problems.map((p) => p.slug));
    const placed = new Set(topics.flatMap(topicProblemSlugs));
    expect(problems.filter((p) => !placed.has(p.slug)).map((p) => p.slug)).toEqual([]);
    expect([...placed].filter((slug) => !known.has(slug))).toEqual([]);
  });

  it('todo tópico e subtópico tem problema', () => {
    for (const topic of topics) {
      expect(topicProblemSlugs(topic).length, topic.title).toBeGreaterThan(0);
      for (const subtopic of topic.subtopics) expect(subtopic.problems.length, subtopic.name).toBeGreaterThan(0);
    }
  });

  it('mantém os 16 tópicos e 97 subtópicos do roadmap', () => {
    expect(topics.length).toBe(16);
    expect(topics.flatMap((t) => t.subtopics).length).toBe(97);
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
