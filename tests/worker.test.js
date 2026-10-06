import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../worker.js';

const validBody = {
  analysis: {
    stage: 'rest',
    probability: 70,
    daysInCycle: 0,
    criteria: {
      emaBreakout: false,
      singleSidedRise: true,
      volumeExpansion: false,
      consecutiveDays: 2,
    },
    metrics: {
      emaDistance: -1.2,
      maxDrawdown: 8,
      maxGain30d: 12,
      volumeRatio: 1,
      change7d: 5,
      change30d: 4,
    },
  },
  stats: {
    currentPrice: 80_000,
    change24hPercent: 1,
  },
  lang: 'zh',
};

test('returns a safe, classified response when the AI provider fails', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { type: 'provider_error', message: 'secret provider response' },
  }), { status: 402, headers: { 'Content-Type': 'application/json' } });

  try {
    const response = await worker.fetch(
      new Request('https://btc100.day/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
      { API_KEY: 'test-key' },
    );
    const body = await response.json();

    assert.equal(response.status, 502);
    assert.equal(body.error, 'AI_PROVIDER_QUOTA');
    assert.match(body.insight, /余额或额度不足/);
    assert.equal(JSON.stringify(body).includes('secret provider response'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects invalid analysis before calling the provider', async () => {
  const response = await worker.fetch(
    new Request('https://btc100.day/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, analysis: { stage: 'unknown' } }),
    }),
    { API_KEY: 'test-key' },
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, 'INVALID_REQUEST');
});
