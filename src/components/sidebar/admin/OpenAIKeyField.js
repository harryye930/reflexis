import React, { useState } from 'react';
import { useOpenAIKey } from '../../../hooks/useOpenAIKey.js';
import { setOpenAIKey } from '../../../lib/openaiKey.js';

const OpenAIKeyField = () => {
  const openAIKey = useOpenAIKey();
  const [draft, setDraft] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const key = draft.trim();
    if (!key) return;

    setChecking(true);
    setError(null);
    try {
      const response = await fetch('/api/openai-key/check', {
        method: 'POST',
        headers: { 'X-OpenAI-Key': key }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Could not check this API key.');
      }
      setOpenAIKey(key);
      setDraft('');
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  if (openAIKey) {
    return (
      <div className="flex items-center justify-between gap-3 pl-4">
        <p className="text-xs text-gray-600">Using your OpenAI key ending in {openAIKey.slice(-4)}</p>
        <button
          type="button"
          onClick={() => setOpenAIKey('')}
          className="flex-shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          Remove key
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
      <label htmlFor="openai-api-key" className="block text-sm text-gray-600">Bring Your Own Key</label>
      <p className="text-xs text-gray-500">
        The demo doesn’t include AI. To try it, use your own key; requests are billed to your OpenAI account.
        The key stays in this tab only and is removed when you refresh or reset the demo.
      </p>
      <div className="flex gap-2">
        <input
          id="openai-api-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="sk-..."
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={checking || !draft.trim()}
          className="flex-shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Use key'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
};

export default OpenAIKeyField;
