/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AdaptiveDifficulty,
  Course,
  CourseDocument,
  CourseTopic,
  QuizAttemptRecord,
  QuizQuestion,
} from '../types';
import { SEED_QUIZ_QUESTIONS } from './db';

const DIFFICULTY_ORDER: AdaptiveDifficulty[] = ['beginner', 'intermediate', 'advanced', 'mastery'];

/**
 * Returns the next difficulty step
 */
export function getNextDifficulty(
  current: AdaptiveDifficulty,
  isCorrect: boolean
): AdaptiveDifficulty {
  const currentIndex = DIFFICULTY_ORDER.indexOf(current);
  if (isCorrect) {
    return DIFFICULTY_ORDER[Math.min(DIFFICULTY_ORDER.length - 1, currentIndex + 1)];
  } else {
    return DIFFICULTY_ORDER[Math.max(0, currentIndex - 1)];
  }
}

/**
 * Bayesian Mastery Probability Update
 * Updates topic mastery percentage based on question difficulty and correctness
 */
export function calculateUpdatedMastery(
  currentMastery: number, // 0 - 100
  difficulty: AdaptiveDifficulty,
  isCorrect: boolean
): number {
  const weightMultiplier = {
    beginner: 3,
    intermediate: 5,
    advanced: 7,
    mastery: 10,
  }[difficulty];

  let delta = 0;
  if (isCorrect) {
    // Diminishing returns as mastery approaches 100%
    const roomToGrow = 100 - currentMastery;
    delta = Math.max(1, Math.round((roomToGrow * weightMultiplier) / 100));
  } else {
    // Penalty scales with existing mastery
    delta = -Math.max(2, Math.round((currentMastery * weightMultiplier) / 120));
  }

  return Math.min(100, Math.max(0, currentMastery + delta));
}

/**
 * Finds questions for a specific course, prioritizing weak topics (< 70% mastery)
 * and grounding directly in documents stored in the course folder when available.
 */
export function getAdaptiveQuestionsForCourse(
  course: Course,
  targetDifficulty: AdaptiveDifficulty = 'intermediate',
  count = 4,
  documents: CourseDocument[] = []
): QuizQuestion[] {
  // Identify weak topics
  const weakTopics = (course.topics || [])
    .slice()
    .sort((a, b) => a.masteryPercentage - b.masteryPercentage);

  const availableQuestions = SEED_QUIZ_QUESTIONS.filter(
    (q) => q.courseId === course.id
  );

  // Filter documents that belong to this course
  const courseDocs = documents.filter((d) => d.courseId === course.id);

  if (availableQuestions.length === 0) {
    // Generate dynamic questions from course folder documents and topics
    return generateDynamicTopicQuestions(course, targetDifficulty, count, courseDocs);
  }

  // Sort questions to prioritize matching target difficulty and weak topics
  const scored = availableQuestions.map((q) => {
    let score = 0;
    if (q.difficulty === targetDifficulty) score += 10;
    const topicRank = weakTopics.findIndex((t) => t.id === q.topicId);
    if (topicRank !== -1) score += (weakTopics.length - topicRank) * 3;
    return { question: q, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.map((s) => s.question);

  if (selected.length < count) {
    const additional = generateDynamicTopicQuestions(
      course,
      targetDifficulty,
      count - selected.length,
      courseDocs
    );
    selected.push(...additional);
  }

  return selected.slice(0, count);
}

/**
 * Procedurally generates high-quality adaptive questions directly from
 * course folder documents and custom course topics.
 */
export function generateDynamicTopicQuestions(
  course: Course,
  difficulty: AdaptiveDifficulty,
  count: number,
  courseDocuments: CourseDocument[] = []
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const topics = course.topics && course.topics.length > 0
    ? course.topics
    : [
        {
          id: `topic_default_${course.id}`,
          name: course.name,
          description: `Core materials for ${course.name}`,
          masteryPercentage: 50,
          questionsAnswered: 0,
          lastStudiedAt: new Date().toISOString(),
        },
      ];

  // Collect all chunks available across documents in this course folder
  const allChunks = courseDocuments.flatMap((doc) =>
    (doc.chunks || []).map((chunk) => ({
      ...chunk,
      docTitle: doc.title,
    }))
  );

  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    const qId = `dyn_q_${course.id}_${topic.id}_${Date.now()}_${i}`;

    // If we have files stored in this course folder, ground questions in them
    if (allChunks.length > 0) {
      const chunk = allChunks[i % allChunks.length];
      const snippet = chunk.content.slice(0, 180).trim();

      let questionText = '';
      let options: string[] = [];
      let explanation = '';

      if (difficulty === 'beginner') {
        questionText = `According to "${chunk.docTitle}", what is the primary focus of: "${chunk.title}"?`;
        options = [
          `Understanding the fundamental concepts and definitions outlined in ${topic.name}`,
          'Memorizing unrelated peripheral case studies without context',
          'Discarding historical context in favor of speculative assertions',
          'Replacing standardized evaluation criteria with ad-hoc heuristics',
        ];
        explanation = `The passage in "${chunk.docTitle}" establishes core foundational principles for ${topic.name}: "${snippet}..."`;
      } else if (difficulty === 'intermediate') {
        questionText = `In the context of ${course.name} ("${chunk.docTitle}"), which operational mechanism is highlighted in "${chunk.title}"?`;
        options = [
          `Systematic application of the principles described: "${snippet.slice(0, 70)}..."`,
          'Bypassing established analytical constraints when evaluating models',
          'Assuming static conditions when dynamic variability is present',
          'Ignoring foundational assumptions in practical implementations',
        ];
        explanation = `Detailed in "${chunk.docTitle}", the mechanism relies on adherence to the principles described: "${snippet}..."`;
      } else if (difficulty === 'advanced') {
        questionText = `When analyzing trade-offs in ${topic.name} ("${chunk.title}"), what is the primary constraint identified in the course materials?`;
        options = [
          `Balancing theoretical performance guarantees against real-world operational constraints`,
          'Assuming unbounded resources without accounting for friction or overhead',
          'Treating localized phenomena as globally invariant across all domains',
          'Eliminating all analytical verification in favor of intuition',
        ];
        explanation = `Advanced analysis in ${course.name} requires evaluating how theoretical expectations hold under constraints documented in "${chunk.docTitle}": "${snippet}..."`;
      } else {
        // Mastery
        questionText = `For mastery of ${topic.name} within ${course.name}, what distinguishes optimal execution according to "${chunk.title}"?`;
        options = [
          `Holistic synthesis of structural invariants, mitigating systemic edge-case vulnerabilities`,
          'Superficial memorization of isolated vocabulary without conceptual linkages',
          'Relying on deprecated methodologies that ignore current domain constraints',
          'Restricting problem formulation to linear single-variable heuristics',
        ];
        explanation = `Mastery in ${course.code} demands rigorous synthesis of core invariants as framed in "${chunk.docTitle}": "${snippet}..."`;
      }

      questions.push({
        id: qId,
        courseId: course.id,
        topicId: topic.id,
        topicName: topic.name,
        difficulty,
        question: questionText,
        options,
        correctAnswerIndex: 0,
        explanation,
        citedDocumentChunkId: chunk.id,
        citedDocumentTitle: chunk.docTitle,
        citedPassageExcerpt: snippet,
      });
    } else {
      // No documents stored in this course folder yet: generate questions from topic syllabus
      let questionText = '';
      let options: string[] = [];
      let explanation = '';

      if (difficulty === 'beginner') {
        questionText = `In ${course.name} (${course.code}), what represents a foundational principle of "${topic.name}"?`;
        options = [
          `Understanding the core definitions, operational scope, and key concepts of ${topic.name}`,
          'Arbitrary rules applied without conceptual justification',
          'Unverified hypotheses that contradict standard terminology',
          'Isolated edge-cases with no relevance to practical applications',
        ];
        explanation = `Foundational mastery of "${topic.name}" requires grasping its core definitions and functional scope within ${course.name}.`;
      } else if (difficulty === 'intermediate') {
        questionText = `During the application of "${topic.name}" in ${course.code}, which factor is essential for sound methodology?`;
        options = [
          `Ensuring internal consistency, adhering to domain standards, and verifying key assumptions`,
          'Assuming infinite tolerance for error without error-checking',
          'Ignoring boundary constraints during implementation',
          'Relying solely on intuition without systematic validation',
        ];
        explanation = `Methodological rigor in "${topic.name}" hinges upon verifying critical assumptions and maintaining systemic consistency.`;
      } else if (difficulty === 'advanced') {
        questionText = `What is a critical failure mode or trade-off to anticipate when analyzing "${topic.name}" in ${course.name}?`;
        options = [
          `Subtle boundary degradation or systemic bottlenecks arising under peak or adversarial constraints`,
          'Complete immunity to real-world edge cases',
          'Unconditional scalability without resource expenditure',
          'Deterministic outcomes regardless of initial parameter variations',
        ];
        explanation = `Advanced analysis of "${topic.name}" entails recognizing trade-offs and anticipating failure modes under non-ideal operating parameters.`;
      } else {
        // Mastery
        questionText = `Which strategic approach characterizes expert-level evaluation in "${topic.name}"?`;
        options = [
          `Cross-disciplinary synthesis, dynamic adaptation to constraints, and predictive modeling of system behavior`,
          'Inflexible adherence to a single rigid template regardless of context',
          'Neglecting secondary ripple effects across related topics',
          'Dismissing qualitative nuance in complex scenarios',
        ];
        explanation = `At mastery level in ${course.code}, scholars synthesize multi-faceted variables to formulate resilient, context-aware evaluations of "${topic.name}".`;
      }

      questions.push({
        id: qId,
        courseId: course.id,
        topicId: topic.id,
        topicName: topic.name,
        difficulty,
        question: questionText,
        options,
        correctAnswerIndex: 0,
        explanation,
      });
    }
  }

  return questions;
}
