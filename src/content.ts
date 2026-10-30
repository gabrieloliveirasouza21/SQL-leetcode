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
  order: number;
  title: string;
  section: string;
  difficulty: Difficulty;
  topics: string[];
  statement: string;
  hints: string[];
  explanation: string;
  traps: { reason: string; sql: string }[];
  /** Presente só em problemas conceituais, que não têm SQL para corrigir. */
  options?: QuizOption[];
  answer?: number;
}

export interface Section {
  id: string;
  title: string;
  summary: string;
  study: { label: string; url: string }[];
}

const files = import.meta.glob<string>('../content/problems/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const sections: Section[] = (parse(roadmapRaw) as { sections: Section[] }).sections;

const sectionRank = new Map(sections.map((section, index) => [section.id, index]));

// Um arquivo pode trazer um problema ou uma lista deles.
export const problems: Problem[] = Object.values(files)
  .flatMap((raw) => parse(raw) as Problem | Problem[])
  .sort((a, b) => (sectionRank.get(a.section) ?? 0) - (sectionRank.get(b.section) ?? 0) || a.order - b.order);

export const dataset = { schema, sample, hidden };
