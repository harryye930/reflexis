import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      codedText, 
      context, 
      codes, 
      codeDefinitions,
      researchers,
      documentTitle 
    } = req.body;

    if (!codedText || !context || !codes || !researchers || codes.length < 2 || researchers.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid request. Need codedText, context, at least 2 codes, and at least 2 researchers.' 
      });
    }

    // Create system prompt for structured discussion prompt generation
    const systemPrompt = `You are an expert in qualitative research methodology, specializing in collaborative coding and reflexive analysis. Your task is to generate discussion prompts that help researchers explore how their different perspectives led to different coding interpretations, framed as "Insight Opportunities."

Your prompts should:
1. Acknowledge the value of different perspectives
2. Encourage exploration of what the coding differences reveal about data complexity
3. Be specific to the actual codes and text provided
4. Promote collaborative learning rather than consensus-seeking
5. Be concise but thought-provoking (1-2 sentences)
6. Frame differences as opportunities for deeper understanding

Focus on how the researchers' unique backgrounds and perspectives influenced their interpretations, and what this reveals about the richness and complexity of the data.`;

    // Build the user prompt with the specific context
    const researcherDescriptions = researchers.map((r, i) => 
      `Researcher ${String.fromCharCode(65 + i)}: Background - "${r.positionality || 'Not specified'}", Applied code - "${r.code}"`
    ).join('\n');

    // Build code definitions section
    const codeDefinitionsText = codeDefinitions && codeDefinitions.length > 0 
      ? codeDefinitions.map(code => 
          `"${code.name}": ${code.description}`
        ).join('\n')
      : 'Code definitions not provided';

    const userPrompt = `Generate a discussion prompt for qualitative researchers who coded the same text differently:

FULL CONTEXT: "${context}"

CODED TEXT (selected portion): "${codedText}"
${documentTitle ? `DOCUMENT: ${documentTitle}` : ''}

RESEARCHERS AND CODES:
${researcherDescriptions}

CODE DEFINITIONS:
${codeDefinitionsText}

Please generate a concise Insight Opportunity prompt (1-2 sentences) that:
- Acknowledges both perspectives as valuable
- Encourages exploration of how their backgrounds influenced their interpretations
- References the specific meanings of the codes they applied
- Highlights what this difference reveals about the data's complexity
- Promotes collaborative reflection rather than consensus-seeking
- Keep it personal and relatable to coders. Address to them directly.

Frame it as an opportunity for deeper understanding, not a problem to solve.`;

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
