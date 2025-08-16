import OpenAI from 'openai';
import { parseResearchBackgroundFromStorage } from '../../../constants/researchBackground';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { researchBackground, userName } = req.body || {};

    if (!researchBackground || typeof researchBackground !== 'string') {
      return res.status(400).json({ error: 'researchBackground (string) is required' });
    }

    // Parse sections to provide clearer structure to the model
    const parsed = parseResearchBackgroundFromStorage(researchBackground);

    const systemPrompt = `You are an assistant that produces concise, semicolon-separated keyword summaries of a researcher's background and positionality for collaborative qualitative analysis tools.`;

    const userPrompt = `Summarize the following research background into a compact list of 1-12 keywords/short phrases separated by semicolons + space (; ). 
Only return the keywords line, no extra words, labels, or quotes. Keep each keyword under 3-5 words. Prioritize items like: discipline, methods, theoretical lenses, domain expertise, populations/contexts, positionality/identity factors, likely biases, analytic style.

Number of keywords should be proportional to the length and complexity of the research background provided, less provided context should result in fewer than usual keywords.

${userName ? `Name: ${userName}\n` : ''}
Brief History of Qualitative Data Analysis:
${parsed.qualitativeHistory || 'Not provided'}

How Background May Affect Interpretation:
${parsed.backgroundExperience || 'Not provided'}

Initial View of the Data:
${parsed.initialDataView || 'Not provided'}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      reasoning_effort: 'minimal',
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'research_background_keywords',
          schema: {
            type: 'object',
            properties: {
              keywords: {
                type: 'string',
                description: 'Semicolon-separated keywords that summarize the research background.',
              },
            },
            required: ['keywords'],
            additionalProperties: false,
          },
        },
      },
    });

    const data = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
    const keywords = (data.keywords || '').trim();

    if (!keywords) {
      return res.status(502).json({ error: 'No keywords generated' });
    }

    return res.status(200).json({ success: true, keywords });
  } catch (error) {
    console.error('Error generating research background keywords:', error);
    return res.status(500).json({ error: 'Failed to generate keywords', details: error.message });
  }
}
