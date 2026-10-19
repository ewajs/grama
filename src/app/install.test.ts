import { expect, it } from 'vitest';
import { installOption } from './install.svelte';

it('offers the browser prompt when there is one', () => {
  expect(installOption({ installed: false, canPrompt: true, ios: false })).toBe('prompt');
});

it('explains the steps on iOS, where there is no prompt', () => {
  expect(installOption({ installed: false, canPrompt: false, ios: true })).toBe('ios');
});

it('offers nothing once installed, or where it can not be done', () => {
  expect(installOption({ installed: true, canPrompt: true, ios: false })).toBe('none');
  expect(installOption({ installed: false, canPrompt: false, ios: false })).toBe('none');
});
