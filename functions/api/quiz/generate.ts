import { PagesEnv, handleCors, jsonResponse, callGemini } from '../_common';

export async function onRequestPost(context: { request: Request; env: PagesEnv }) {
  const cors = handleCors(context.request);
  if (cors) return cors;

  try {
    const body = (await context.request.json()) as any;
    const { courseCode, courseName, topicName, difficulty, ragContext, count = 3 } = body || {};

    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonResponse(
        {
          error: 'GEMINI_API_KEY is not configured in Cloudflare Pages environment variables.',
          useLocalFallback: true,
        },
        503
      );
    }

    const prompt = `Generate ${count} university-level multiple-choice quiz questions for "${courseCode}: ${courseName}", targeting topic "${topicName || 'Core Curriculum'}" at "${difficulty || 'intermediate'}" difficulty.
Grounded Course Notes:
${ragContext ? JSON.stringify(ragContext) : 'Standard course curriculum.'}

Each question MUST:
- Have exactly 4 options.
- Have 1 unambiguous correct answer index (0, 1, 2, or 3).
- Include a detailed technical explanation citing why the answer is correct and why other distractors fail.`;

    const schema = {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          question: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          correctAnswerIndex: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
          citedConcept: { type: 'STRING' },
        },
        required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
      },
    };

    const result = await callGemini(apiKey, {
      contents: prompt,
      responseMimeType: 'application/json',
      responseSchema: schema,
    });

    const parsed = JSON.parse(result.text || '[]');
    return jsonResponse({ questions: parsed });
  } catch (err: any) {
    return jsonResponse(
      {
        error: err?.message || 'Failed to generate quiz questions',
        useLocalFallback: true,
      },
      500
    );
  }
}

export async function onRequestOptions(context: { request: Request }) {
  const cors = handleCors(context.request);
  return cors || new Response(null, { status: 204 });
}
