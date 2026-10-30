import assert from 'node:assert/strict';
import test from 'node:test';
import { Buffer } from 'node:buffer';
import {
  GitHubBudgetLedger,
  kstMonth,
  MAX_API_ATTEMPTS_PER_RUN,
  MAX_INPUT_BYTES,
  MAX_OUTPUT_TOKENS,
  MONTHLY_BUDGET_KRW,
  requestCeilingKrw,
} from '../openai-budget.mjs';

const fixedMonth = '2026-10';

function encodeLedger(ledger) {
  return Buffer.from(JSON.stringify(ledger), 'utf8').toString('base64');
}

function fakeGitHub({ ledger, status = 200 } = {}) {
  let file = {
    sha: 'blob-1',
    content: encodeLedger(
      ledger || {
        version: 1,
        currency: 'KRW',
        monthlyLimitKrw: MONTHLY_BUDGET_KRW,
        usdToKrwCeiling: 2_500,
        months: {},
      }
    ),
  };
  const writes = [];
  const fetchImpl = async (url, options = {}) => {
    assert.match(url, /\/contents\/\.github\/openai-budget\/ledger\.json/);
    if (status !== 200) return new Response('{}', { status });
    if (!options.method) return new Response(JSON.stringify(file), { status: 200 });
    assert.equal(options.method, 'PUT');
    const body = JSON.parse(options.body);
    assert.equal(body.branch, 'automation/openai-budget-ledger');
    writes.push(body.message);
    file = { sha: `blob-${writes.length + 1}`, content: body.content };
    return new Response('{}', { status: 200 });
  };
  return { fetchImpl, writes, readLedger: () => JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) };
}

function createLedger(fake) {
  return new GitHubBudgetLedger({
    repository: 'bada1951a/astrowind-blog',
    token: 'test-token',
    branch: 'automation/openai-budget-ledger',
    fetchImpl: fake.fetchImpl,
    monthProvider: () => fixedMonth,
  });
}

test('uses the KST calendar month across UTC month boundaries', () => {
  assert.equal(kstMonth(new Date('2026-10-31T14:59:59.000Z')), '2026-10');
  assert.equal(kstMonth(new Date('2026-10-31T15:00:00.000Z')), '2026-11');
});

test('reserves a whole-request upper bound below the 30,000 KRW monthly ceiling', () => {
  assert.equal(requestCeilingKrw({ inputBytes: MAX_INPUT_BYTES, maxOutputTokens: MAX_OUTPUT_TOKENS }), 12);
  assert.equal(MAX_API_ATTEMPTS_PER_RUN * 12 * 31, 26_784);
  assert.ok(MAX_API_ATTEMPTS_PER_RUN * 12 * 31 < MONTHLY_BUDGET_KRW);
  assert.throws(() => requestCeilingKrw({ inputBytes: MAX_INPUT_BYTES + 1 }), /초과/);
  assert.throws(() => requestCeilingKrw({ inputBytes: 1, maxOutputTokens: MAX_OUTPUT_TOKENS + 1 }), /이하/);
});

test('persists the reservation before API use and settles to conservative observed usage', async () => {
  const fake = fakeGitHub();
  const ledger = createLedger(fake);
  const reservation = await ledger.reserve({ requestId: 'run-1-1', inputBytes: 8_000 });
  assert.equal(reservation.reservationKrw, 8);
  assert.equal(fake.writes.length, 1);
  assert.equal(fake.readLedger().months[fixedMonth].requests['run-1-1'].status, 'reserved');

  await ledger.settle({ requestId: 'run-1-1', inputTokens: 5_000, outputTokens: 1_000 });
  assert.equal(fake.writes.length, 2);
  assert.equal(fake.readLedger().months[fixedMonth].requests['run-1-1'].status, 'settled');
  assert.equal(fake.readLedger().months[fixedMonth].committedKrw, 3);
  assert.deepEqual(await ledger.summary(), {
    month: fixedMonth,
    committedKrw: 3,
    actualKrw: 3,
    pendingKrw: 0,
    remainingKrw: MONTHLY_BUDGET_KRW - 3,
  });
});

test('fails closed when the next reservation would exceed the monthly ceiling', async () => {
  const fake = fakeGitHub({
    ledger: {
      version: 1,
      currency: 'KRW',
      monthlyLimitKrw: MONTHLY_BUDGET_KRW,
      usdToKrwCeiling: 2_500,
      months: {
        [fixedMonth]: {
          requests: { previous: { status: 'settled', reservedKrw: 10, actualKrw: 29_995 } },
          committedKrw: 29_995,
        },
      },
    },
  });
  const ledger = createLedger(fake);
  await assert.rejects(ledger.reserve({ requestId: 'over-cap', inputBytes: MAX_INPUT_BYTES }), /한도 도달/);
  assert.equal(fake.writes.length, 0);
});

test('rejects duplicate request IDs so a retried job cannot charge twice under one reservation', async () => {
  const fake = fakeGitHub();
  const ledger = createLedger(fake);
  await ledger.reserve({ requestId: 'same-id', inputBytes: 1_000 });
  await assert.rejects(ledger.reserve({ requestId: 'same-id', inputBytes: 1_000 }), /중복/);
  assert.equal(fake.writes.length, 1);
});

test('blocks paid requests when the durable GitHub ledger is unavailable', async () => {
  const fake = fakeGitHub({ status: 503 });
  const ledger = createLedger(fake);
  await assert.rejects(ledger.reserve({ requestId: 'offline-ledger', inputBytes: 1_000 }), /유료 API 호출을 차단/);
});
