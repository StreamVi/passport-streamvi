const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const { StreamViStrategy } = require('../dist/index.js');

function setup(options = {}) {
  const strategy = new StreamViStrategy({
    clientID: 'test-client', clientSecret: 'test-secret',
    callbackURL: 'http://localhost/callback', state: true, pkce: true, ...options,
  });
  const exchanges = [];
  const outcomes = [];
  strategy.getAccessToken = async (code, verifier) => {
    exchanges.push({ code, verifier });
    return { access_token: 'test-token', projectID: '17', projectExternalID: 'example' };
  };
  strategy.success = user => outcomes.push({ type: 'success', user });
  strategy.fail = (_info, status) => outcomes.push({ type: 'fail', status });
  strategy.error = error => outcomes.push({ type: 'error', error });
  return { strategy, exchanges, outcomes };
}

function begin(strategy, session) {
  let destination;
  strategy.redirect = url => { destination = new URL(url); };
  strategy.authenticate({ query: {}, session });
  assert.ok(destination, 'the authorization request must redirect');
  return destination;
}

const tick = () => new Promise(resolve => setImmediate(resolve));

for (const pkce of [true, false]) {
  test(`rejects missing, wrong and reused state (pkce=${pkce})`, async () => {
    for (const returnedState of [undefined, 'wrong-state']) {
      const { strategy, exchanges, outcomes } = setup({ pkce });
      const session = {};
      begin(strategy, session);
      strategy.authenticate({ query: { code: 'code', state: returnedState }, session });
      await tick();
      assert.equal(exchanges.length, 0);
      assert.deepEqual(outcomes.map(x => x.type), ['fail']);
    }
    const { strategy, exchanges, outcomes } = setup({ pkce });
    const session = {};
    const url = begin(strategy, session);
    const request = { query: { code: 'code', state: url.searchParams.get('state') }, session };
    strategy.authenticate(request);
    await tick();
    strategy.authenticate(request);
    await tick();
    assert.equal(exchanges.length, 1);
    assert.deepEqual(outcomes.map(x => x.type), ['success', 'fail']);
    if (pkce) {
      const challenge = createHash('sha256').update(exchanges[0].verifier).digest('base64url');
      assert.equal(challenge, url.searchParams.get('code_challenge'));
    } else {
      assert.equal(exchanges[0].verifier, undefined);
    }
    assert.equal(outcomes[0].user.projectId, '17');
  });
}

test('does not exchange a code when the session is missing', async () => {
  const { strategy, exchanges, outcomes } = setup();
  strategy.authenticate({ query: { code: 'code', state: 'state' } });
  await tick();
  assert.equal(exchanges.length, 0);
  assert.equal(outcomes[0].type, 'error');
});

test('waits for an asynchronous state store and supplies metadata', async () => {
  const { strategy, exchanges, outcomes } = setup();
  let finish;
  strategy._stateStore = { verify(req, state, meta, done) {
    assert.equal(state, 'state');
    assert.equal(meta.clientID, 'test-client');
    finish = done;
  } };
  strategy.authenticate({ query: { code: 'code', state: 'state' } });
  await tick();
  assert.equal(exchanges.length, 0);
  finish(null, 'saved-code-verifier');
  finish(null, 'duplicate-callback');
  await tick();
  assert.deepEqual(exchanges, [{ code: 'code', verifier: 'saved-code-verifier' }]);
  assert.equal(outcomes.length, 1);
});

for (const failure of ['reject', 'error', 'throw', 'missing-verifier']) {
  test(`never exchanges after state store failure: ${failure}`, async () => {
    const { strategy, exchanges, outcomes } = setup();
    strategy._stateStore = { verify(req, state, done) {
      if (failure === 'throw') throw new Error('store unavailable');
      if (failure === 'error') return done(new Error('store unavailable'));
      done(null, failure === 'missing-verifier' ? true : false);
    } };
    strategy.authenticate({ query: { code: 'code', state: 'state' } });
    await tick();
    assert.equal(exchanges.length, 0);
    assert.equal(outcomes.length, 1);
    assert.notEqual(outcomes[0].type, 'success');
  });
}

test('does not exchange a code supplied together with an OAuth denial', async () => {
  const { strategy, exchanges, outcomes } = setup();
  strategy.authenticate({ query: { error: 'access_denied', code: 'code' } });
  await tick();
  assert.equal(exchanges.length, 0);
  assert.equal(outcomes[0].type, 'fail');
});
