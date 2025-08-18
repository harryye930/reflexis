import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Local test flag - set to true to always return drift detected (for testing)
const FORCE_DRIFT_FOR_TESTING = false;
const DISABLED = false;

/**
 * API endpoint for detecting conceptual drift in qualitative coding
 * 
 * Accepts:
 * - codeName: Name of the code
 * - codeDefinition: Current definition of the code
 * - existingExamples: Array of existing passages coded with this code
 * - newPassage: New text passage to be analyzed for drift
 * - context: Surrounding context of the new passage for better analysis (required)
 * 
 * Returns JSON with drift_detected (boolean), explanation (string), and suggested_definition (string)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
  const { codeName, codeDefinition, existingExamples, newPassage, context } = req.body;

    // Validate required fields
  if (!codeName || !codeDefinition || !existingExamples || !newPassage || !context) {
      return res.status(400).json({ 
    error: 'Missing required fields: codeName, codeDefinition, existingExamples, newPassage, context' 
      });
    }

    if (!Array.isArray(existingExamples) || existingExamples.length === 0) {
      return res.status(400).json({ 
        error: 'existingExamples must be a non-empty array' 
      });
    }
    if (DISABLED) {
      const testResult = {
        drift_detected: false,
        explanation: `[TEST MODE] Conceptual drift detection is disabled.`,
        suggested_definition: null
      };

      console.log('Conceptual drift analysis (TEST MODE):', {
        codeName,
        drift_detected: testResult.drift_detected,
        examples_count: existingExamples.length
      });

      return res.status(200).json(testResult);
    }

    // Local testing override - always return drift if flag is enabled
    if (FORCE_DRIFT_FOR_TESTING) {
      const testResult = {
        drift_detected: true,
        explanation: `[TEST MODE] Simulated conceptual drift detected for code "${codeName}". The new passage appears to expand the concept beyond the current definition.`,
        suggested_definition: `${codeDefinition} This definition has been expanded to include the new usage pattern from the test passage.`
      };

      console.log('Conceptual drift analysis (TEST MODE):', {
        codeName,
        drift_detected: testResult.drift_detected,
        examples_count: existingExamples.length
      });

      return res.status(200).json(testResult);
    }

    // Create system prompt for conceptual drift detection
    const systemPrompt = `You are a helpful assistant for qualitative thematic analysis. Your task is to compare a new text passage against an existing code's definition and examples to spot 'conceptual drift'.

Conceptual drift occurs when a new passage represents a significant expansion or shift in the meaning of a code beyond its current definition and usage patterns. This can indicate that:
1. The code definition needs to be refined/expanded to be more inclusive
2. The new passage represents a genuinely different concept that should be coded separately
3. The code should be split into multiple more specific codes

Consider both the explicit definition and the implicit interpreted patterns in the existing examples. When provided, use the surrounding context to better understand the conceptual boundaries and situational usage of the coded text. Minor variations are expected and should be tolerated, but significant conceptual shifts indicate drift.`;

    // Format existing examples for the prompt
    const examplesText = existingExamples
      .map((example, index) => `${index + 1}. "${example.text}" (from ${example.documentTitle})`)
      .join('\n');

  const userPrompt = `Code name: ${codeName}

Current definition: "${codeDefinition}"

Existing passages coded with "${codeName}":
${examplesText}


NEW PASSAGE (selected portion): "${newPassage}", which is situated within the bigger context "${context}".

Does the new passage represent a significant expansion or shift in the meaning of the code? When evaluating, consider both the specific coded text and its surrounding context to better understand the conceptual boundaries.

If yes, briefly explain the shift and suggest a revised, more inclusive definition.

Respond in JSON format: { "drift_detected": boolean, "explanation": string, "suggested_definition": string }

Where:
- drift_detected: true if significant conceptual drift is detected
- explanation: brief explanation of the drift or why no drift was detected, it should be in bullet point form (with 2-4 points in total, depends on the complexity), short (1-2 sentence per bullet point) and straightforward to read as a researcher just tagged the sentence.
- suggested_definition: if drift detected, provide a revised definition that encompasses both existing and new usage; if no drift, return null`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      reasoning_effort: "low",
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'conceptual_drift',
          schema: {
            type: 'object',
            properties: {
              drift_detected: {
                type: 'boolean',
                description: 'Indicates if conceptual drift was detected'
              },
              explanation: {
                type: 'string',
                description: 'Brief explanation of the drift or why no drift was detected, in bullet point form, start with "•", and separated by new lines'
              },
              suggested_definition: {
                type: 'string',
                description: 'Revised definition if drift detected, otherwise null'
              }
            },
            required: ['drift_detected', 'explanation'],
            additionalProperties: false
          }
        }
    }});

    const responseText = response.choices[0].message.content.trim();
    
    // Parse JSON response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', responseText);
      return res.status(500).json({ 
        error: 'Invalid response format from language model',
        debug_response: responseText 
      });
    }

    // Validate response structure
    if (typeof result.drift_detected !== 'boolean' || 
        typeof result.explanation !== 'string') {
      return res.status(500).json({ 
        error: 'Invalid response structure from language model',
        debug_response: result 
      });
    }

    // Log for debugging (remove in production)
    console.log('Conceptual drift analysis:', {
      codeName,
      drift_detected: result.drift_detected,
      examples_count: existingExamples.length
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in conceptual drift detection:', error);

    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ 
        error: 'OpenAI API quota exceeded. Please try again later.' 
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error during conceptual drift analysis',
      message: error.message 
    });
  }
}
