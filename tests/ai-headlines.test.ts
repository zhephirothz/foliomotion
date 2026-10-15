import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSlideHeadlines, parseHeadlineCompletion, headlineTokenBudget, headlineResponseFormat, parseHeadlines, localEndpoint, headlinePrompt, type AIConnection } from '../src/aiProviders.ts';
import { aiGateway } from '../server/aiGateway.ts';

test('headline validation rejects malformed or overlong content without silently truncating it', () => {
  assert.throws(() => parseHeadlines('plain prose'));
  assert.throws(() => parseHeadlines('{"wrong":[]}'));
  assert.throws(() => parseHeadlines(JSON.stringify({ captions: ['x'.repeat(85)] })));
  assert.deepEqual(parseHeadlines('```json\n{"captions":["Find your next opening","Find your next opening","Book in a few taps"]}\n```'), ['Find your next opening', 'Book in a few taps']);
});

test('local connection rejects remote URLs and embedded credentials', () => {
  const base: AIConnection = { id: 'test', name: 'Test', provider: 'lm-studio', endpoint: 'http://localhost:1234/v1', model: 'test' };
  assert.equal(localEndpoint(base, '/models'), 'http://localhost:1234/v1/models');
  assert.throws(() => localEndpoint({ ...base, endpoint: 'https://example.com' }, '/models'));
  assert.throws(() => localEndpoint({ ...base, endpoint: 'http://user:pass@localhost:1234' }, '/models'));
});

test('local generation sends only the selected slide facts and returns reviewable suggestions', async (t) => {
  const original = globalThis.fetch;
  let requestBody: any;
  globalThis.fetch = async (_url, init) => { assert.equal(_url, "/api/ai/local"); requestBody = JSON.parse(String(init?.body)).payload; return Response.json({ choices: [{ message: { content: '{"captions":["Bookings, made effortless"]}' } }] }); };
  t.after(() => { globalThis.fetch = original; });
  const result = await generateSlideHeadlines({ id: 'local', name: 'LM Studio', provider: 'lm-studio', endpoint: 'http://localhost:1234/v1', model: 'test-model' }, undefined, { projectName: 'Studio', role: 'Developer', description: 'I built the booking calendar.' }, new AbortController().signal);
  assert.deepEqual(result, ['Bookings, made effortless']);
  assert.equal(requestBody.messages[0].content, headlinePrompt);
  assert.deepEqual(JSON.parse(requestBody.messages[1].content), { projectName: 'Studio', role: 'Developer', description: 'I built the booking calendar.' });
  assert.equal(requestBody.model, 'test-model');
  assert.equal(requestBody.stream, false);
  assert.equal(requestBody.max_tokens, headlineTokenBudget);
  assert.equal(requestBody.reasoning_effort, 'none');
  assert.deepEqual(requestBody.response_format, headlineResponseFormat);
});

test('API gateway keeps keys server-side, forwards one slide, rejects foreign origins and disconnects', async (t) => {
  const original = globalThis.fetch;
  const upstream: { url: string; body: any; auth: unknown }[] = [];
  globalThis.fetch = async (url, init) => {
    upstream.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null, auth: (init?.headers as Record<string,string>)?.Authorization });
    return Response.json(String(url).endsWith('/key') || String(url).endsWith('/models') ? { data: {} } : { choices: [{ message: { content: '{"captions":["A faster way to book"]}' } }] });
  };
  t.after(() => { globalThis.fetch = original; });
  let handler: any;
  const plugin = aiGateway();
  (plugin.configureServer as Function)({ middlewares: { use(fn: unknown) { handler = fn; } } });
  async function request(path: string, body: object, origin = 'http://localhost:5173') {
    let status = 0; let output: any;
    await handler({ url: path, method: 'POST', headers: { host: 'localhost:5173', origin, 'content-type': 'application/json' }, async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(body)); } }, { writeHead(code: number) { status = code; }, end(value: string) { output = JSON.parse(value); } }, () => { throw new Error('unexpected fallback'); });
    return { status, output };
  }
  const blocked = await request('/api/ai/connect', { apiKey: 'test-key', model: 'vendor/model' }, 'https://foreign.example');
  assert.equal(blocked.status, 403); assert.equal(upstream.length, 0);
  const connected = await request('/api/ai/connect', { provider: 'openrouter', apiKey: 'test-key', model: 'vendor/model' });
  assert.equal(connected.status, 200); assert.ok(connected.output.token); assert.equal(JSON.stringify(connected.output).includes('test-key'), false);
  const token = connected.output.token;
  const generated = await request('/api/ai/headlines', { token, facts: { projectName: 'Studio', role: 'Developer', description: 'Built booking.', extra: 'DO NOT SEND' } });
  assert.deepEqual(generated.output, { captions: ['A faster way to book'] });
  assert.equal(upstream[1].auth, 'Bearer test-key');
  assert.equal(JSON.stringify(upstream[1].body).includes('DO NOT SEND'), false);
  await request('/api/ai/disconnect', { token });
  assert.equal((await request('/api/ai/headlines', { token, facts: {} })).status, 401);
});

test('hosted gateway uses Anthropic Messages headers and response shape', async (t) => {
  const original = globalThis.fetch;
  const calls: { url: string; headers: Record<string, string>; body?: any }[] = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), headers: init?.headers as Record<string, string>, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return Response.json(String(url).endsWith('/messages')
      ? { content: [{ type: 'text', text: '{"captions":["Built a clearer plant workflow"]}' }], stop_reason: 'end_turn' }
      : { data: [{ id: 'claude-sonnet-latest' }] });
  };
  t.after(() => { globalThis.fetch = original; });
  let handler: any;
  (aiGateway().configureServer as Function)({ middlewares: { use(fn: unknown) { handler = fn; } } });
  async function request(path: string, body: object) {
    let output: any;
    await handler({ url: path, method: 'POST', headers: { host: 'localhost:5173', origin: 'http://localhost:5173', 'content-type': 'application/json' }, async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(body)); } }, { writeHead() {}, end(value: string) { output = JSON.parse(value); } }, () => {});
    return output;
  }
  const { token } = await request('/api/ai/connect', { provider: 'claude', apiKey: 'secret-claude-key', model: 'claude-sonnet-latest' });
  assert.equal(calls[0].url, 'https://api.anthropic.com/v1/models');
  assert.equal(calls[0].headers['x-api-key'], 'secret-claude-key');
  const output = await request('/api/ai/headlines', { token, facts: { projectName: 'Factory', role: 'Developer', description: 'Built workflow' } });
  assert.deepEqual(output, { captions: ['Built a clearer plant workflow'] });
  assert.equal(calls[1].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(calls[1].headers['anthropic-version'], '2023-06-01');
  assert.equal(calls[1].body.system, headlinePrompt);
  assert.equal(JSON.stringify(calls[1].body).includes('secret-claude-key'), false);
});

test('local gateway avoids browser CORS, restricts targets and reports unavailable servers', async (t) => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (url, init) => { calls.push(String(url)); assert.equal(init?.redirect, 'error'); return Response.json({ data: [{ id: 'local-model' }] }); };
  t.after(() => { globalThis.fetch = original; });
  let handler: any;
  (aiGateway().configureServer as Function)({ middlewares: { use(fn: unknown) { handler = fn; } } });
  async function request(body: object, origin = 'http://localhost:5173') {
    let status = 0; let output: any;
    await handler({ url: '/api/ai/local', method: 'POST', headers: { host: 'localhost:5173', origin, 'content-type': 'application/json' }, async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(body)); } }, { writeHead(code: number) { status = code; }, end(value: string) { output = JSON.parse(value); } }, () => {});
    return { status, output };
  }
  const body = { provider: 'lm-studio', endpoint: 'http://localhost:1234/v1', path: '/models' };
  assert.equal((await request(body, 'https://foreign.example')).status, 403);
  assert.equal((await request({ ...body, endpoint: 'https://example.com' })).status, 400);
  assert.equal((await request({ ...body, path: '/other' })).status, 400);
  assert.equal(calls.length, 0);
  assert.deepEqual((await request(body)).output, { data: [{ id: 'local-model' }] });
  assert.equal(calls[0], 'http://127.0.0.1:1234/v1/models');
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  const failed = await request(body);
  assert.equal(failed.status, 502);
  assert.match(failed.output.error, /1234.*server is running/);
});


test('reasoning-only and truncated completions never become accepted headline candidates', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => Response.json({ choices: [{ message: { content: '', reasoning_content: '{"captions":["Not final"]}' }, finish_reason: 'length' }] });
  await assert.rejects(generateSlideHeadlines({ id: 'local', name: 'LM Studio', provider: 'lm-studio', endpoint: 'http://localhost:1234/v1', model: 'qwen/qwen3.8-27b' }, undefined, { projectName: 'odoo', role: 'Web Developer', description: 'I built this for managing plant factory' }, new AbortController().signal), /output limit/);
  assert.throws(() => parseHeadlineCompletion('', 'stop'), /no final headline/);
  assert.throws(() => parseHeadlineCompletion('{"captions":["Looks complete"]}', 'length'), /output limit/);
  assert.deepEqual(parseHeadlineCompletion('{"captions":["Built for plant factory management"]}', 'stop'), ['Built for plant factory management']);
});
