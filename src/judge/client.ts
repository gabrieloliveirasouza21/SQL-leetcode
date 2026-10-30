import { dataset, type Problem } from '../content';
import type { ResultSet, Verdict } from './judge';
import type { JudgeRequest } from './worker';

const TIMEOUT_MS = 4000;
export const TIMEOUT_MESSAGE = 'A query passou de 4 segundos e foi interrompida. Verifique se há recursão infinita.';

type Payload =
  | { kind: 'run'; sql: string }
  | { kind: 'expected'; problem: Pick<Problem, 'solution' | 'ordered' | 'check'> }
  | { kind: 'submit'; problem: Pick<Problem, 'solution' | 'ordered' | 'check'>; sql: string };

let worker: Worker | null = null;
let nextId = 1;

/** SQLite síncrono não pode ser cancelado por dentro: em timeout, o worker inteiro é descartado. */
function call<T>(payload: Payload): Promise<T> {
  worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const current = worker;
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      current.terminate();
      if (worker === current) worker = null;
      reject(new Error(TIMEOUT_MESSAGE));
    }, TIMEOUT_MS);
    const onMessage = ({ data }: MessageEvent) => {
      if (data.id !== id) return;
      clearTimeout(timer);
      current.removeEventListener('message', onMessage);
      if (data.ok) resolve(data.result as T);
      else reject(new Error(data.message));
    };
    current.addEventListener('message', onMessage);
    current.postMessage({ id, dataset, ...payload } as JudgeRequest);
  });
}

function judged({ solution, ordered, check }: Problem) {
  return { solution, ordered, check };
}

export const runQuery = (sql: string) => call<ResultSet | null>({ kind: 'run', sql });
export const expectedResult = (problem: Problem) => call<ResultSet>({ kind: 'expected', problem: judged(problem) });
export const submitQuery = (problem: Problem, sql: string) =>
  call<Verdict>({ kind: 'submit', problem: judged(problem), sql });
