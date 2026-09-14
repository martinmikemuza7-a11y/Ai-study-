import { PagesEnv, handleCors, jsonResponse, errorResponse, callGemini } from './_common';

export async function onRequestPost(context: { request: Request; env: PagesEnv }) {
  const cors = handleCors(context.request);
  if (cors) return cors;

  try {
    const body = (await context.request.json()) as any;
    const { prompt, courseCode, courseName, courseTopics, ragContext } = body || {};

    if (!prompt) {
      return errorResponse('Prompt is required', 400);
    }

    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonResponse(
        {
          error: 'GEMINI_API_KEY is not set in Cloudflare Pages environment variables.',
          useLocalFallback: true,
        },
        503
      );
    }

    const systemInstruction = `You are a world-class university academic tutor and Socratic educator for the course "${courseCode || 'Course'}: ${courseName || 'Curriculum'}".
Topics in this course: ${JSON.stringify(courseTopics || [])}.

GUIDELINES:
1. SCOPED ACCURACY: Ground your answer strictly in the provided course lecture notes and textbook excerpts whenever relevant.
2. CITATIONS: If quoting or referencing a course concept, clearly state "[Course Reference: Chunk Title]" so students can locate it in their syllabus.
3. SOCRATIC METHOD: Do not merely dump raw answers. Encourage critical thinking by breaking problems down into first principles, contrasting tradeoffs, and ending with an insightful follow-up question.
4. TONE: Rigorous, clear, empathetic, and academically precise.`;

    let contextText = '';
    if (ragContext && Array.isArray(ragContext) && ragContext.length > 0) {
      contextText =
        `\n\n--- RETRIEVED COURSE DOCUMENTS (RAG GROUNDING) ---\n` +
        ragContext.map((c: any, i: number) => `[Source ${i + 1}: ${c.title}]\n${c.content}`).join('\n\n') +
        `\n--- END COURSE DOCUMENTS ---\n\n`;
    }

    const userMessage = `${contextText}Student Question / Request:\n"${prompt}"`;

    const result = await callGemini(apiKey, {
      contents: userMessage,
      systemInstruction,
      temperature: 0.7,
    });

    const tutorText = result.text || 'I could not generate a response. Please try again.';

    return jsonResponse({
      content: tutorText,
      groundedInCourse: Boolean(ragContext && ragContext.length > 0),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return jsonResponse(
      {
        error: err?.message || 'Failed to generate tutor response',
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
