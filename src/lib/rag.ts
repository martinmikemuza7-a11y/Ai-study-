/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CourseDocument, DocumentChunk, RAGSearchResult } from '../types';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what',
  'which', 'this', 'that', 'these', 'those', 'then', 'so', 'than', 'such',
  'both', 'through', 'about', 'for', 'is', 'of', 'while', 'during', 'to',
  'from', 'in', 'out', 'on', 'off', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will',
  'just', 'should', 'now', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'with', 'at', 'by', 'into', 'under', 'over',
]);

/**
 * Tokenizes and normalizes text into clean lowercase stems/words
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Splits raw document text into overlapping semantic chunks
 */
export function chunkDocumentText(
  documentId: string,
  courseId: string,
  docTitle: string,
  rawText: string,
  targetChunkWords = 120,
  overlapWords = 25
): DocumentChunk[] {
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: DocumentChunk[] = [];
  let currentWords: string[] = [];
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const words = para.split(/\s+/);

    if (currentWords.length + words.length > targetChunkWords && currentWords.length > 0) {
      const chunkText = currentWords.join(' ');
      const tokens = tokenizeText(chunkText);
      const uniqueKeywords = Array.from(new Set(tokens)).slice(0, 10);

      chunks.push({
        id: `chunk_${documentId}_${chunkIndex}`,
        documentId,
        courseId,
        chunkIndex,
        title: `${docTitle} (Part ${chunkIndex + 1})`,
        content: chunkText,
        tokensCount: currentWords.length,
        keywords: uniqueKeywords,
      });

      chunkIndex++;
      // Keep overlap from end of current chunk
      currentWords = currentWords.slice(-overlapWords);
    }

    currentWords.push(...words);
  }

  if (currentWords.length > 0) {
    const chunkText = currentWords.join(' ');
    const tokens = tokenizeText(chunkText);
    const uniqueKeywords = Array.from(new Set(tokens)).slice(0, 10);

    chunks.push({
      id: `chunk_${documentId}_${chunkIndex}`,
      documentId,
      courseId,
      chunkIndex,
      title: `${docTitle} (Part ${chunkIndex + 1})`,
      content: chunkText,
      tokensCount: currentWords.length,
      keywords: uniqueKeywords,
    });
  }

  return chunks;
}

/**
 * BM25 Local Offline Retrieval Scoring
 * BM25 parameters: k1 = 1.5, b = 0.75
 */
export function searchLocalCourseRAG(
  query: string,
  courseDocuments: CourseDocument[],
  topK = 3
): RAGSearchResult[] {
  // Collect all chunks scoped to this course
  const allChunks: DocumentChunk[] = [];
  for (const doc of courseDocuments) {
    allChunks.push(...doc.chunks);
  }

  if (allChunks.length === 0) {
    return [];
  }

  const queryTokens = tokenizeText(query);
  if (queryTokens.length === 0) {
    return [];
  }

  const totalDocs = allChunks.length;
  const avgDocLength =
    allChunks.reduce((acc, c) => acc + c.tokensCount, 0) / (totalDocs || 1);

  // 1. Calculate Document Frequency (DF) for each query token
  const docFrequencies: Record<string, number> = {};
  for (const token of queryTokens) {
    let count = 0;
    for (const chunk of allChunks) {
      const chunkText = (chunk.title + ' ' + chunk.content).toLowerCase();
      if (chunkText.includes(token)) {
        count++;
      }
    }
    docFrequencies[token] = count;
  }

  // 2. Score each chunk using BM25 with exact phrase weighting
  const k1 = 1.5;
  const b = 0.75;
  const scoredChunks: RAGSearchResult[] = [];

  for (const chunk of allChunks) {
    const chunkText = (chunk.title + ' ' + chunk.content).toLowerCase();
    const chunkTokens = tokenizeText(chunkText);
    const tokenCounts: Record<string, number> = {};
    for (const t of chunkTokens) {
      tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    }

    let bm25Score = 0;
    const matchedKeywords: string[] = [];

    for (const token of queryTokens) {
      const tf = tokenCounts[token] || 0;
      if (tf > 0) {
        matchedKeywords.push(token);
        const df = docFrequencies[token] || 0;
        // Inverse Document Frequency
        const idf = Math.log((totalDocs - df + 0.5) / (df + 0.5) + 1);
        const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (chunk.tokensCount / avgDocLength)));
        bm25Score += idf * tfNorm;
      }
    }

    // Exact phrase bonus if user query appears verbatim in chunk
    if (chunkText.includes(query.toLowerCase().trim())) {
      bm25Score += 4.0;
    }

    // Title match bonus
    for (const token of queryTokens) {
      if (chunk.title.toLowerCase().includes(token)) {
        bm25Score += 1.5;
      }
    }

    if (bm25Score > 0) {
      // Normalize score into 0.0 - 1.0 confidence range
      const normalizedScore = Math.min(0.99, Math.max(0.2, (bm25Score / (bm25Score + 5))));
      scoredChunks.push({
        chunk,
        score: parseFloat(normalizedScore.toFixed(3)),
        matchedKeywords,
      });
    }
  }

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK);
}
