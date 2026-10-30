import { parse } from 'yaml';
import schema from '../content/dataset/schema.sql?raw';
import sample from '../content/dataset/sample.sql?raw';
import hidden from '../content/dataset/hidden.sql?raw';
import roadmapRaw from '../content/roadmap.yaml?raw';

export type Difficulty = 'facil' | 'medio' | 'dificil';

export interface Problem {
  slug: string;
  order: number;
  title: string;
  section: string;
  difficulty: Difficulty;
  topics: string[];
  statement: string;
  ordered: boolean;
  check?: string;
  solution: string;
  hints: string[];
  explanation: string;
  traps: { reason: string; sql: string }[];
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

export const problems: Problem[] = Object.values(files)
  .map((raw) => parse(raw) as Problem)
  .sort((a, b) => a.order - b.order);

export const sections: Section[] = (parse(roadmapRaw) as { sections: Section[] }).sections;

export const dataset = { schema, sample, hidden };
