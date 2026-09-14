var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var aiInstance = null;
function getAI() {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mode: "full-stack",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/tutor", async (req, res) => {
  try {
    const { prompt, courseCode, courseName, courseTopics, ragContext, chatHistory } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const ai = getAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured on the server. Falling back to local offline tutor engine.",
        useLocalFallback: true
      });
    }
    const systemInstruction = `You are a world-class university academic tutor and Socratic educator for the course "${courseCode}: ${courseName}".
Topics in this course: ${JSON.stringify(courseTopics || [])}.

GUIDELINES:
1. SCOPED ACCURACY: Ground your answer strictly in the provided course lecture notes and textbook excerpts whenever relevant.
2. CITATIONS: If quoting or referencing a course concept, clearly state "[Course Reference: Chunk Title]" so students can locate it in their syllabus.
3. SOCRATIC METHOD: Do not merely dump raw answers. Encourage critical thinking by breaking problems down into first principles, contrasting tradeoffs, and ending with an insightful follow-up question.
4. TONE: Rigorous, clear, empathetic, and academically precise.`;
    let contextText = "";
    if (ragContext && Array.isArray(ragContext) && ragContext.length > 0) {
      contextText = `

--- RETRIEVED COURSE DOCUMENTS (RAG GROUNDING) ---
` + ragContext.map((c, i) => `[Source ${i + 1}: ${c.title}]
${c.content}`).join("\n\n") + `
--- END COURSE DOCUMENTS ---

`;
    }
    const userMessage = `${contextText}Student Question / Request:
"${prompt}"`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    const tutorText = response.text || "I could not generate a response. Please try again.";
    res.json({
      content: tutorText,
      groundedInCourse: ragContext && ragContext.length > 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Tutor API Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate tutor response",
      useLocalFallback: true
    });
  }
});
app.post("/api/quiz/generate", async (req, res) => {
  try {
    const { courseCode, courseName, topicName, difficulty, ragContext, count = 3 } = req.body;
    const ai = getAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured on the server.",
        useLocalFallback: true
      });
    }
    const prompt = `Generate ${count} university-level multiple-choice quiz questions for "${courseCode}: ${courseName}", targeting topic "${topicName || "Core Curriculum"}" at "${difficulty || "intermediate"}" difficulty.
Grounded Course Notes:
${ragContext ? JSON.stringify(ragContext) : "Standard course curriculum."}

Each question MUST:
- Have exactly 4 options.
- Have 1 unambiguous correct answer index (0, 1, 2, or 3).
- Include a detailed technical explanation citing why the answer is correct and why other distractors fail.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.ARRAY,
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              question: { type: import_genai.Type.STRING },
              options: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING }
              },
              correctAnswerIndex: { type: import_genai.Type.INTEGER },
              explanation: { type: import_genai.Type.STRING },
              citedConcept: { type: import_genai.Type.STRING }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });
    const parsedQuestions = JSON.parse(response.text || "[]");
    res.json({ questions: parsedQuestions });
  } catch (error) {
    console.error("Quiz Generator Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate quiz questions",
      useLocalFallback: true
    });
  }
});
app.post("/api/study/generate", async (req, res) => {
  try {
    const { courseCode, courseName, topicName, method, count = 3, ragContext } = req.body;
    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key is not configured", useLocalFallback: true });
    }
    const prompt = `Generate ${count} academic practice questions of type "${method || "multiple_choice"}" for course "${courseCode || "Academic"}: ${courseName || "Study"}" covering topic "${topicName || "General"}".
Course Context: ${JSON.stringify(ragContext || "")}

Format guidelines:
- If multiple_choice: include 4 options, correctAnswer (the string of the correct option), correctOptionIndex (0-3), and detailed explanation.
- If true_false: options must be ["True", "False"], correctAnswer ("True" or "False"), correctOptionIndex (0 or 1), and explanation.
- If short_answer or explain: question must be thought-provoking, correctAnswer must be the concise model answer, keyPoints array of 2-3 bullet strings, and explanation providing deep reasoning.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.ARRAY,
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              question: { type: import_genai.Type.STRING },
              options: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              correctAnswer: { type: import_genai.Type.STRING },
              correctOptionIndex: { type: import_genai.Type.INTEGER },
              explanation: { type: import_genai.Type.STRING },
              keyPoints: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } }
            },
            required: ["question", "correctAnswer", "explanation"]
          }
        }
      }
    });
    res.json({ questions: JSON.parse(response.text || "[]") });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Study generator error", useLocalFallback: true });
  }
});
app.post("/api/questions/generate-from-source", async (req, res) => {
  try {
    const {
      folderName = "My Folder",
      mode = "document",
      // 'document' | 'brainstorm_web'
      documents = [],
      // array of { title: string, content: string }
      questionType = "all",
      // 'all' | 'multiple_choice' | 'short_answer' | 'true_false' | 'explain'
      count = 4,
      customFocus = ""
    } = req.body;
    const ai = getAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured on the server. Falling back to local document engine.",
        useLocalFallback: true
      });
    }
    if (mode === "brainstorm_web") {
      const prompt = `You are an expert researcher and academic question creator.
Topic / Folder Theme: "${folderName}"
${customFocus ? `Specific Focus / Instructions: "${customFocus}"` : ""}

Task:
1. Brainstorm ${count} insightful, creative, and educational questions with comprehensive answers.
2. Question style: ${questionType === "all" ? "diverse mix of multiple choice, short answer, true/false, and conceptual explanation" : questionType}.
3. Search the web for up-to-date real-world facts, scientific discoveries, case studies, or authoritative statistics to back up each question and answer.

Format Requirement:
Output ONLY a JSON array with no wrapping text or markdown ticks if possible, or inside \`\`\`json \`\`\`.
Each item must have:
- "id": a unique string (e.g. "q_web_1")
- "question": clear question prompt
- "type": "multiple_choice" | "short_answer" | "true_false" | "explain"
- "options": array of 4 string choices (only if multiple_choice or true_false)
- "correctOptionIndex": integer 0-3 (only if options exist)
- "correctAnswer": precise model answer
- "explanation": deep conceptual breakdown citing real-world facts found on the web
- "sourceType": "web"
- "searchKeywords": string summary of web search queries used`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      const rawText = response.text || "";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const webSources = [];
      for (const ch of chunks) {
        if (ch.web?.uri) {
          webSources.push({
            uri: ch.web.uri,
            title: ch.web.title || ch.web.uri
          });
        }
      }
      let parsedQuestions = [];
      try {
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedQuestions = JSON.parse(jsonMatch[0]);
        } else {
          parsedQuestions = JSON.parse(rawText);
        }
      } catch (parseErr) {
        console.warn("Could not parse JSON directly from web grounding response, attempting cleanup:", parseErr);
        parsedQuestions = [
          {
            id: "q_web_fallback_1",
            question: `Brainstormed Key Inquiry for ${folderName}: ${customFocus || "Core Principles"}`,
            type: "explain",
            correctAnswer: rawText.slice(0, 300),
            explanation: rawText,
            sourceType: "web"
          }
        ];
      }
      const enhancedQuestions = parsedQuestions.map((q, index) => ({
        ...q,
        id: q.id || `q_web_${Date.now()}_${index}`,
        sourceType: "web",
        webSources: webSources.slice(0, 3)
      }));
      return res.json({
        mode: "brainstorm_web",
        questions: enhancedQuestions,
        webSources
      });
    } else {
      if (!documents || documents.length === 0) {
        return res.status(400).json({
          error: "No documents provided. Please upload documents to the folder first."
        });
      }
      const combinedDocs = documents.map((d, i) => `--- DOCUMENT ${i + 1}: ${d.title} ---
${d.content.slice(0, 8e3)}`).join("\n\n");
      const prompt = `You are an academic assessment generator. Generate ${count} rigorous questions whose answers are extracted DIRECTLY from the provided documents.

DOCUMENTS:
${combinedDocs}

FOLDER: "${folderName}"
${customFocus ? `SPECIAL FOCUS: "${customFocus}"` : ""}
QUESTION TYPE: ${questionType === "all" ? "mixed types (multiple_choice, short_answer, true_false, explain)" : questionType}

RULES:
1. Every question MUST be answerable using facts, concepts, or formulas found in the uploaded documents.
2. The "correctAnswer" MUST be strictly supported by the document text.
3. In "documentExcerpt", quote the exact 1-2 sentences from the document that verify the answer.
4. For multiple_choice, write 4 plausible options where only 1 is correct based on the text.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.ARRAY,
            items: {
              type: import_genai.Type.OBJECT,
              properties: {
                id: { type: import_genai.Type.STRING },
                question: { type: import_genai.Type.STRING },
                type: { type: import_genai.Type.STRING, description: "multiple_choice | short_answer | true_false | explain" },
                options: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                correctOptionIndex: { type: import_genai.Type.INTEGER },
                correctAnswer: { type: import_genai.Type.STRING },
                explanation: { type: import_genai.Type.STRING },
                documentExcerpt: { type: import_genai.Type.STRING, description: "Exact quote from the uploaded document text" },
                sourceTitle: { type: import_genai.Type.STRING, description: "Title of the document containing this answer" }
              },
              required: ["question", "type", "correctAnswer", "explanation", "documentExcerpt"]
            }
          }
        }
      });
      const parsedQuestions = JSON.parse(response.text || "[]");
      const formatted = parsedQuestions.map((q, i) => ({
        ...q,
        id: q.id || `q_doc_${Date.now()}_${i}`,
        sourceType: "document",
        sourceTitle: q.sourceTitle || (documents[0] ? documents[0].title : "Uploaded Document")
      }));
      return res.json({
        mode: "document",
        questions: formatted
      });
    }
  } catch (error) {
    console.error("Questions Generator Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate questions",
      useLocalFallback: true
    });
  }
});
function getDownloadFilePath(filename) {
  const publicPath = import_path.default.join(process.cwd(), "public", "downloads", filename);
  if (import_fs.default.existsSync(publicPath)) return publicPath;
  const distPath = import_path.default.join(process.cwd(), "dist", "downloads", filename);
  if (import_fs.default.existsSync(distPath)) return distPath;
  return null;
}
app.use("/downloads", import_express.default.static(import_path.default.join(process.cwd(), "public", "downloads")));
app.use("/downloads", import_express.default.static(import_path.default.join(process.cwd(), "dist", "downloads")));
app.get("/downloads/*", (req, res) => {
  res.status(404).json({
    error: "Requested download file was not found.",
    message: "To host binaries locally, place them in public/downloads/ or configure an external hosted download URL."
  });
});
app.get(["/api/download/source", "/api/download/source-code", "/api/download/project-zip", "/api/download/zip", "/downloads/study-buddy-ai-source.zip"], (req, res) => {
  let filePath = getDownloadFilePath("study-buddy-ai-source.zip");
  if (!filePath) {
    try {
      const { execSync } = require("child_process");
      execSync("python3 scripts/package-source.py", { timeout: 2e4 });
      filePath = getDownloadFilePath("study-buddy-ai-source.zip");
    } catch (err) {
      console.error("Failed to generate source zip:", err);
    }
  }
  if (!filePath) {
    return res.status(500).json({
      error: "Failed to generate project source code archive.",
      message: "Please export the project directly from the Google AI Studio menu."
    });
  }
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="study-buddy-ai-source.zip"');
  res.download(filePath, "study-buddy-ai-source.zip");
});
app.get(["/api/download/android", "/apk", "/android", "/downloads/study-buddy-ai.apk"], (req, res) => {
  const filePath = getDownloadFilePath("study-buddy-ai.apk") || getDownloadFilePath("AI-Study-v2.4.0.apk");
  if (!filePath) {
    if (req.accepts("html") && !req.xhr && (req.headers.accept || "").includes("text/html")) {
      return res.redirect("/?notice=android-binary-pending#downloads");
    }
    return res.status(404).json({
      error: "Android APK binary is not hosted locally on this server.",
      status: "binary_not_hosted",
      message: "Study Buddy AI runs directly in your browser with full offline PWA support. To distribute a native APK, compile with Capacitor (npm run build:android) and configure a hosted URL or place the binary in public/downloads/.",
      webAppUrl: "/?view=app",
      landingUrl: "/#downloads"
    });
  }
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", 'attachment; filename="study-buddy-ai.apk"');
  res.download(filePath, "study-buddy-ai.apk");
});
app.get(["/api/download/windows", "/api/download/pc", "/windows", "/pc", "/downloads/study-buddy-ai.exe", "/downloads/AI-Study-Setup-2.4.0.exe", "/downloads/study-buddy-ai-setup.exe"], (req, res) => {
  const filePath = getDownloadFilePath("study-buddy-ai.exe") || getDownloadFilePath("AI-Study-Setup-2.4.0.exe") || getDownloadFilePath("study-buddy-ai-setup.exe");
  if (!filePath) {
    if (req.accepts("html") && !req.xhr && (req.headers.accept || "").includes("text/html")) {
      return res.redirect("/?notice=windows-binary-pending#downloads");
    }
    return res.status(404).json({
      error: "Windows installer binary is not hosted locally on this server.",
      status: "binary_not_hosted",
      message: "Study Buddy AI runs directly in your browser with full offline PWA support. To distribute a Windows installer, compile with Electron (npm run build:windows) and configure a hosted URL or place the binary in public/downloads/.",
      webAppUrl: "/?view=app",
      landingUrl: "/#downloads"
    });
  }
  res.setHeader("Content-Type", "application/vnd.microsoft.portable-executable");
  res.setHeader("Content-Disposition", 'attachment; filename="study-buddy-ai-setup.exe"');
  res.download(filePath, "study-buddy-ai-setup.exe");
});
app.get(["/api/download/windows-portable", "/downloads/study-buddy-ai-windows.zip", "/downloads/AI-Study-Windows-Portable.zip"], (req, res) => {
  const filePath = getDownloadFilePath("study-buddy-ai-windows.zip") || getDownloadFilePath("AI-Study-Windows-Portable.zip");
  if (!filePath) {
    return res.status(404).json({
      error: "Windows portable binary is not hosted locally on this server."
    });
  }
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="study-buddy-ai-windows.zip"');
  res.download(filePath, "study-buddy-ai-windows.zip");
});
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/downloads/")) {
        return res.status(404).json({ error: "Route or file not found" });
      }
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Study server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
var server_default = app;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
