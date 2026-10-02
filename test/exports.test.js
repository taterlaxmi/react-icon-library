import assert from 'node:assert/strict';
import test from 'node:test';
import { Kiwi, generateIcons } from '../dist/index.js';

test('package root exports the Kiwi React component and generator API', () => {
  assert.equal(typeof Kiwi, 'function');
  assert.equal(typeof generateIcons, 'function');
});