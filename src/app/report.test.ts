import { expect, it } from 'vitest';
import { ISSUES_URL, reportUrl } from './report';

it('pre-fills a GitHub issue with what is needed to reproduce the level', () => {
  const url = new URL(
    reportUrl('missing', {
      levelNumber: 37,
      letters: ['P', 'O', 'R', 'Q', 'U', 'E'],
      targets: ['PORQUE', 'QUE'],
      found: ['QUE'],
      rejected: ['PURO', 'ROPE'],
      build: 'abc1234',
    }),
  );
  expect(url.href.startsWith(ISSUES_URL)).toBe(true);
  expect(url.searchParams.get('title')).toBe('Falta una palabra (nivel 37)');
  const body = url.searchParams.get('body')!;
  for (const fact of ['Nivel: 37', 'P O R Q U E', 'PORQUE, QUE', 'PURO, ROPE', 'abc1234']) {
    expect(body).toContain(fact);
  }
});
