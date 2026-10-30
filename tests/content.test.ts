import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { dataset, problems, sections } from '../src/content';
import { expectedOnSample, judge } from '../src/judge/judge';

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

  describe.each(problems.map((p) => [p.slug, p] as const))('%s', (_slug, problem) => {
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
      expect(judge(SQL, dataset, problem, sql).status).toBe('wrong');
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
    expect(judge(SQL, dataset, problem, 'DROP TABLE bands').status).toBe('wrong');
    expect(judge(SQL, dataset, problem, problem.solution).status).toBe('accepted');
  });
});
