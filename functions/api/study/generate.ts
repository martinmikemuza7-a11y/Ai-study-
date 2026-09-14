import { PagesEnv, handleCors, jsonResponse, callGemini } from '../_common';

export async function onRequestPost(context: { request: Request; env: PagesEnv }) {
  const cors = handleCors(context.request);
  if (cors) return cors;

  try {
    const body = (await context.request.json()) as any;
    const { courseCode, courseName, topicName, method, count = 3, ragContext } = body || {};

    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonResponse(
        { error: 'GEMINI_API_KEY is not configured in Cloudflare Pages environment variables.', useLocalFallback: true },
        503
      );
    }

    const prompt = `Generate ${count} academic practice questions of type "${method || 'multiple_choice'}" for course "${courseCode || 'Academic'}: ${courseName || 'Study'}" covering topic "${topicName || 'General'}".
Course Context: ${JSON.stringify(ragContext || '')}

Format guidelines:
- If multiple_choice: include 4 options, correctAnswer (the string of the correct option), correctOptionIndex (0-3), and detailed explanation.
- If true_false: options must be ["True", "False"], correctAnswer ("True" or "False"), correctOptionIndex (0 or 1), and explanation.
- If short_answer or explain: question must be thought-provoking, correctAnswer must be the concise model answer, keyPoints array of 2-3 bullet strings, and explanation providing deep reasoning.`;

    const schema = {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          question: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          correctAnswer: { type: 'STRING' },
          correctOptionIndex: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
          keyPoints: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['question', 'correctAnswer', 'explanation'],
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
      { error: err?.message || 'Study generator error', useLocalFallback: true },
      500
    );
  }
}

export async function onRequestOptions(context: { request: Request }) {
  const cors = handleCors(context.request);
  return cors || new Response(null, { status: 204 });
}
