import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterClassesByCurrentYear } from './schoolYear';

describe('filterClassesByCurrentYear', () => {
  const classes = [
    { id: '1', year: 'תשפ״ו', name: 'א1' },
    { id: '2', year: 'תשפ״ה', name: 'א1' },
    { id: '3', year: null, name: 'ב2' },
  ];

  it('keeps only the current academic year when set', () => {
    assert.deepEqual(filterClassesByCurrentYear(classes, 'תשפ״ו'), [
      { id: '1', year: 'תשפ״ו', name: 'א1' },
    ]);
  });

  it('returns all classes when current year is unset', () => {
    assert.equal(filterClassesByCurrentYear(classes, null).length, 3);
    assert.equal(filterClassesByCurrentYear(classes, undefined).length, 3);
    assert.equal(filterClassesByCurrentYear(classes, '').length, 3);
  });
});
