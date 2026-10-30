import { useState } from 'react';
import { problems, sections, type Difficulty } from './content';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

export function RoadmapPage({ solved }: { solved: Set<string> }) {
  const [filter, setFilter] = useState<Difficulty | 'todas'>('todas');

  return (
    <main className="roadmap">
      <section className="intro">
        <h1>Aprenda SQL resolvendo problemas</h1>
        <p>
          Você cuida dos dados de um festival de metal. Cada etapa da trilha traz problemas reais, corrigidos na hora
          contra dados que você vê e casos de borda que você não vê.
        </p>
        <div className="filters" role="group" aria-label="Filtrar por dificuldade">
          {(['todas', 'facil', 'medio', 'dificil'] as const).map((option) => (
            <button
              key={option}
              className={filter === option ? 'filter active' : 'filter'}
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
            >
              {option === 'todas' ? 'Todas' : DIFFICULTY_LABEL[option]}
            </button>
          ))}
        </div>
      </section>

      <ol className="path">
        {sections.map((section) => {
          const all = problems.filter((p) => p.section === section.id);
          const visible = all.filter((p) => filter === 'todas' || p.difficulty === filter);
          const done = all.filter((p) => solved.has(p.slug)).length;
          const complete = all.length > 0 && done === all.length;
          return (
            <li key={section.id} className={complete ? 'node complete' : 'node'}>
              <span className="node-marker" aria-hidden="true">{complete ? '✓' : ''}</span>
              <div className="node-body">
                <div className="node-head">
                  <h2>{section.title}</h2>
                  <span className="node-count">{done}/{all.length}</span>
                </div>
                <p>{section.summary}</p>
                {visible.length === 0 ? (
                  <p className="empty">Nenhum problema nessa dificuldade.</p>
                ) : (
                  <ul className="problem-list">
                    {visible.map((problem) => (
                      <li key={problem.slug}>
                        <a className="problem-link" href={`#/problema/${problem.slug}`}>
                          <span className={solved.has(problem.slug) ? 'check solved' : 'check'} aria-hidden="true">
                            {solved.has(problem.slug) ? '✓' : ''}
                          </span>
                          <span className="problem-title">{problem.title}</span>
                          {problem.options && <span className="kind">Conceito</span>}
                          <span className={`badge ${problem.difficulty}`}>{DIFFICULTY_LABEL[problem.difficulty]}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <footer className="credit">
        Tópicos inspirados no <a href="https://roadmap.sh/sql" target="_blank" rel="noreferrer">roadmap de SQL do roadmap.sh</a>.
        Problemas e dados são originais. Projeto independente.
      </footer>
    </main>
  );
}
