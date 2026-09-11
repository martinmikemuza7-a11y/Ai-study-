/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CourseDocument, GeneratedQAItem } from '../types';

/**
 * Robust on-device offline question and verified answer generator.
 * Works 100% locally in the browser with zero network or external API dependency.
 * Extracts questions, options, verified answers, explanations, and direct cited quotes
 * from the actual uploaded documents.
 */
export function generateLocalQuestionsFromDocuments(
  documents: CourseDocument[],
  folderName: string,
  targetCount: number = 4,
  questionTypeFilter: 'all' | 'multiple_choice' | 'short_answer' | 'true_false' | 'explain' = 'all'
): GeneratedQAItem[] {
  if (!documents || documents.length === 0) {
    return [];
  }

  // Combine and clean sentences across uploaded documents
  const extractedFacts: {
    sentence: string;
    docTitle: string;
    keywords: string[];
  }[] = [];

  for (const doc of documents) {
    const rawText = doc.content || '';
    // Split text into meaningful sentences
    const sentences = rawText
      .split(/(?<=[.?!])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 25 && s.length <= 300 && !s.startsWith('#'));

    for (const s of sentences) {
      // Find candidate words (length >= 5, capitalized or specific terms)
      const words = s
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()));

      if (words.length >= 2) {
        extractedFacts.push({
          sentence: s,
          docTitle: doc.title,
          keywords: words,
        });
      }
    }
  }

  if (extractedFacts.length === 0) {
    // If sentences were short or formatted differently, fallback to chunking
    for (const doc of documents) {
      const paragraphs = doc.content
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length >= 30);
      for (const p of paragraphs) {
        extractedFacts.push({
          sentence: p.substring(0, 240),
          docTitle: doc.title,
          keywords: ['concept', 'principles', 'analysis', 'system'],
        });
      }
    }
  }

  const results: GeneratedQAItem[] = [];
  const allowedTypes: ('multiple_choice' | 'short_answer' | 'true_false' | 'explain')[] =
    questionTypeFilter === 'all'
      ? ['multiple_choice', 'short_answer', 'true_false', 'explain']
      : [questionTypeFilter];

  const pool = [...extractedFacts].sort(() => 0.5 - Math.random());
  let index = 0;

  while (results.length < targetCount && index < pool.length * 2) {
    const fact = pool[index % pool.length];
    const chosenType = allowedTypes[results.length % allowedTypes.length];
    const item = createQuestionFromFact(fact, chosenType, results.length + 1, documents);
    if (item) {
      results.push(item);
    }
    index++;
  }

  return results.slice(0, targetCount);
}

function createQuestionFromFact(
  fact: { sentence: string; docTitle: string; keywords: string[] },
  type: 'multiple_choice' | 'short_answer' | 'true_false' | 'explain',
  seq: number,
  allDocs: CourseDocument[]
): GeneratedQAItem | null {
  const sentence = fact.sentence;
  const docTitle = fact.docTitle;
  const id = `qa_local_${Date.now()}_${seq}_${Math.random().toString(36).substring(2, 6)}`;

  // Find most prominent subject or keyword
  const keyTerm = fact.keywords[0] || 'key principle';
  const secondaryTerm = fact.keywords[1] || 'mechanism';

  if (type === 'multiple_choice') {
    // Create fill-in-the-blank or "What is described by..."
    const blankedSentence = sentence.replace(new RegExp(`\\b${escapeRegExp(keyTerm)}\\b`, 'i'), '__________');
    const questionText = blankedSentence !== sentence
      ? `Fill in the blank according to "${docTitle}": "${blankedSentence}"`
      : `Based on "${docTitle}", which of the following statements accurately reflects the source material?`;

    const correctAnswer = sentence;
    
    // Distractors from other sentences or generated variations
    const distractors = [
      sentence.replace(/\b(increase|decrease|always|never|conserved|proportional|higher|lower)\b/gi, (match) => {
        const m = match.toLowerCase();
        if (m === 'increase') return 'decrease';
        if (m === 'decrease') return 'increase';
        if (m === 'always') return 'rarely';
        if (m === 'never') return 'consistently';
        if (m === 'conserved') return 'dissipated prematurely';
        if (m === 'higher') return 'lower';
        return 'inversely proportional';
      }),
      `The opposite outcome occurs when ${secondaryTerm} interacts with outside factors.`,
      `This condition only applies under non-standard baseline assumptions with no stability.`,
    ];

    // Ensure distractors are distinct from correctAnswer
    const options = [correctAnswer, ...distractors.filter((d) => d !== correctAnswer).slice(0, 3)];
    // Shuffle options
    const shuffledOptions = options.map((opt, i) => ({ opt, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.opt);
    const correctIndex = shuffledOptions.indexOf(correctAnswer);

    return {
      id,
      type: 'multiple_choice',
      question: questionText,
      options: shuffledOptions,
      correctOptionIndex: correctIndex >= 0 ? correctIndex : 0,
      correctAnswer,
      explanation: `According to "${docTitle}": "${sentence}". This confirms the correct choice.`,
      documentExcerpt: sentence,
      sourceTitle: docTitle,
      sourceType: 'document',
    };
  }

  if (type === 'short_answer') {
    return {
      id,
      type: 'short_answer',
      question: `In your own words, what key finding regarding "${keyTerm}" is stated in "${docTitle}"?`,
      correctAnswer: sentence,
      explanation: `Verified answer directly from "${docTitle}": "${sentence}"`,
      documentExcerpt: sentence,
      sourceTitle: docTitle,
      sourceType: 'document',
    };
  }

  if (type === 'true_false') {
    const isTrue = Math.random() > 0.4; // 60% chance of true
    let statement = sentence;
    if (!isTrue) {
      statement = sentence.replace(
        /\b(is|are|increases|decreases|will|can|always|conserved)\b/i,
        (match) => {
          const m = match.toLowerCase();
          if (m === 'is') return 'is not';
          if (m === 'are') return 'are not';
          if (m === 'increases') return 'does not increase';
          if (m === 'decreases') return 'does not decrease';
          if (m === 'will') return 'cannot';
          if (m === 'always') return 'never';
          return 'is not conserved';
        }
      );
    }

    return {
      id,
      type: 'true_false',
      question: `True or False: According to "${docTitle}", ${statement}`,
      options: ['True', 'False'],
      correctOptionIndex: isTrue ? 0 : 1,
      correctAnswer: isTrue ? 'True' : 'False',
      explanation: isTrue
        ? `True. The document explicitly states: "${sentence}".`
        : `False. The document states: "${sentence}".`,
      documentExcerpt: sentence,
      sourceTitle: docTitle,
      sourceType: 'document',
    };
  }

  // explain
  return {
    id,
    type: 'explain',
    question: `Explain the core concept or mechanism connecting "${keyTerm}" described in "${docTitle}".`,
    correctAnswer: `Key principle from the text: ${sentence}.`,
    explanation: `The uploaded document explains: "${sentence}". When reviewing this topic, make sure to link ${keyTerm} with ${secondaryTerm}.`,
    documentExcerpt: sentence,
    sourceTitle: docTitle,
    sourceType: 'document',
  };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'were', 'been',
  'which', 'their', 'there', 'about', 'would', 'could', 'these', 'other', 'into',
  'after', 'first', 'also', 'where', 'while', 'under', 'through', 'during',
]);
