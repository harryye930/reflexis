import OpenAI from 'openai';
import { requireFirebaseAuth } from '../../../lib/api/requireFirebaseAuth.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await requireFirebaseAuth(req, res))) return;

  try {
    const {
      codedText,
      context,
      codes,
      codeDefinitions,
      researchers,
      documentTitle
    } = req.body || {};

    if (!codedText || !context || !codes || !researchers || codes.length < 2 || researchers.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid request. Need codedText, context, at least 2 codes, and at least 2 researchers.' 
      });
    }

    // Create system prompt for structured discussion prompt generation
const systemPrompt = `You are an expert facilitator for reflexive qualitative research teams. Your task is to generate brief, engaging "Conversation Starters" when researchers code the same text differently, possibly due to different interpretations and backgrounds.

Your output must:
1.  **Be extremely concise.** The goal is to spark a live conversation, not to be read at length.
2.  **Ask a direct question.** Do not provide a pre-packaged analysis. Your job is to help the researchers discover the insight themselves.
3.  **Frame the difference in interpretation and background as a valuable tension**, not a problem to be solved.
4.  **Use plain, conversational language.** Avoid academic jargon.
5.  **Directly address the researchers** by their first names to make it personal.
6.  Generate a **short, memorable title** that captures the essence of the coding difference.`;

    // Build the user prompt with the specific context
    const researcherDescriptions = researchers.map((r, i) => 
      `Researcher ${String.fromCharCode(65 + i)} - ${r.name}: Background - "${r.positionality || 'Not specified'}", Applied code - "${r.code}"`
    ).join('\n');

    // Build code definitions section
    const codeDefinitionsText = codeDefinitions && codeDefinitions.length > 0 
      ? codeDefinitions.map(code => 
          `"${code.name}": ${code.description}`
        ).join('\n')
      : 'Code definitions not provided';

    const userPrompt = `Generate a "Conversation Starter" for qualitative researchers who coded the same text differently.

FULL CONTEXT: "${context}"

CODED TEXT (selected portion): "${codedText}"
${documentTitle ? `DOCUMENT: ${documentTitle}` : ''}

RESEARCHERS AND CODES:
${researcherDescriptions}

CODE DEFINITIONS:
${codeDefinitionsText}

Based on the information above, generate a title and a prompt. The prompt should be a single, direct question.
- The **Title** should be a short phrase capturing the tension (e.g., "Process vs. Price").
- The **Prompt** should be a single, curious question that encourages the researchers to reflect on their perspectives. Address them by their first names.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      reasoning_effort: "low",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "discussion_prompt",
          schema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "The generated discussion prompt"
              },
              title: {
                type: "string", 
                description: "A brief title for the insight opportunity"
              }
            },
            required: ["prompt", "title"],
            additionalProperties: false
          }
        }
      },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    res.status(200).json({
      success: true,
      prompt: result.prompt,
      title: result.title
    });

  } catch (error) {
    console.error('Error generating discussion prompt:', error);
    res.status(500).json({ 
      error: 'Failed to generate discussion prompt',
      details: error.message 
    });
  }
}
