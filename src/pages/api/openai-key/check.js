import { getOpenAIForRequest, getVisitorOpenAIKey } from '../../../lib/api/openaiForRequest.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (getVisitorOpenAIKey(req) === undefined) {
    return res.status(400).json({ error: 'OpenAI API key is required' });
  }

  const openai = await getOpenAIForRequest(req, res);
  if (!openai) return;

  try {
    await openai.models.retrieve('gpt-6.1-sol');
  } catch (error) {
    // Restricted keys may not be allowed to read model details, so only refuse a key OpenAI rejects outright.
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ error: 'OpenAI did not accept this API key.' });
    }
    if (error.status === undefined) {
      return res.status(502).json({ error: 'Could not reach OpenAI. Try again in a moment.' });
    }
  }

  return res.status(200).json({ success: true });
}
