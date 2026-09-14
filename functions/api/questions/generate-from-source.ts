import { PagesEnv, handleCors, jsonResponse, callGemini } from '../_common';

export async function onRequestPost(context: { request: Request; env: PagesEnv }) {
  const cors = handleCors(context.request);
  if (cors) return cors;

  try {
    const body = (await context.request.json()) as any;
    const {
      folderName = 'My Folder',
      mode = 'document',
      documents = [],
      questionType = 'all',
      count = 4,
      customFocus = '',
    } = body || {};

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

    if (mode === 'brainstorm_web') {
      const prompt = `You are an expert researcher and academic question creator.
Topic / Folder Theme: "${folderName}"
${customFocus ? `Specific Focus / Instructions: "${customFocus}"` : ''}

Task:
1. Brainstorm ${count} insightful, creative, and educational questions with comprehensive answers.
2. Question style: ${questionType === 'all' ? 'diverse mix of multiple choice, short answer, true/false, and conceptual explanation' : questionType}.
3. Search or incorporate up-to-date real-world facts, scientific discoveries, case studies, or authoritative statistics to back up each question and answer.

Format Requirement:
Output ONLY a JSON array.
Each item must have:
- "id": a unique string (e.g. "q_web_1")
- "question": clear question prompt
- "type": "multiple_choice" | "short_answer" | "true_false" | "explain"
- "options": array of 4 string choices (only if multiple_choice or true_false)
- "correctOptionIndex": integer 0-3 (only if options exist)
- "correctAnswer": precise model answer
- "explanation": deep conceptual breakdown citing real-world facts
- "sourceType": "web"
- "searchKeywords": string summary of concepts`;

      const result = await callGemini(apiKey, {
        contents: prompt,
        temperature: 0.7,
      });

      let questions = [];
      const cleanJson = (result.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        questions = JSON.parse(cleanJson);
      } catch {
        const match = cleanJson.match(/\[\s*\{.*\}\s*\]/s);
        if (match) {
          questions = JSON.parse(match[0]);
        }
      }

      return jsonResponse({
        questions,
        webSources: [],
        count: questions.length,
      });
    }

    // Default: Ground in uploaded course documents
    const docContext = documents
      .map((d: any, idx: number) => `--- DOCUMENT ${idx + 1}: ${d.title} ---\n${d.content}\n--- END DOCUMENT ${idx + 1} ---`)
      .join('\n\n');

    const prompt = `You are an elite academic professor creating study questions based strictly on the uploaded course materials.
Folder / Unit: "${folderName}"
${customFocus ? `Special Focus: "${customFocus}"` : ''}

COURSE DOCUMENTS:
${docContext.slice(0, 30000)}

TASK:
Generate ${count} high-yield study questions of type "${questionType === 'all' ? 'multiple_choice, short_answer, true_false, and explain' : questionType}".
Ground each question directly in facts and formulas from the provided documents.

Output ONLY a JSON array. Each item must have:
- "id": string (e.g. "q_doc_1")
- "question": string
- "type": "multiple_choice" | "short_answer" | "true_false" | "explain"
- "options": array of 4 string choices (only if multiple_choice or true_false)
- "correctOptionIndex": integer 0-3 (only if options exist)
- "correctAnswer": string
- "explanation": detailed explanation citing specific facts from the documents
- "sourceType": "document"
- "citedDocument": title of the source document`;

    const result = await callGemini(apiKey, {
      contents: prompt,
      temperature: 0.3,
    });

    let questions = [];
    const cleanJson = (result.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      questions = JSON.parse(cleanJson);
    } catch {
      const match = cleanJson.match(/\[\s*\{.*\}\s*\]/s);
      if (match) {
        questions = JSON.parse(match[0]);
      }
    }

    return jsonResponse({
      questions,
      count: questions.length,
    });
  } catch (err: any) {
    return jsonResponse(
      {
        error: err?.message || 'Failed to generate questions from source',
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
