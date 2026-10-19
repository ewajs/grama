import { expect, it } from 'vitest';
import { ISSUES_URL, reportUrl, type ReportContext } from './report';

const context: ReportContext = {
  place: { kind: 'level', levelNumber: 37, difficulty: 'challenging', occurrence: 4 },
  tier: 'hard',
  letters: ['P', 'O', 'R', 'Q', 'U', 'E'],
  targets: ['PORQUE', 'QUE'],
  found: ['QUE'],
  rejected: ['PURO', 'ROPE'],
  build: 'abc1234',
};

it('pre-fills a GitHub issue with what is needed to reproduce the level', () => {
  const url = new URL(reportUrl('missing', context));
  expect(url.href.startsWith(ISSUES_URL)).toBe(true);
  expect(url.searchParams.get('title')).toBe('Falta una palabra (nivel 37)');
  const body = url.searchParams.get('body')!;
  for (const fact of [
    'Nivel: 37 · challenging · bloque 4',
    'Dificultad: hard',
    'P O R Q U E',
    'PORQUE, QUE',
    'PURO, ROPE',
    'abc1234',
  ]) {
    expect(body).toContain(fact);
  }
});

it('names a daily challenge by its date', () => {
  const url = new URL(
    reportUrl('wrong', { ...context, place: { kind: 'daily', date: '2026-10-19' } }),
  );
  expect(url.searchParams.get('title')).toContain('desafío del 2026-10-19');
  expect(url.searchParams.get('body')).toContain('Desafío del día: 2026-10-19');
});
