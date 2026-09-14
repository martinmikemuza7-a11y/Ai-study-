import { PagesEnv, corsHeaders, jsonResponse } from './_common';

export async function onRequestGet(context: { request: Request; env: PagesEnv }) {
  return jsonResponse({
    status: 'ok',
    environment: 'cloudflare-pages-functions',
    hasGeminiKey: Boolean(context.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
