import { parse } from 'yaml';
import schema from '../content/dataset/schema.sql?raw';
import sample from '../content/dataset/sample.sql?raw';
import hidden from '../content/dataset/hidden.sql?raw';
import roadmapRaw from '../content/roadmap.yaml?raw';
import type { JudgedProblem } from './judge/judge';

export type Difficulty = 'facil' | 'medio' | 'dificil';

export interface QuizOption {
  text: string;
  /** Por que essa opção está certa ou errada. Aparece depois de responder. */
  why: string;
}

export interface Problem extends JudgedProblem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  /** Lugares na trilha, além dos listados em roadmap.yaml. */
  in?: string[];
  statement: string;
  hints: string[];
  explanation: string;
  traps: { reason: string; sql: string }[];
  /** Presente só em problemas conceituais, que não têm SQL para corrigir. */
  options?: QuizOption[];
  answer?: number;
}

export interface Subtopic {
  name: string;
  /** Agrupador do roadmap, como Numeric Functions. */
  group?: string;
  problems: string[];
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  study: { label: string; url: string }[];
  /** Problemas ligados direto ao tópico, quando ele não tem subtópicos. */
  problems?: string[];
  subtopics: Subtopic[];
}

const files = import.meta.glob<string>('../content/problems/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const topics: Topic[] = (parse(roadmapRaw) as { topics: Topic[] }).topics;

// Um arquivo pode trazer um problema ou uma lista deles.
const loaded = Object.values(files).flatMap((raw) => parse(raw) as Problem | Problem[]);

// `in` liga o problema à hierarquia, como `dml/WHERE`, ou só `stored-procedures` em tópico sem subtópicos.
for (const problem of loaded) {
  for (const place of problem.in ?? []) {
    // Só a primeira barra separa: há subtópicos com barra no nome, como Pivot / Unpivot Operations.
    const slash = place.indexOf('/');
    const topicId = slash === -1 ? place : place.slice(0, slash);
    const subtopicName = slash === -1 ? '' : place.slice(slash + 1);
    const topic = topics.find((t) => t.id === topicId);
    const target = subtopicName ? topic?.subtopics.find((s) => s.name === subtopicName) : topic;
    if (!target) throw new Error(`${problem.slug}: lugar desconhecido na trilha: ${place}`);
    (target.problems ??= []).push(problem.slug);
  }
}

// Dentro de cada subtópico, do mais fácil para o mais difícil.
const DIFFICULTY_RANK: Record<Difficulty, number> = { facil: 0, medio: 1, dificil: 2 };
const difficultyOf = new Map(loaded.map((p) => [p.slug, DIFFICULTY_RANK[p.difficulty]]));
const byDifficulty = (a: string, b: string) => (difficultyOf.get(a) ?? 0) - (difficultyOf.get(b) ?? 0);
for (const topic of topics) {
  topic.problems?.sort(byDifficulty);
  for (const subtopic of topic.subtopics) subtopic.problems.sort(byDifficulty);
}

/** Todos os problemas de um tópico, sem repetir. */
export function topicProblemSlugs(topic: Topic): string[] {
  return [...new Set([...(topic.problems ?? []), ...topic.subtopics.flatMap((s) => s.problems)])];
}

const roadmapOrder = [...new Set(topics.flatMap(topicProblemSlugs))];

// Problema fora do roadmap vai para o fim.
const rank = (slug: string) => {
  const index = roadmapOrder.indexOf(slug);
  return index === -1 ? roadmapOrder.length : index;
};

export const problems: Problem[] = [...loaded].sort((a, b) => rank(a.slug) - rank(b.slug));

/** Tópico em que o problema aparece primeiro. */
export const topicOf = (slug: string) => topics.find((topic) => topicProblemSlugs(topic).includes(slug));

/** Nomes dos subtópicos em que o problema aparece. */
export function subtopicNames(slug: string): string[] {
  return [...new Set(topics.flatMap((topic) => topic.subtopics.filter((s) => s.problems.includes(slug)).map((s) => s.name)))];
}

export const dataset = { schema, sample, hidden };
