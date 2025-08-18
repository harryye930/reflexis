import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { responses, userId } = req.body;

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: 'No reflexive responses provided' });
    }

    // Group responses by the three question types
    const justificationResponses = responses.filter(r => r.promptType === 'justification').map(r => r.response);
    const positionalityResponses = responses.filter(r => r.promptType === 'positionality').map(r => r.response);
    const alternativeResponses = responses.filter(r => r.promptType === 'alternative').map(r => r.response);
    

    // Create system prompt for structured analysis
    const systemPrompt = `You are an expert qualitative research analyst specializing in reflexive memo analysis. Your task is to analyze a researcher's reflexive responses across three key dimensions and provide insightful meta-analytical summaries.

The three dimensions are:
1. LINGUISTIC PATTERNS (from "What specific language..." responses): Identify recurring patterns in how the researcher anchors their interpretations - what types of language, phrases, or linguistic elements they consistently focus on.

2. POSITIONALITY NARRATIVE (from "What personal experiences..." responses): Synthesize a coherent narrative about the researcher's background, experiences, and perspectives that influence their interpretations.

3. ALTERNATIVE THINKING PATTERNS (from "Could it be interpreted differently..." responses): Analyze patterns in the types of alternative interpretations the researcher generates, revealing their theoretical habits, analytical strengths, or potential blind spots.

Provide concise but insightful analysis that helps the researcher understand their own analytical patterns and reflexive tendencies.`;

    const userPrompt = `Please analyze the following reflexive responses from a qualitative researcher:

JUSTIFICATION RESPONSES (What specific language led to coding decisions):
${justificationResponses.map((r, i) => `${i + 1}. ${r}`).join('\n')}

POSITIONALITY RESPONSES (Personal/professional experiences influencing interpretation):
${positionalityResponses.map((r, i) => `${i + 1}. ${r}`).join('\n')}

ALTERNATIVE FRAMING RESPONSES (Different possible interpretations):
${alternativeResponses.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Please provide a structured analysis with exactly three sections:
1. Linguistic Patterns
2. Positionality Narrative  
3. Alternative Thinking Patterns

Each section should be 1-2 sentences that synthesize patterns and provide actionable insights for the researcher's self-awareness. You should address to the researchers that completed the reflections, instead of the individual researcher.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      reasoning_effort: "low",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "reflexive_summary",
          schema: {
            type: "object",
            properties: {
              linguisticPatterns: {
                type: "string",
                description: "Analysis of recurring linguistic patterns the researcher focuses on (1-2 sentences)"
              },
              positionalityNarrative: {
                type: "string", 
                description: "Synthesized narrative of the researcher's background and perspectives (1-2 sentences)"
              },
              alternativeThinkingPatterns: {
                type: "string",
                description: "Analysis of patterns in alternative interpretations and theoretical habits (1-2 sentences)"
              }
            },
            required: ["linguisticPatterns", "positionalityNarrative", "alternativeThinkingPatterns"],
            additionalProperties: false
          }
        }
      },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json({
      success: true,
      summary: analysis,
      metadata: {
        totalResponses: responses.length,
        justificationCount: justificationResponses.length,
        positionalityCount: positionalityResponses.length,
        alternativeCount: alternativeResponses.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating reflexive summary:', error);
    return res.status(500).json({ 
      error: 'Failed to generate summary',
      details: error.message 
    });
  }
}
