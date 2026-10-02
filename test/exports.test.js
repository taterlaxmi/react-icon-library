import assert from 'node:assert/strict';
import test from 'node:test';
import { Drinkprime, Kiwi, Zepto, generateIcons } from '../dist/index.js';

test('package root exports every current icon and the generator API', () => {
  assert.equal(typeof Kiwi, 'function');
  assert.equal(typeof Drinkprime, 'function');
  assert.equal(typeof Zepto, 'function');
  assert.equal(typeof generateIcons, 'function');
});