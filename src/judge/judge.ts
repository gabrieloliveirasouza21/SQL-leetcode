import type { Database, SqlJsStatic } from 'sql.js';

export type Cell = string | number | null | Uint8Array;

export interface ResultSet {
  columns: string[];
  rows: Cell[][];
}

export interface Dataset {
  schema: string;
  sample: string;
  hidden: string;
}

export interface JudgedProblem {
  solution: string;
  ordered: boolean;
  /** Consulta que confere o banco depois do comando do aluno. */
  check?: string;
  /** SQL já aplicado ao banco antes do comando do aluno. */
  setup?: string;
  /** Termos que precisam aparecer ou não podem aparecer no SQL enviado. */
  must_use?: string[];
  forbid?: string[];
  /** Comandos que o banco precisa aceitar ou recusar depois do comando do aluno. */
  accepts?: string[];
  rejects?: string[];
}

export type Verdict =
  | { status: 'accepted' }
  | { status: 'error'; message: string }
  | { status: 'wrong'; stage: 'sample'; reason: string; expected: ResultSet; actual: ResultSet | null }
  | { status: 'wrong'; stage: 'hidden'; reason: string }
  | { status: 'wrong'; stage: 'rule'; reason: string }
  | { status: 'wrong'; stage: 'behavior'; reason: string };

type Stage = 'sample' | 'hidden';

/** Devolve o resultado do último comando que produz colunas, ou null se nenhum produzir. */
export function runStatements(db: Database, sql: string): ResultSet | null {
  let last: ResultSet | null = null;
  for (const stmt of db.iterateStatements(sql)) {
    const columns = stmt.getColumnNames();
    const rows: Cell[][] = [];
    while (stmt.step()) rows.push(stmt.get() as Cell[]);
    if (columns.length > 0) last = { columns, rows };
  }
  return last;
}

function openDb(SQL: SqlJsStatic, dataset: Dataset, stage: Stage, setup?: string): Database {
  const db = new SQL.Database();
  // SQLite vem com chaves estrangeiras desligadas, o que esconderia erros de integridade.
  db.exec('PRAGMA foreign_keys = ON;');
  // Este build do sql.js vem sem as funções matemáticas do SQLite.
  const orNull = (fn: (value: number) => number) => (value: number | null) => (value === null ? null : fn(value));
  db.create_function('CEILING', orNull(Math.ceil));
  db.create_function('CEIL', orNull(Math.ceil));
  db.create_function('FLOOR', orNull(Math.floor));
  db.create_function('MOD', (a: number | null, b: number | null) => (a === null || b === null || b === 0 ? null : a % b));
  db.exec(dataset.schema);
  db.exec(dataset[stage]);
  if (setup) db.exec(setup);
  return db;
}

function behaviorProblem(db: Database, problem: JudgedProblem): string | null {
  for (const statement of problem.accepts ?? []) {
    try {
      db.exec(statement);
    } catch (error) {
      return `O banco recusou um dado válido: ${statement} (${(error as Error).message})`;
    }
  }
  for (const statement of problem.rejects ?? []) {
    try {
      db.exec(statement);
    } catch {
      continue;
    }
    return `O banco aceitou um dado que deveria recusar: ${statement}`;
  }
  return null;
}

/** Executa o SQL em um banco novo. Com `check`, o resultado é o da consulta de conferência. */
function attempt(SQL: SqlJsStatic, dataset: Dataset, stage: Stage, problem: JudgedProblem, sql: string) {
  const db = openDb(SQL, dataset, stage, problem.setup);
  try {
    const own = runStatements(db, sql);
    const result = problem.check ? runStatements(db, problem.check) : own;
    return { result, behavior: behaviorProblem(db, problem) };
  } finally {
    db.close();
  }
}

export function runOnSample(SQL: SqlJsStatic, dataset: Dataset, sql: string, setup?: string): ResultSet | null {
  const db = openDb(SQL, dataset, 'sample', setup);
  try {
    return runStatements(db, sql);
  } finally {
    db.close();
  }
}

export function expectedOnSample(SQL: SqlJsStatic, dataset: Dataset, problem: JudgedProblem): ResultSet {
  const db = openDb(SQL, dataset, 'sample', problem.setup);
  try {
    const own = runStatements(db, problem.solution);
    return (problem.check ? runStatements(db, problem.check) : own)!;
  } finally {
    db.close();
  }
}

/** Tira comentários e textos entre aspas, para que uma regra não seja cumprida só por menção. */
function stripNoise(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/\(\s+/g, '(');
}

function termPattern(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, 'i');
}

function ruleProblem(problem: JudgedProblem, sql: string): string | null {
  const clean = stripNoise(sql);
  const missing = problem.must_use?.find((term) => !termPattern(term).test(clean));
  if (missing) return `Este problema exige o uso de ${missing}.`;
  const banned = problem.forbid?.find((term) => termPattern(term).test(clean));
  if (banned) return `Este problema não permite o uso de ${banned}.`;
  return null;
}

function normalizeCell(cell: Cell): string {
  if (cell === null) return 'null';
  if (typeof cell === 'number') return `n:${Math.round(cell * 100) / 100}`;
  if (cell instanceof Uint8Array) return `b:${Array.from(cell).join(',')}`;
  return `s:${cell}`;
}

function normalizeRows(result: ResultSet, ordered: boolean): string[] {
  const rows = result.rows.map((row) => row.map(normalizeCell).join('\u0001'));
  return ordered ? rows : [...rows].sort();
}

/** Compara por posição de coluna: apelidos diferentes não reprovam. */
function explainDifference(expected: ResultSet, actual: ResultSet | null, ordered: boolean): string | null {
  if (!actual) return 'Seu comando não produziu nenhum resultado.';
  if (actual.columns.length !== expected.columns.length) {
    return `Esperava ${expected.columns.length} coluna(s), veio ${actual.columns.length}.`;
  }
  if (actual.rows.length !== expected.rows.length) {
    return `Esperava ${expected.rows.length} linha(s), veio ${actual.rows.length}.`;
  }
  const a = normalizeRows(actual, ordered);
  const e = normalizeRows(expected, ordered);
  if (a.every((row, i) => row === e[i])) return null;
  if (ordered && [...a].sort().every((row, i) => row === [...e].sort()[i])) {
    return 'As linhas estão certas, mas a ordem não está.';
  }
  return 'Os valores não batem com o esperado.';
}

export function judge(SQL: SqlJsStatic, dataset: Dataset, problem: JudgedProblem, sql: string): Verdict {
  const rule = ruleProblem(problem, sql);
  if (rule) return { status: 'wrong', stage: 'rule', reason: rule };

  for (const stage of ['sample', 'hidden'] as const) {
    const expected = attempt(SQL, dataset, stage, problem, problem.solution).result!;
    let outcome: ReturnType<typeof attempt>;
    try {
      outcome = attempt(SQL, dataset, stage, problem, sql);
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
    const reason = explainDifference(expected, outcome.result, problem.ordered);
    if (reason) {
      return stage === 'sample'
        ? { status: 'wrong', stage, reason, expected, actual: outcome.result }
        : { status: 'wrong', stage, reason };
    }
    if (outcome.behavior) return { status: 'wrong', stage: 'behavior', reason: outcome.behavior };
  }
  return { status: 'accepted' };
}
