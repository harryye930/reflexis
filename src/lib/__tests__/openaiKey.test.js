const mockRetrieve = jest.fn();
jest.mock('../firebase.js', () => ({ auth: { currentUser: null } }));
jest.mock('../api/requireFirebaseAuth.js', () => ({ requireFirebaseAuth: jest.fn() }));
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ apiKey }) => ({ apiKey, models: { retrieve: mockRetrieve } }))
}));

import OpenAI from 'openai';
import { auth } from '../firebase.js';
import { requireFirebaseAuth } from '../api/requireFirebaseAuth.js';
import { getOpenAIForRequest } from '../api/openaiForRequest.js';
import { authFetch } from '../authFetch.js';
import { getOpenAIKey, setOpenAIKey, subscribeOpenAIKey } from '../openaiKey.js';
import checkKey from '../../pages/api/openai-key/check.js';

const visitorKey = `sk-test-${'a1B2_c3-'.repeat(4)}`;
const request = (headers = {}, method = 'POST') => ({ method, headers });
const response = () => {
  const res = { statusCode: 200, body: undefined };
  res.status = jest.fn(code => { res.statusCode = code; return res; });
  res.json = jest.fn(body => { res.body = body; return res; });
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  auth.currentUser = null;
  setOpenAIKey('');
  global.fetch = jest.fn(async () => ({ ok: true }));
});

describe('choosing the OpenAI key for an AI request', () => {
  test('a visitor key is used without requiring a Firebase sign-in', async () => {
    const res = response();
    const client = await getOpenAIForRequest(request({ 'x-openai-key': visitorKey }), res);
    expect(client.apiKey).toBe(visitorKey);
    expect(requireFirebaseAuth).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('without a visitor key, a signed-out request is refused by the Firebase check', async () => {
    requireFirebaseAuth.mockResolvedValue(null);
    const client = await getOpenAIForRequest(request(), response());
    expect(client).toBeNull();
    expect(requireFirebaseAuth).toHaveBeenCalledTimes(1);
    expect(OpenAI).not.toHaveBeenCalled();
  });

  test.each([
    ['plain text', 'hello'],
    ['too short', 'sk-abc'],
    ['empty', ''],
    ['surrounding whitespace', ` ${visitorKey} `],
    ['embedded newline', `${visitorKey}\nX-Other: 1`],
    ['repeated header', [visitorKey, visitorKey]]
  ])('a malformed visitor key (%s) is rejected before reaching OpenAI', async (_, key) => {
    const res = response();
    expect(await getOpenAIForRequest(request({ 'x-openai-key': key }), res)).toBeNull();
    expect(res.statusCode).toBe(400);
    expect(OpenAI).not.toHaveBeenCalled();
    expect(requireFirebaseAuth).not.toHaveBeenCalled();
  });

  test('signed-in users share one deployment client, but their own key takes precedence', async () => {
    process.env.OPENAI_API_KEY = 'sk-deployment-key';
    requireFirebaseAuth.mockResolvedValue({ uid: 'researcher' });
    const first = await getOpenAIForRequest(request({ authorization: 'Bearer token' }), response());
    const second = await getOpenAIForRequest(request({ authorization: 'Bearer token' }), response());
    expect(first.apiKey).toBe('sk-deployment-key');
    expect(second).toBe(first);

    const own = await getOpenAIForRequest(request({ authorization: 'Bearer token', 'x-openai-key': visitorKey }), response());
    expect(own.apiKey).toBe(visitorKey);
    expect(requireFirebaseAuth).toHaveBeenCalledTimes(2);
  });
});

describe('checking a visitor key', () => {
  const check = async (headers, method) => {
    const res = response();
    await checkKey(request(headers, method), res);
    return res;
  };
  const failWith = (error) => mockRetrieve.mockRejectedValueOnce(Object.assign(new Error('OpenAI error'), error));

  test('a working key is accepted', async () => {
    mockRetrieve.mockResolvedValueOnce({ id: 'gpt-6.1-sol' });
    const res = await check({ 'x-openai-key': visitorKey });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockRetrieve).toHaveBeenCalledWith('gpt-6.1-sol');
  });

  test('a missing or malformed key, or the wrong method, never reaches OpenAI or the deployment key', async () => {
    expect((await check({})).statusCode).toBe(400);
    expect((await check({ authorization: 'Bearer token' })).statusCode).toBe(400);
    expect((await check({ 'x-openai-key': 'not-a-key' })).statusCode).toBe(400);
    expect((await check({ 'x-openai-key': visitorKey }, 'GET')).statusCode).toBe(405);
    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(requireFirebaseAuth).not.toHaveBeenCalled();
  });

  test('only a key OpenAI rejects outright is refused; restricted keys and outages are told apart', async () => {
    failWith({ status: 401, code: 'invalid_api_key' });
    const rejected = await check({ 'x-openai-key': visitorKey });
    expect(rejected.statusCode).toBe(401);
    expect(rejected.body.error).toBe('OpenAI did not accept this API key.');
    expect(JSON.stringify(rejected.body)).not.toContain(visitorKey);

    // A restricted key without permission to read model details can still make completions.
    failWith({ status: 401, code: null });
    expect((await check({ 'x-openai-key': visitorKey })).statusCode).toBe(200);
    failWith({ status: 403, code: 'insufficient_permissions' });
    expect((await check({ 'x-openai-key': visitorKey })).statusCode).toBe(200);

    failWith({ status: undefined });
    const outage = await check({ 'x-openai-key': visitorKey });
    expect(outage.statusCode).toBe(502);
  });
});

describe('sending the visitor key from the browser', () => {
  const sentHeaders = () => global.fetch.mock.calls.at(-1)[1].headers;

  test('no key header is sent until a visitor adds one', async () => {
    await authFetch('/api/reflexive/summary', { headers: { 'Content-Type': 'application/json' } });
    expect(sentHeaders()).toEqual({ 'Content-Type': 'application/json' });
  });

  test('a trimmed key is attached alongside the caller headers and any sign-in token', async () => {
    setOpenAIKey(`  ${visitorKey}\n`);
    await authFetch('/api/reflexive/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    expect(sentHeaders()).toEqual({ 'Content-Type': 'application/json', 'X-OpenAI-Key': visitorKey });

    auth.currentUser = { getIdToken: async () => 'id-token' };
    await authFetch('/api/reflexive/summary');
    expect(sentHeaders()).toEqual({ Authorization: 'Bearer id-token', 'X-OpenAI-Key': visitorKey });
  });

  test('removing the key notifies the UI, stops sending it, and nothing is kept in browser storage', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeOpenAIKey(listener);
    setOpenAIKey(visitorKey);
    expect(getOpenAIKey()).toBe(visitorKey);
    expect(localStorage.length + sessionStorage.length).toBe(0);

    setOpenAIKey('');
    await authFetch('/api/discussion-prompt/generate');
    expect(sentHeaders()).toEqual({});
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    setOpenAIKey(visitorKey);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
