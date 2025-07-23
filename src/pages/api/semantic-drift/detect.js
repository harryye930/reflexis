import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Local test flag - set to true to always return drift detected (for testing)
const FORCE_DRIFT_FOR_TESTING = true;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { codeName, codeDefinition, existingExamples, newPassage } = req.body;

    // Validate required fields
    if (!codeName || !codeDefinition || !existingExamples || !newPassage) {
      return res.status(400).json({ 
        error: 'Missing required fields: codeName, codeDefinition, existingExamples, newPassage' 
      });
    }

    if (!Array.isArray(existingExamples) || existingExamples.length === 0) {
      return res.status(400).json({ 
        error: 'existingExamples must be a non-empty array' 
      });
    }

    // Local testing override - always return drift if flag is enabled
    if (FORCE_DRIFT_FOR_TESTING) {
      const testResult = {
        drift_detected: true,
        explanation: `[TEST MODE] Simulated semantic drift detected for code "${codeName}". The new passage appears to expand the concept beyond the current definition.`,
        suggested_definition: `${codeDefinition} This definition has been expanded to include the new usage pattern from the test passage.`
      };

      console.log('Semantic drift analysis (TEST MODE):', {
        codeName,
        drift_detected: testResult.drift_detected,
        examples_count: existingExamples.length
      });

      return res.status(200).json(testResult);
    }

    // Create system prompt for semantic drift detection
    const systemPrompt = `You are a helpful assistant for qualitative thematic analysis. Your task is to compare a new text passage against an existing code's definition and examples to spot 'semantic drift'.

Semantic drift occurs when a new passage represents a significant expansion or shift in the meaning of a code beyond its current definition and usage patterns. This can indicate that:
1. The code definition needs to be refined/expanded to be more inclusive
2. The new passage represents a genuinely different concept that should be coded separately
3. The code should be split into multiple more specific codes

Consider both the explicit definition and the implicit patterns in the existing examples. Minor variations are expected, but significant conceptual shifts indicate drift.`;

    // Format existing examples for the prompt
    const examplesText = existingExamples
      .map((example, index) => `${index + 1}. "${example.text}" (from ${example.documentTitle})`)
      .join('\n');

    const userPrompt = `Code name: ${codeName}

Current definition: "${codeDefinition}"

Existing passages coded with "${codeName}":
${examplesText}

New passage to be checked: "${newPassage}"

Does the new passage represent a significant expansion or shift in the meaning of the code? If yes, briefly explain the shift and suggest a revised, more inclusive definition.

Respond in JSON format: { "drift_detected": boolean, "explanation": string, "suggested_definition": string }

Where:
- drift_detected: true if significant semantic drift is detected
- explanation: brief explanation of the drift or why no drift was detected
- suggested_definition: if drift detected, provide a revised definition that encompasses both existing and new usage; if no drift, return null`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 500,
    });

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
    console.log('Semantic drift analysis:', {
      codeName,
      drift_detected: result.drift_detected,
      examples_count: existingExamples.length
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in semantic drift detection:', error);
    
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
      error: 'Internal server error during semantic drift analysis',
      message: error.message 
    });
  }
}
