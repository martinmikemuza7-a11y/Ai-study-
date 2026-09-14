/**
 * Shared Cloudflare Pages Functions Utilities
 */

export interface PagesEnv {
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function handleCors(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

export function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

export function errorResponse(message: string, status = 500, extra: Record<string, any> = {}): Response {
  return jsonResponse({ error: message, ...extra }, status);
}

/**
 * Call Gemini 3.8 Flash via REST API (compatible with Cloudflare Workers Edge Runtime)
 */
export async function callGemini(
  apiKey: string,
  payload: {
    contents: any;
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: any;
    tools?: any[];
  }
): Promise<{ text: string; raw: any }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: any = {
    contents: Array.isArray(payload.contents) ? payload.contents : [
      {
        parts: [{ text: String(payload.contents) }],
      },
    ],
    generationConfig: {
      temperature: payload.temperature ?? 0.7,
    },
  };

  if (payload.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: payload.systemInstruction }],
    };
  }

  if (payload.responseMimeType) {
    body.generationConfig.responseMimeType = payload.responseMimeType;
  }

  if (payload.responseSchema) {
    body.generationConfig.responseSchema = payload.responseSchema;
  }

  if (payload.tools) {
    body.tools = payload.tools;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'aistudy-cloudflare-pages',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API returned ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as any;
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text || '';

  return { text, raw: data };
}
