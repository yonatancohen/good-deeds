import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';

describe('teacherDefaultPassword', () => {
  const ENV_KEY = 'EXPO_PUBLIC_TEACHER_DEFAULT_PASSWORD';
  let previous: string | undefined;

  beforeEach(() => {
    previous = process.env[ENV_KEY];
    delete process.env[ENV_KEY];
    // Fresh module each time so env is read again
    delete require.cache[require.resolve('./teacherDefaultPassword')];
  });

  afterEach(() => {
    if (previous === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = previous;
    delete require.cache[require.resolve('./teacherDefaultPassword')];
  });

  it('uses Bi123456 as the school-wide default when env is unset', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./teacherDefaultPassword') as typeof import('./teacherDefaultPassword');
    assert.equal(mod.getTeacherInvitePassword(), 'Bi123456');
    assert.equal(mod.usesTeacherDefaultPassword(), true);
  });

  it('allows env override', () => {
    process.env[ENV_KEY] = 'CustomPass1';
    delete require.cache[require.resolve('./teacherDefaultPassword')];
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./teacherDefaultPassword') as typeof import('./teacherDefaultPassword');
    assert.equal(mod.getTeacherInvitePassword(), 'CustomPass1');
  });
});
