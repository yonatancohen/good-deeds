import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FALLBACK_GLOBAL_GOAL, resolveClassGoal } from './classGoal';

describe('resolveClassGoal', () => {
  it('uses class override when set', () => {
    assert.equal(resolveClassGoal({ points_goal: 300 }, 100), 300);
  });

  it('falls back to global goal when override is null', () => {
    assert.equal(resolveClassGoal({ points_goal: null }, 250), 250);
  });

  it('falls back when class is missing', () => {
    assert.equal(resolveClassGoal(null, 300), 300);
    assert.equal(resolveClassGoal(undefined, null), FALLBACK_GLOBAL_GOAL);
  });
});
