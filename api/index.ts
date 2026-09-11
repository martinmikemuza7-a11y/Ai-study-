/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();

// Enable JSON parsing
app.use(express.json({ limit: '10mb' }));

// CORS handler for Vercel preview and production environments
app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudy-vercel',
        },
      },
    });
  }
  return aiInstance;
}

const router = express.Router();

// 1. Health Check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: 'vercel-serverless',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 2. Socratic AI Tutor
router.post('/tutor', async (req: Request, res: Response) => {
  try {
    const { prompt, courseCode, courseName, courseTopics, ragContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Falling back to offline tutor engine.',
        useLocalFallback: true,
      });
    }

    const systemInstruction = `You are a world-class academic tutor and Socratic educator for "${courseCode || 'Course'}: ${courseName || 'Curriculum'}".
Topics: ${JSON.stringify(courseTopics || [])}.
Ground answers in the provided course lecture notes when available. Use the Socratic method with clear reasoning and an insightful follow-up reflection question.`;

    let contextText = '';
    if (ragContext && Array.isArray(ragContext) && ragContext.length > 0) {
      contextText = `\n\n--- RETRIEVED COURSE DOCUMENTS (RAG) ---\n` +
        ragContext.map((c: any, i: number) => `[Source ${i + 1}: ${c.title}]\n${c.content}`).join('\n\n') +
        `\n--- END COURSE DOCUMENTS ---\n\n`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${contextText}Student Query:\n${prompt}`,
      config: { systemInstruction, temperature: 0.7 },
    });

    res.json({
      content: response.text || 'No response generated. Please try again.',
      groundedInCourse: Boolean(ragContext && ragContext.length > 0),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Tutor error', useLocalFallback: true });
  }
});

// 3. Adaptive Quiz Generator
router.post('/quiz/generate', async (req: Request, res: Response) => {
  try {
    const { courseCode, courseName, topicName, difficulty, ragContext, count = 3 } = req.body;
    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured', useLocalFallback: true });
    }

    const prompt = `Generate ${count} multiple choice questions for ${courseCode || 'Course'} topic ${topicName || 'General'} at ${difficulty || 'intermediate'} difficulty.\nCourse Notes: ${JSON.stringify(ragContext || '')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
          },
        },
      },
    });

    res.json({ questions: JSON.parse(response.text || '[]') });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Quiz error', useLocalFallback: true });
  }
});

// 4. Multi-format Study Practice Questions Generator (MCQ, Short Answer, True/False, Explain)
router.post('/study/generate', async (req: Request, res: Response) => {
  try {
    const { courseCode, courseName, topicName, method, count = 3, ragContext } = req.body;
    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured', useLocalFallback: true });
    }

    const prompt = `Generate ${count} academic practice questions of type "${method || 'multiple_choice'}" for course "${courseCode || 'Academic'}: ${courseName || 'Study'}" covering topic "${topicName || 'General'}".
Course Context: ${JSON.stringify(ragContext || '')}

Format guidelines:
- If multiple_choice: include 4 options, correctAnswer (the string of the correct option), correctOptionIndex (0-3), and detailed explanation.
- If true_false: options must be ["True", "False"], correctAnswer ("True" or "False"), correctOptionIndex (0 or 1), and explanation.
- If short_answer or explain: question must be thought-provoking, correctAnswer must be the concise model answer, keyPoints array of 2-3 bullet strings, and explanation providing deep reasoning.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              correctOptionIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['question', 'correctAnswer', 'explanation'],
          },
        },
      },
    });

    res.json({ questions: JSON.parse(response.text || '[]') });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Study generator error', useLocalFallback: true });
  }
});

// Mount router on both /api (standard path) and root / (in case Vercel rewrites strip /api)
app.use('/api', router);
app.use('/', router);

export default app;
