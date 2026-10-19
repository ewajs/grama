import { expect, it } from 'vitest';
import { levelProblems } from '../../core/level';
import { levels } from './levels';

it.each(levels.map((level, index) => [index + 1, level] as const))(
  'level %i is valid',
  (_, level) => {
    expect(levelProblems(level)).toEqual([]);
  },
);
