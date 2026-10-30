import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { expectedOnSample, judge, runOnSample, type Dataset, type JudgedProblem } from './judge';

export type JudgeRequest = { id: number; dataset: Dataset } & (
  | { kind: 'run'; sql: string }
  | { kind: 'expected'; problem: JudgedProblem }
  | { kind: 'submit'; problem: JudgedProblem; sql: string }
);

const sqlJs = initSqlJs({ locateFile: () => wasmUrl });

self.onmessage = async ({ data }: MessageEvent<JudgeRequest>) => {
  try {
    const SQL = await sqlJs;
    let result: unknown;
    if (data.kind === 'run') result = runOnSample(SQL, data.dataset, data.sql);
    if (data.kind === 'expected') result = expectedOnSample(SQL, data.dataset, data.problem);
    if (data.kind === 'submit') result = judge(SQL, data.dataset, data.problem, data.sql);
    self.postMessage({ id: data.id, ok: true, result });
  } catch (error) {
    self.postMessage({ id: data.id, ok: false, message: error instanceof Error ? error.message : String(error) });
  }
};
