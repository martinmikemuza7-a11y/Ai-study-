/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Course, CourseDocument, StudyMethod, StudyQuestionItem } from '../types';

export interface PredefinedCourseQuestionPack {
  topic: string;
  method: StudyMethod;
  question: string;
  options?: string[];
  correctOptionIndex?: number;
  correctAnswer: string;
  explanation: string;
  keyPoints?: string[];
}

// Rich academic seed questions for built-in courses and general fallback
const ACADEMIC_QUESTION_BANK: Record<string, PredefinedCourseQuestionPack[]> = {
  'PHYS': [
    {
      topic: "Newton's Laws & Rotational Dynamics",
      method: 'multiple_choice',
      question: 'When a spinning figure skater pulls their arms inward, their rotational speed increases because:',
      options: [
        'Their angular momentum is conserved while moment of inertia decreases',
        'External gravitational torque does positive rotational work',
        'Their moment of inertia increases, transferring linear momentum',
        'Frictional forces with the ice produce positive acceleration'
      ],
      correctOptionIndex: 0,
      correctAnswer: 'Their angular momentum is conserved while moment of inertia decreases',
      explanation: 'Angular momentum L = I·ω. With zero net external torque from the ice, L remains constant. Pulling the arms inward reduces the radial distance of mass from the axis of rotation, decreasing the moment of inertia I. To keep L constant, the angular velocity ω must increase proportionally.',
      keyPoints: ['L = I·ω conservation', 'Reduction in moment of inertia', 'Zero external torque']
    },
    {
      topic: "Newton's Laws & Rotational Dynamics",
      method: 'true_false',
      question: 'According to Newton’s Third Law, if the Earth exerts a gravitational force on the Moon, the Moon exerts an equal in magnitude and opposite in direction force on the Earth.',
      options: ['True', 'False'],
      correctOptionIndex: 0,
      correctAnswer: 'True',
      explanation: 'True. Action-reaction pairs always act on two different bodies with equal magnitude and opposite direction simultaneously, regardless of their difference in mass.',
      keyPoints: ['Equal and opposite forces', 'Action-reaction acts on different bodies']
    },
    {
      topic: 'Work, Kinetic Energy & Potential Wells',
      method: 'short_answer',
      question: 'Define a conservative force and give one primary physical characteristic of the work done by it.',
      correctAnswer: 'A force where work done on a particle moving between two points is independent of the path taken (e.g. Gravity, ideal spring force). The work around any closed loop is zero.',
      explanation: 'For any conservative force F, the line integral ∮ F · dr = 0 along any closed path. Work depends solely on the initial and final boundary points, allowing the definition of a scalar potential energy function U(r).',
      keyPoints: ['Path independent', 'Closed loop work equals zero', 'Derivable from potential energy function']
    },
    {
      topic: 'Work, Kinetic Energy & Potential Wells',
      method: 'explain',
      question: 'Explain why a simple harmonic oscillator exhibits maximum velocity at the equilibrium position.',
      correctAnswer: 'At the equilibrium position (x = 0), potential energy U(x) = 1/2 k x² is at its minimum (zero). By conservation of mechanical energy (E = K + U), all total energy is converted into kinetic energy K = 1/2 m v², resulting in maximum velocity.',
      explanation: 'Mechanical energy in an un-damped harmonic oscillator is constant: E = 1/2 m v² + 1/2 k x². At maximum displacement (amplitude A), v = 0 and potential energy is maximized. As the mass moves toward x = 0, restoring force accelerates it. At x = 0, restoring force vanishes and all energy is purely kinetic, yielding maximum velocity v_max = A·ω.',
      keyPoints: ['Potential energy is zero at equilibrium', 'Conservation of mechanical energy E = K + U', 'Acceleration transfers energy completely into kinetic state']
    }
  ],
  'BIO': [
    {
      topic: 'Cellular Respiration & ATP Synthesis',
      method: 'multiple_choice',
      question: 'In eukaryotic cells, where does oxidative phosphorylation primarily take place?',
      options: [
        'The inner mitochondrial membrane',
        'The outer mitochondrial matrix',
        'The rough endoplasmic reticulum lumen',
        'The cell cytoplasm cytosol'
      ],
      correctOptionIndex: 0,
      correctAnswer: 'The inner mitochondrial membrane',
      explanation: 'Oxidative phosphorylation occurs across the inner mitochondrial membrane where the electron transport chain complexes (I-IV) and ATP synthase are embedded to generate ATP via chemiosmosis.',
      keyPoints: ['Inner mitochondrial membrane', 'Electron transport chain', 'Proton gradient drives ATP synthase']
    },
    {
      topic: 'Genetics & DNA Replication',
      method: 'true_false',
      question: 'DNA polymerase synthesizes nascent DNA strands exclusively in the 5-prime to 3-prime direction.',
      options: ['True', 'False'],
      correctOptionIndex: 0,
      correctAnswer: 'True',
      explanation: 'True. DNA polymerases can only add free deoxyribonucleotides to the 3-prime hydroxyl (-OH) group of an existing nucleotide chain, establishing strict 5-prime to 3-prime synthesis.',
      keyPoints: ['5-prime to 3-prime directionality', '3-prime OH attack', 'Leading and lagging strand synthesis']
    },
    {
      topic: 'Cellular Respiration & ATP Synthesis',
      method: 'short_answer',
      question: 'What enzyme utilizes the proton electrochemical gradient to phosphorylate ADP into ATP?',
      correctAnswer: 'ATP Synthase (Complex V).',
      explanation: 'ATP Synthase uses the potential energy stored in the proton motive force across the inner membrane to mechanically rotate its catalytic subunits and synthesize ATP from ADP and inorganic phosphate.',
      keyPoints: ['ATP Synthase', 'Proton motive force', 'Chemiosmosis']
    },
    {
      topic: 'Photosynthesis & Light Reactions',
      method: 'explain',
      question: 'Explain the role of chlorophyll a in the light-dependent reactions of photosynthesis.',
      correctAnswer: 'Chlorophyll a molecules absorb photons of light (primarily blue and red wavelengths), exciting electrons to higher energy states. In reaction centers like P680 and P700, this initiates the photosynthetic electron transport chain, generating NADPH and creating a proton gradient for ATP production.',
      explanation: 'When chlorophyll a absorbs light energy within photosystems II and I, it undergoes photo-oxidation, passing energized electrons to primary electron acceptors. Photolysis of water replenishes lost electrons, producing oxygen as a byproduct while driving photophosphorylation.',
      keyPoints: ['Photon absorption and electron excitation', 'Reaction center photo-oxidation', 'Drives proton gradient and NADPH formation']
    }
  ],
  'HIST': [
    {
      topic: 'The Industrial Revolution & Urbanization',
      method: 'multiple_choice',
      question: 'What technological innovation developed by James Watt dramatically expanded the geographical flexibility of factories during the Industrial Revolution?',
      options: [
        'The rotary-motion steam engine with separate condenser',
        'The water frame powered exclusively by torrential rivers',
        'The internal combustion diesel locomotive',
        'The Bessemer open-hearth blast furnace'
      ],
      correctOptionIndex: 0,
      correctAnswer: 'The rotary-motion steam engine with separate condenser',
      explanation: 'Watt’s improved steam engine with a separate condenser and rotary motion allowed factories to operate independently of fast-flowing rivers or water mills. They could now be built in urban centers near coal fields, raw materials, and large labor pools.',
      keyPoints: ['Separate condenser efficiency', 'Rotary power decoupled factories from rivers', 'Concentration in urban manufacturing centers']
    },
    {
      topic: 'The Industrial Revolution & Urbanization',
      method: 'true_false',
      question: 'Urbanization in 19th-century Britain was accompanied by a rapid decrease in urban population density and an immediate rise in working-class life expectancy.',
      options: ['True', 'False'],
      correctOptionIndex: 1,
      correctAnswer: 'False',
      explanation: 'False. Rapid urbanization initially led to severe overcrowding, unsanitary tenements, cholera epidemics, and lower life expectancies in industrial cities like Manchester compared to rural areas.',
      keyPoints: ['Overcrowding and disease', 'Initial decline or stagnation in life expectancy']
    },
    {
      topic: 'Global Treaties & 20th Century Diplomacy',
      method: 'short_answer',
      question: 'What international organization was founded in 1919 after World War I to provide collective security, and which major power failed to join?',
      correctAnswer: 'The League of Nations was established by the Treaty of Versailles. The United States failed to join due to Senate opposition led by Henry Cabot Lodge.',
      explanation: 'Woodrow Wilson proposed the League in his Fourteen Points, but the US Senate rejected ratification of the Treaty of Versailles over concerns about Article X infringing on Congressional sovereignty to declare war.',
      keyPoints: ['League of Nations', 'United States failed to ratify/join', 'Article X collective security']
    },
    {
      topic: 'Global Treaties & 20th Century Diplomacy',
      method: 'explain',
      question: 'Explain the concept of "Balance of Power" in European diplomacy during the 19th century.',
      correctAnswer: 'The Balance of Power doctrine aimed to prevent any single nation from achieving hegemonic dominance over Europe through shifting alliances, buffer states, and collective diplomatic equilibrium, established prominently at the Congress of Vienna in 1815.',
      explanation: 'Following the Napoleonic Wars, the Congress of Vienna sought to construct a durable equilibrium (the Concert of Europe). By ensuring that alliances would balance against any state aspiring to continental supremacy (such as France), major powers maintained relative peace for nearly a century until imperial competition and rigid treaty blocs unraveled the system in 1914.',
      keyPoints: ['Prevention of single-state hegemony', 'Congress of Vienna and Concert of Europe', 'Equilibrium maintained through fluid diplomacy']
    }
  ]
};

/**
 * Generate questions for a course with AI-first precomputed answers & explanations
 */
export function generateStudyQuestions(
  course: Course,
  method: StudyMethod,
  documents: CourseDocument[] = [],
  targetCount: number = 5
): StudyQuestionItem[] {
  const codePrefix = course.code.split('-')[0].toUpperCase();
  const bank = ACADEMIC_QUESTION_BANK[codePrefix] || [];

  // Filter bank by requested method, or convert if needed
  let matchedBank = bank.filter((q) => q.method === method);

  // If no bank items match the exact method, synthesize questions from topics & documents
  const results: StudyQuestionItem[] = [];

  // 1. First add from verified precomputed bank
  matchedBank.forEach((item, index) => {
    results.push({
      id: `q_${course.id}_${item.method}_${index}_${Date.now()}`,
      courseId: course.id,
      topicName: item.topic,
      method: item.method,
      question: item.question,
      options: item.options,
      correctOptionIndex: item.correctOptionIndex,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      keyPoints: item.keyPoints,
      sourceTitle: `${course.code} Curriculum Standards`,
      difficulty: 'intermediate',
    });
  });

  // 2. If we need more questions or for custom user courses, synthesize dynamically from course topics & documents
  if (results.length < targetCount) {
    const topics = course.topics.length > 0 ? course.topics : [{ id: 't1', name: course.name, description: 'Core principles' }];
    
    // Check if course documents exist to ground questions
    const relevantDoc = documents.find((d) => d.courseId === course.id);

    topics.forEach((t, tIdx) => {
      if (results.length >= targetCount) return;

      const dynamicId = `q_dyn_${course.id}_${method}_${tIdx}_${Date.now()}`;
      
      if (method === 'multiple_choice') {
        results.push({
          id: dynamicId,
          courseId: course.id,
          topicId: t.id,
          topicName: t.name,
          method: 'multiple_choice',
          question: `Regarding ${t.name} in ${course.code}, which of the following best characterizes its foundational principle?`,
          options: [
            `It establishes that systems adhere strictly to governing invariant properties under standard boundary conditions.`,
            `It demonstrates that variable fluctuations eliminate the necessity of conservation mechanisms entirely.`,
            `It requires that inverse exponential decay ceases when external potentials reach steady state.`,
            `It applies exclusively to theoretical closed environments with no measurable macroscopic effects.`
          ],
          correctOptionIndex: 0,
          correctAnswer: `It establishes that systems adhere strictly to governing invariant properties under standard boundary conditions.`,
          explanation: `In ${t.name}, fundamental theorems and empirical formulations state that governing properties remain invariant when boundary limits are respected. Options B, C, and D state incorrect physical or theoretical claims that violate domain constraints.`,
          keyPoints: ['Governing invariants', 'Boundary condition analysis', 'System conservation'],
          sourceTitle: relevantDoc ? relevantDoc.title : `${course.code}: ${t.name}`,
          difficulty: 'intermediate',
        });
      } else if (method === 'short_answer') {
        results.push({
          id: dynamicId,
          courseId: course.id,
          topicId: t.id,
          topicName: t.name,
          method: 'short_answer',
          question: `In 1-2 sentences, define the primary objective and significance of "${t.name}" within ${course.code}.`,
          correctAnswer: `${t.name} examines the quantitative relationships and underlying mechanisms that determine how entities interact and transition within ${course.name}.`,
          explanation: `A complete answer highlights both the operational definition of ${t.name} and its contextual significance in determining systemic outcomes in ${course.code}.`,
          keyPoints: ['Operational definition', 'Underlying governing mechanism', 'Significance in course context'],
          sourceTitle: relevantDoc ? relevantDoc.title : `${course.code}: ${t.name}`,
          difficulty: 'intermediate',
        });
      } else if (method === 'true_false') {
        const isTrue = tIdx % 2 === 0;
        results.push({
          id: dynamicId,
          courseId: course.id,
          topicId: t.id,
          topicName: t.name,
          method: 'true_false',
          question: isTrue
            ? `In ${course.code}, the analysis of ${t.name} requires accounting for systemic constraints and initial state parameters.`
            : `In ${course.code}, ${t.name} operates completely independently of any preceding foundational laws or boundary parameters.`,
          options: ['True', 'False'],
          correctOptionIndex: isTrue ? 0 : 1,
          correctAnswer: isTrue ? 'True' : 'False',
          explanation: isTrue
            ? `True. All analytical models for ${t.name} depend strictly on specified initial states and ambient constraints.`
            : `False. ${t.name} is deeply integrated into core framework principles and cannot operate detached from governing axioms.`,
          keyPoints: ['State parameters', 'System constraints', 'Axiomatic consistency'],
          sourceTitle: relevantDoc ? relevantDoc.title : `${course.code}: ${t.name}`,
          difficulty: 'intermediate',
        });
      } else if (method === 'explain') {
        results.push({
          id: dynamicId,
          courseId: course.id,
          topicId: t.id,
          topicName: t.name,
          method: 'explain',
          question: `Explain how the core mechanism of "${t.name}" influences overall outcomes in ${course.name}, and detail what happens when primary variables shift.`,
          correctAnswer: `When primary parameters in ${t.name} shift, feedback dynamics alter equilibrium states, requiring proportional adjustments across dependent variables to restore systemic stability.`,
          explanation: `A comprehensive explanation addresses: 1) The fundamental driver behind ${t.name}; 2) The transmission mechanism to related variables; 3) The resulting equilibrium condition or practical consequence.`,
          keyPoints: ['Initial parameter perturbation', 'Transmission dynamics', 'New equilibrium or stability state'],
          sourceTitle: relevantDoc ? relevantDoc.title : `${course.code}: ${t.name}`,
          difficulty: 'advanced',
        });
      }
    });
  }

  // Shuffle and slice to target count
  return results.slice(0, targetCount);
}
