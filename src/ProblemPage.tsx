import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { sql } from '@codemirror/lang-sql';
import { EditorView, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import CodeMirror from '@uiw/react-codemirror';
import { dataset, problems, subtopicNames, topicOf, type Problem } from './content';
import { expectedResult, runQuery, submitQuery } from './judge/client';
import type { ResultSet, Verdict } from './judge/judge';
import { loadDraft, saveDraft } from './progress';
import { DIFFICULTY_LABEL } from './RoadmapPage';

const STARTER = '-- Escreva sua query aqui\n';

/** Renderiza `código` inline: enunciados são texto simples, sem Markdown completo. */
export function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part,
  );
}

export function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.trim().split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i}>{inline(paragraph)}</p>
      ))}
    </>
  );
}

function ResultTable({ result }: { result: ResultSet }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{result.columns.map((column, i) => <th key={i}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {result.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className={cell === null ? 'null' : undefined}>{cell === null ? 'NULL' : String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {result.rows.length === 0 && <p className="empty">Nenhuma linha.</p>}
    </div>
  );
}

type Output =
  | { type: 'idle' }
  | { type: 'busy' }
  | { type: 'run'; result: ResultSet | null }
  | { type: 'verdict'; verdict: Verdict }
  | { type: 'failure'; message: string };

function OutputPanel({ output }: { output: Output }) {
  switch (output.type) {
    case 'idle':
      return <p className="muted">Executar mostra o resultado nos dados do exemplo. Enviar corrige também nos casos ocultos.</p>;
    case 'busy':
      return <p className="muted">Executando…</p>;
    case 'failure':
      return <div className="verdict bad"><strong>Erro</strong><p>{output.message}</p></div>;
    case 'run':
      return output.result ? (
        <>
          <p className="muted">{output.result.rows.length} linha(s) nos dados do exemplo</p>
          <ResultTable result={output.result} />
        </>
      ) : (
        <p className="muted">Comando executado, sem linhas para mostrar.</p>
      );
    case 'verdict': {
      const { verdict } = output;
      if (verdict.status === 'accepted') {
        return <div className="verdict good"><strong>Aceito</strong><p>Passou no exemplo e nos casos ocultos.</p></div>;
      }
      if (verdict.status === 'error') {
        return <div className="verdict bad"><strong>Erro de SQL</strong><p>{verdict.message}</p></div>;
      }
      if (verdict.stage === 'rule') {
        return <div className="verdict warn"><strong>Regra do problema</strong><p>{verdict.reason}</p></div>;
      }
      if (verdict.stage === 'behavior') {
        return <div className="verdict bad"><strong>A tabela não se comportou como pedido</strong><p>{verdict.reason}</p></div>;
      }
      if (verdict.stage === 'hidden') {
        return (
          <div className="verdict warn">
            <strong>Falhou em um caso oculto</strong>
            <p>{verdict.reason}</p>
            <p>Sua query passa no exemplo, mas outros dados expõem um caso de borda. Procure limites, empates, nulos e valores fixos na query.</p>
          </div>
        );
      }
      return (
        <>
          <div className="verdict bad"><strong>Resposta errada</strong><p>{verdict.reason}</p></div>
          <div className="compare">
            <div>
              <h4>Sua saída</h4>
              {verdict.actual ? <ResultTable result={verdict.actual} /> : <p className="empty">Sem resultado.</p>}
            </div>
            <div>
              <h4>Esperado</h4>
              <ResultTable result={verdict.expected} />
            </div>
          </div>
        </>
      );
    }
  }
}

export function ProblemPage({ problem, solved, onSolved }: { problem: Problem; solved: boolean; onSolved: (slug: string) => void }) {
  const [code, setCode] = useState(() => loadDraft(problem.slug) ?? STARTER);
  const [output, setOutput] = useState<Output>({ type: 'idle' });
  const [expected, setExpected] = useState<ResultSet | null>(null);
  const [hintsShown, setHintsShown] = useState(0);

  const topic = topicOf(problem.slug);
  const next = problems[problems.indexOf(problem) + 1];

  useEffect(() => {
    let active = true;
    expectedResult(problem)
      .then((result) => active && setExpected(result))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [problem]);

  const run = useCallback(async () => {
    setOutput({ type: 'busy' });
    try {
      setOutput({ type: 'run', result: await runQuery(problem, code) });
    } catch (error) {
      setOutput({ type: 'failure', message: (error as Error).message });
    }
  }, [code, problem]);

  const submit = useCallback(async () => {
    setOutput({ type: 'busy' });
    try {
      const verdict = await submitQuery(problem, code);
      setOutput({ type: 'verdict', verdict });
      if (verdict.status === 'accepted') onSolved(problem.slug);
    } catch (error) {
      setOutput({ type: 'failure', message: (error as Error).message });
    }
  }, [code, problem, onSolved]);

  // Ref evita reconfigurar o editor a cada tecla só porque `run` mudou.
  const runRef = useRef(run);
  runRef.current = run;
  const extensions = useMemo(
    () => [
      sql(),
      EditorView.lineWrapping,
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { void runRef.current(); return true; } }])),
    ],
    [],
  );

  const accepted = output.type === 'verdict' && output.verdict.status === 'accepted';

  return (
    <main className="workspace">
      <article className="statement">
        <a className="back" href="#/">← Trilha</a>
        <div className="statement-head">
          <h1>{problem.title}</h1>
          <span className={`badge ${problem.difficulty}`}>{DIFFICULTY_LABEL[problem.difficulty]}</span>
          {solved && <span className="badge done">Resolvido</span>}
        </div>
        <ul className="topics">
          {topic && <li className="topic-name">{topic.title}</li>}
          {subtopicNames(problem.slug).map((name) => <li key={name}>{name}</li>)}
        </ul>
        <Paragraphs text={problem.statement} />

        <details className="panel">
          <summary>Tabelas do banco</summary>
          <pre className="schema">{dataset.schema}</pre>
        </details>

        <h3>Resultado esperado no exemplo</h3>
        {problem.check && <p className="muted">Conferido com <code>{problem.check}</code></p>}
        {(problem.accepts || problem.rejects) && (
          <p className="muted">O corretor também tenta inserir dados válidos e inválidos na sua tabela.</p>
        )}
        {expected ? <ResultTable result={expected} /> : <p className="muted">Carregando…</p>}

        <h3>Dicas</h3>
        {problem.hints.slice(0, hintsShown).map((hint, i) => (
          <p key={i} className="hint">{inline(hint)}</p>
        ))}
        {hintsShown < problem.hints.length ? (
          <button className="ghost" onClick={() => setHintsShown(hintsShown + 1)}>
            Mostrar dica ({hintsShown + 1}/{problem.hints.length})
          </button>
        ) : null}

        {topic && (
          <>
            <h3>Para estudar</h3>
            <ul className="study">
              {topic.study.map((link) => (
                <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>
              ))}
            </ul>
          </>
        )}

        {solved && (
          <details className="panel" open={accepted}>
            <summary>Solução comentada</summary>
            <Paragraphs text={problem.explanation} />
            <pre className="schema">{problem.solution}</pre>
          </details>
        )}
      </article>

      <section className="solver">
        <div className="editor">
          <CodeMirror
            value={code}
            theme="dark"
            height="100%"
            style={{ height: '100%' }}
            extensions={extensions}
            aria-label="Editor de SQL"
            onChange={(value) => {
              setCode(value);
              saveDraft(problem.slug, value);
            }}
          />
        </div>
        <div className="actions">
          <button className="ghost" onClick={run} disabled={output.type === 'busy'}>Executar <kbd>Ctrl+Enter</kbd></button>
          <button className="primary" onClick={submit} disabled={output.type === 'busy'}>Enviar</button>
          {accepted && next && <a className="next" href={`#/problema/${next.slug}`}>Próximo: {next.title} →</a>}
        </div>
        <div className="output" aria-live="polite"><OutputPanel output={output} /></div>
      </section>
    </main>
  );
}
