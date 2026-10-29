import OpenAI from 'openai';
import { requireFirebaseAuth } from './requireFirebaseAuth.js';

const OPENAI_KEY_PATTERN = /^sk-[A-Za-z0-9_-]{20,300}$/;
let deploymentClient;

export const getVisitorOpenAIKey = (req) => req.headers['x-openai-key'];

// A visitor's own key is used for this request only and is never stored.
// Without one, the request must come from a signed-in user and uses the deployment key.
export async function getOpenAIForRequest(req, res) {
  const visitorKey = getVisitorOpenAIKey(req);
  if (visitorKey !== undefined) {
    if (typeof visitorKey !== 'string' || !OPENAI_KEY_PATTERN.test(visitorKey)) {
      res.status(400).json({ error: 'Invalid OpenAI API key format' });
      return null;
    }
    return new OpenAI({ apiKey: visitorKey });
  }

  if (!(await requireFirebaseAuth(req, res))) return null;
  deploymentClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return deploymentClient;
}
