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
    const notes = responses.filter(r => r.promptType === 'note').map(r => r.response);
    

    // Create system prompt for structured analysis
    const systemPrompt = `You are a reflexive research coach. Your purpose is to act as a mirror, helping researchers see the patterns in their own thinking based on their reflexive notes.

Your task is not to judge their analysis, but to synthesize their entries into concise observations and thought-provoking questions. The goal is to deepen their self-awareness as an instrument of their research as a team.

Analyze the notes across these dimensions:
1.  **Linguistic Patterns:** How they use language to justify interpretations.
2.  **Positionality Narrative:** The story they tell about their own background and biases.
3.  **Alternative Thinking:** The ways they do (or don't) challenge their own conclusions.

The tone should be supportive, curious, and collaborative. Address the team instead of individuals and frame your outputs as "Reflective Starting Points."`;

    const userPrompt = `Please analyze the following reflexive responses from a reflexive qualitative research team:

JUSTIFICATION RESPONSES (What specific language led to coding decisions):
${justificationResponses.map((r, i) => `${i + 1}. ${r}`).join('\n')}

POSITIONALITY RESPONSES (Personal/professional experiences influencing interpretation):
${positionalityResponses.map((r, i) => `${i + 1}. ${r}`).join('\n')}

ALTERNATIVE FRAMING RESPONSES (Different possible interpretations):
${alternativeResponses.map((r, i) => `${i + 1}. ${r}`).join('\n')}

OTHER NOTES:
${notes.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Please generate a set of "Reflective Starting Points." For each category, provide a concise one-sentence finding and a follow-up reflective question to prompt deeper thought. Address the researchers directly as 'you' or 'your team'.`;

// Corresponding change to your response_format object
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      reasoning_effort: "medium",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "reflexive_summary",
          schema: {
            type: "object",
            properties: {
              linguisticPatterns: {
                type: "string", 
                description: "A one-sentence observation about language patterns for this particular code."
              },
              positionalityNarrative: {
                type: "string", 
                description: "A one-sentence synthesis of the team's positionality on this particular code."
              },
              alternativeThinkingPatterns: {
                type: "string", 
                description: "A one-sentence observation on how alternatives are generated."
              },
              notes: {
                type: "string",
                description: "A one-sentence summary of additional notes and context provided by researchers."
              }
            },
            required: ["linguisticPatterns", "positionalityNarrative", "alternativeThinkingPatterns", "notes"],
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
        noteCount: notes.length,
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
