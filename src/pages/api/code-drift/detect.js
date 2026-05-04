import OpenAI from 'openai';
import { requireFirebaseAuth } from '../../../lib/api/requireFirebaseAuth.js';

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

  if (!(await requireFirebaseAuth(req, res))) return;

  try {
    const { codeName, codeDefinition, existingExamples, newPassage, context, llmEnabled = true } = req.body || {};

    if (llmEnabled === false) {
      return res.status(403).json({ error: 'LLM features are disabled in settings' });
    }

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
const systemPrompt = `You are a sharp-eyed assistant for reflexive qualitative researchers. Your task is to spot 'conceptual drift' and flag it with a brief, scannable alert.

Conceptual drift is when a new passage stretches or shifts a code's meaning beyond its current definition and appliedexamples.

Your response must be extremely concise. The goal is to provide a quick "heads-up" to the researcher, not a detailed analysis. Use plain language and get straight to the point. When drift is detected, your explanation should clearly and simply contrast the original concept with the new one.`;

    // Format existing examples for the prompt
    const examplesText = existingExamples
      .map((example, index) => `${index + 1}. "${example.text}" (from ${example.documentTitle})`)
      .join('\n');

    const userPrompt = `Code name: ${codeName}

Current definition: "${codeDefinition}"

Existing passages coded with "${codeName}":
${examplesText}

NEW PASSAGE (selected portion): "${newPassage}", which is situated within the bigger context "${context}".

Does this new passage represent conceptual drift?

Respond in JSON format.
- "drift_detected": boolean
- "explanation": A single, concise sentence contrasting the original focus with the new usage. If no drift, state that the usage is consistent.
- "suggested_definition": A revised definition if drift is detected, otherwise null.`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-5.5',
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
