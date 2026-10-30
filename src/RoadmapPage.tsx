import { Fragment, useState } from 'react';
import { practice, problems, topicProblemSlugs, topics, type Difficulty, type Problem, type Topic } from './content';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

const bySlug = new Map(problems.map((problem) => [problem.slug, problem]));

function ProblemList({ slugs, solved, visible }: { slugs: string[]; solved: Set<string>; visible: (p: Problem) => boolean }) {
  return (
    <ul className="problem-list">
      {slugs.map((slug) => bySlug.get(slug)!).filter(visible).map((problem) => (
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
  );
}

export function RoadmapPage({ solved }: { solved: Set<string> }) {
  const [filter, setFilter] = useState<Difficulty | 'todas'>('todas');
  const visible = (problem: Problem) => filter === 'todas' || problem.difficulty === filter;
  const firstOpen = topics.find((topic) => topicProblemSlugs(topic).some((slug) => !solved.has(slug)))?.id;

  const renderTopic = (topic: Topic) => {
    const slugs = topicProblemSlugs(topic);
    const done = slugs.filter((slug) => solved.has(slug)).length;
    const complete = done === slugs.length;
    const matching = slugs.some((slug) => visible(bySlug.get(slug)!));
    return (
      <li key={topic.id} className={complete ? 'node complete' : 'node'}>
        <span className="node-marker" aria-hidden="true">{complete ? '✓' : ''}</span>
        <details className="node-body" open={filter !== 'todas' || topic.id === firstOpen}>
          <summary className="node-head">
            <h2>{topic.title}</h2>
            <span className="node-count">{done}/{slugs.length}</span>
          </summary>
          <p className="node-summary">{topic.summary}</p>
          {!matching && <p className="empty">Nenhum problema nessa dificuldade.</p>}
          {topic.problems && <ProblemList slugs={topic.problems} solved={solved} visible={visible} />}
          {topic.subtopics.map((subtopic, index) => {
            if (!subtopic.problems.some((slug) => visible(bySlug.get(slug)!))) return null;
            const previousVisible = topic.subtopics.slice(0, index).reverse().find((s) => s.problems.some((slug) => visible(bySlug.get(slug)!)));
            return (
              <Fragment key={`${subtopic.group ?? ''}/${subtopic.name}`}>
                {subtopic.group && subtopic.group !== previousVisible?.group && <h3 className="group">{subtopic.group}</h3>}
                <h4 className="subtopic">{subtopic.name}</h4>
                <ProblemList slugs={subtopic.problems} solved={solved} visible={visible} />
              </Fragment>
            );
          })}
        </details>
      </li>
    );
  };

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

      <ol className="path">{topics.map(renderTopic)}</ol>

      <section className="practice-intro">
        <h2>Como no trabalho</h2>
        <p>No dia a dia, você lê mais código do que escreve do zero. Aqui, os exercícios já começam com código no editor.</p>
      </section>
      <ol className="path practice-path">{practice.map(renderTopic)}</ol>
      <footer className="credit">
        Tópicos e subtópicos seguem o <a href="https://roadmap.sh/sql" target="_blank" rel="noreferrer">roadmap de SQL do roadmap.sh</a>.
        Problemas e dados são originais. Projeto independente, sem vínculo com o roadmap.sh.
      </footer>
    </main>
  );
}
