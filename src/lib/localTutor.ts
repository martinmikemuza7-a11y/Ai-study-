/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Course, CourseDocument, ChatMessage, RAGSearchResult } from '../types';
import { searchLocalCourseRAG } from './rag';

export interface TutorResponse {
  content: string;
  groundedChunks: {
    chunkId: string;
    documentTitle: string;
    score: number;
    snippet: string;
  }[];
  suggestedPrompts: string[];
}

/**
 * High-performance Offline Socratic AI Tutor Engine
 * Evaluates user input against course-scoped RAG documents, constructs structured Socratic guidance,
 * highlights grounded course definitions, and generates diagnostic follow-up questions.
 */
export function generateOfflineTutorResponse(
  userPrompt: string,
  currentCourse: Course,
  courseDocuments: CourseDocument[],
  chatHistory: ChatMessage[] = []
): TutorResponse {
  // 1. Retrieve most relevant course chunks via local RAG
  const ragMatches: RAGSearchResult[] = searchLocalCourseRAG(userPrompt, courseDocuments, 3);
  const promptLower = userPrompt.toLowerCase();

  // 2. Determine intent
  const isQuestion = promptLower.includes('?') || promptLower.startsWith('what') || promptLower.startsWith('how') || promptLower.startsWith('why');
  const isSocraticRequest = promptLower.includes('socratic') || promptLower.includes('step by step') || promptLower.includes('breakdown');
  const isQuizRequest = promptLower.includes('quiz') || promptLower.includes('test me') || promptLower.includes('challenge');
  const isEli5 = promptLower.includes('eli5') || promptLower.includes('simple') || promptLower.includes('beginner');

  const groundedChunks = ragMatches.map((m) => ({
    chunkId: m.chunk.id,
    documentTitle: m.chunk.title,
    score: m.score,
    snippet: m.chunk.content.substring(0, 140) + '...',
  }));

  let responseBody = '';
  let followUpPrompts: string[] = [];

  if (ragMatches.length > 0) {
    const primaryMatch = ragMatches[0].chunk;
    const secondaryMatch = ragMatches[1]?.chunk;

    if (isQuizRequest) {
      responseBody = `### 🧠 Quick Socratic Check: ${primaryMatch.title}

Based on your course materials for **${currentCourse.code}**, let's test your conceptual understanding:

**Challenge Question:**
> In the context of **${primaryMatch.title}**, how does the primary mechanism prevent worst-case degradation?

*Grounding reference from course notes:*
> "${primaryMatch.content.slice(0, 160)}..."

**How would you answer?** Consider the tradeoffs between memory overhead and execution speed.`;

      followUpPrompts = [
        'Give me a hint for this question',
        'Show me the full answer with proof',
        'Explain the real-world application',
      ];
    } else if (isEli5) {
      responseBody = `### 💡 Intuitive Breakdown: ${primaryMatch.title}

Let's simplify this concept using an intuitive mental model:

Think of it like an organized library or workshop. If everyone tosses books on the same front desk, you get long bottlenecks. To prevent this, **${currentCourse.name}** establishes strict rules:

1. **The Core Principle:** Rather than random placement, it uses a deterministic rule so you immediately know where to look.
2. **Handling Collisions / Conflicts:** When two items compete for the same position, it systematically resolves them rather than failing.
3. **Course Fact:** As documented in *${primaryMatch.title}*:
> "${primaryMatch.content}"

**Socratic Checkpoint:** What would happen if we increased the load on this system beyond its safe threshold?`;

      followUpPrompts = [
        'How does this relate to Big-O complexity?',
        'Show me the formal mathematical definition',
        'Give me a multiple choice question on this',
      ];
    } else if (isSocraticRequest) {
      responseBody = `### 🧭 Step-by-Step Socratic Exploration

Let's examine **${primaryMatch.title}** through three foundational questions:

1. **What fundamental problem is being solved?**
   In ${currentCourse.name}, systems must maintain high throughput while handling unpredictable inputs without degrading to linear time.

2. **What does your course text state?**
   From *${primaryMatch.title}* (Match Confidence: ${Math.round(ragMatches[0].score * 100)}%):
   > "${primaryMatch.content}"

3. **Key Tradeoff to analyze:**
   ${secondaryMatch ? `Comparing this with *${secondaryMatch.title}*: notice how state space and computational overhead balance against each other.` : 'Notice how memory allocation scales as elements grow.'}

**Where should we dive deeper?** Do you want to examine edge cases or walk through an implementation?`;

      followUpPrompts = [
        'Let\'s walk through an edge case',
        'Compare with alternative strategies',
        'Generate an exam-level quiz question',
      ];
    } else {
      // Standard comprehensive response
      responseBody = `### 📚 Course-Grounded Synthesis: ${currentCourse.code}

Here is what your stored course materials specify regarding your query:

#### Key Concept from Course File
From **${primaryMatch.title}**:
> "${primaryMatch.content}"

${secondaryMatch ? `#### Additional Context\nFrom **${secondaryMatch.title}**:\n> "${secondaryMatch.content}"\n` : ''}

#### Socratic Takeaway
When studying for **${currentCourse.name}**, remember to focus not just on memorizing definitions, but on analyzing:
- The core operational mechanisms and governing principles
- How underlying assumptions hold under edge constraints
- Key trade-offs that distinguish this from standard alternatives.`;

      followUpPrompts = [
        'Explain this with a simple analogy',
        'Test my knowledge with an adaptive quiz',
        'Break this down step-by-step',
      ];
    }
  } else {
    // No direct RAG match in current course documents
    const topicsList = (currentCourse.topics && currentCourse.topics.length > 0)
      ? currentCourse.topics.map((t) => `- **${t.name}** (${t.masteryPercentage}% mastery)`).join('\n')
      : '- General Course Core Principles';

    responseBody = `### 🔍 Offline Knowledge Assistant (${currentCourse.code})

I searched the stored files in this course folder for **${currentCourse.name}**, but didn't find an exact passage matching "*${userPrompt}*".

**Course Topics:**
${topicsList}

💡 *Tip: Add or drop lecture notes and study guides directly into this Course Folder under the **Docs** tab to ground the AI with your course materials!*`;

    followUpPrompts = (currentCourse.topics && currentCourse.topics.length > 0)
      ? currentCourse.topics.slice(0, 3).map((t) => `Explain ${t.name}`)
      : ['Explain core concepts', 'Generate an adaptive practice test', 'How should I structure my study plan?'];
  }

  return {
    content: responseBody,
    groundedChunks,
    suggestedPrompts: followUpPrompts.slice(0, 3),
  };
}
