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
  check?: string;
}

export type Verdict =
  | { status: 'accepted' }
  | { status: 'error'; message: string }
  | { status: 'wrong'; stage: 'sample'; reason: string; expected: ResultSet; actual: ResultSet | null }
  | { status: 'wrong'; stage: 'hidden'; reason: string };

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

function openDb(SQL: SqlJsStatic, dataset: Dataset, stage: 'sample' | 'hidden'): Database {
  const db = new SQL.Database();
  db.exec(dataset.schema);
  db.exec(dataset[stage]);
  return db;
}

/** Executa o SQL em um banco novo. Com `check`, o resultado é o da consulta de conferência. */
function execute(
  SQL: SqlJsStatic,
  dataset: Dataset,
  stage: 'sample' | 'hidden',
  sql: string,
  check?: string,
): ResultSet | null {
  const db = openDb(SQL, dataset, stage);
  try {
    const result = runStatements(db, sql);
    return check ? runStatements(db, check) : result;
  } finally {
    db.close();
  }
}

export function runOnSample(SQL: SqlJsStatic, dataset: Dataset, sql: string): ResultSet | null {
  return execute(SQL, dataset, 'sample', sql);
}

export function expectedOnSample(SQL: SqlJsStatic, dataset: Dataset, problem: JudgedProblem): ResultSet {
  return execute(SQL, dataset, 'sample', problem.solution, problem.check)!;
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
  for (const stage of ['sample', 'hidden'] as const) {
    const expected = execute(SQL, dataset, stage, problem.solution, problem.check)!;
    let actual: ResultSet | null;
    try {
      actual = execute(SQL, dataset, stage, sql, problem.check);
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
    const reason = explainDifference(expected, actual, problem.ordered);
    if (reason) {
      return stage === 'sample'
        ? { status: 'wrong', stage, reason, expected, actual }
        : { status: 'wrong', stage, reason };
    }
  }
  return { status: 'accepted' };
}
