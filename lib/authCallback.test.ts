import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseAuthCallbackFromLocation,
  authCallbackHadParams,
} from './authCallback';

describe('parseAuthCallbackFromLocation', () => {
  it('reads implicit tokens from the hash', () => {
    const result = parseAuthCallbackFromLocation({
      search: '',
      hash: '#access_token=aaa&refresh_token=bbb&type=recovery',
    });
    assert.deepEqual(result, {
      kind: 'tokens',
      access_token: 'aaa',
      refresh_token: 'bbb',
      type: 'recovery',
    });
  });

  it('reads PKCE code from the query string', () => {
    const result = parseAuthCallbackFromLocation({
      search: '?code=abc123',
      hash: '',
    });
    assert.deepEqual(result, { kind: 'code', code: 'abc123' });
  });

  it('reads token_hash recovery links', () => {
    const result = parseAuthCallbackFromLocation({
      search: '?token_hash=th&type=recovery',
      hash: '',
    });
    assert.deepEqual(result, {
      kind: 'token_hash',
      token_hash: 'th',
      type: 'recovery',
    });
  });

  it('surfaces auth errors from the URL', () => {
    const result = parseAuthCallbackFromLocation({
      search: '',
      hash: '#error=access_denied&error_description=Email%20link%20is%20invalid%20or%20has%20expired',
    });
    assert.equal(result?.kind, 'error');
    if (result?.kind === 'error') {
      assert.match(result.message, /invalid|expired/i);
    }
  });

  it('authCallbackHadParams detects recovery params', () => {
    assert.equal(
      authCallbackHadParams({ search: '?code=x', hash: '' }),
      true,
    );
    assert.equal(
      authCallbackHadParams({ search: '', hash: '#access_token=a&refresh_token=b' }),
      true,
    );
    assert.equal(authCallbackHadParams({ search: '', hash: '' }), false);
  });
});
