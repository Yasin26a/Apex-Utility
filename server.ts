import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing and size limits
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini API client lazily to avoid crash on startup if missing API Key
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Routes
app.post("/api/writer/generate", async (req, res) => {
  const { prompt, contentType, tone, referenceContext } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const ai = getGeminiClient();
    
    // Construct the direct user query
    let userPrompt = `Draft a high-quality written piece of type "${contentType || 'Blog Post'}" in a "${tone || 'Professional'}" tone.\n\n`;
    userPrompt += `Core Instructions/Topic/Outline: ${prompt}\n\n`;
    
    if (referenceContext) {
      userPrompt += `Reference context/materials:\n"""\n${referenceContext}\n"""\n\n`;
    }
    
    userPrompt += `Please ensure the output is well-formatted using Markdown (headings, lists, bold text where appropriate), highly engaging, professional, and directly matches the user instructions. Do not add any meta-commentary about Gemini or being an AI or how you generated the text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "You are an expert AI copywriter and professional editor. Your goal is to write brilliant, clear, concise, and structured publications, emails, articles, and documentation.",
        temperature: 0.7,
      },
    });

    const generatedText = response.text;
    res.json({ text: generatedText });
  } catch (error: any) {
    console.error("Gemini API Error in AI Writer:", error);
    res.status(500).json({ error: error.message || "Failed to generate content using Gemini." });
  }
});

// Inline refinement API (shorter, professional, expand, etc.)
app.post("/api/writer/refine", async (req, res) => {
  const { text, instruction } = req.body;
  if (!text || !instruction) {
    return res.status(400).json({ error: "Text and instruction are required." });
  }

  try {
    const ai = getGeminiClient();
    
    const userPrompt = `Refine the following text according to this command: "${instruction}"\n\nOriginal Text:\n"""\n${text}\n"""\n\nProduce only the fully revised text without any introductory or concluding chatter. Keep the markdown structure intact if appropriate.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "You are a professional editor. You revise and format text directly based on the requested editing instructions. Do not add conversational conversational filler before or after the revised text.",
        temperature: 0.5,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in AI Refine:", error);
    res.status(500).json({ error: error.message || "Failed to refine content." });
  }
});

// AI SEO Content Optimizer Route
app.post("/api/seo/optimize", async (req, res) => {
  const { action, text, targetKeyword, targetDensity } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text content is required." });
  }

  try {
    const ai = getGeminiClient();
    let prompt = "";
    let systemInstruction = "You are an expert SEO specialist, copywriter, and professional editor.";

    if (action === "rewrite_keyword") {
      prompt = `Please rewrite the following content so that the focus keyword / phrase "${targetKeyword || "marketing"}" is seamlessly and naturally integrated throughout the text.
The goal is to aim for a healthy density count (about 1.5% to 2.5% frequency of all words) without keyword-stuffing. Make it highly engaging, authoritative, and clean.

Original Text:
"""
${text}
"""

Provide only the freshly rewritten text in Markdown. No preamble or conversational chat.`;
    } else if (action === "improve_readability") {
      prompt = `Please rewrite the following content to elevate its readability. Make sentences shorter, use simpler words, break down complex clauses, and avoid passive voice where feasible.
Your goal is to make it easy to digest, highly readable, and punchy, so that it scores extremely high on standard ease-of-reading tests (like Flesch-Kincaid).

Original Text:
"""
${text}
"""

Provide only the rewritten text in Markdown. No chatter.`;
    } else if (action === "autofill_meta") {
      prompt = `Analyze the following content and generate:
1. An engaging, search-engine optimized Title (ideally 50 to 60 characters).
2. A compelling, high-converting Meta Description summarizing the content with an implicit call-to-action (ideally 120 to 160 characters).

Content:
"""
${text}
"""

Return your response strictly as a JSON object, with no markdown code blocks around it, in this format:
{
  "title": "Optimized Page Title",
  "description": "High-converting meta description less than 160 characters."
}`;
      systemInstruction = "You are an expert SEO copywriter. You generate high click-through-rate Titles and Descriptions within character bounds. Respond strictly in raw JSON matching the requested fields, with no markdown markdown blocks around it.";
    } else if (action === "suggest_keywords") {
      prompt = `Analyze the following content and identify up to 5 highly relevant keyword or keyphrase ideas. Include a brief 1-sentence strategic rationale for why each keyword is recommended.

Content:
"""
${text}
"""

Return your response strictly as a JSON array of objects, with no markdown code blocks around it, in this format:
[
  { "keyword": "keyword idea", "rationale": "strategic explanation" }
]`;
      systemInstruction = "You are an expert search planner. You respond strictly with a valid JSON array of keyword recommendations, without any markdown layout wrappers.";
    } else {
      return res.status(400).json({ error: "Invalid SEO optimization action specified." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.5,
        responseMimeType: (action === "autofill_meta" || action === "suggest_keywords") ? "application/json" : undefined,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in SEO Optimizer:", error);
    res.status(500).json({ error: error.message || "Failed to perform SEO optimization." });
  }
});

// AI Audio Transcriber Route
app.post("/api/transcribe", async (req, res) => {
  const { audioData, mimeType, language } = req.body;
  
  if (!audioData || !mimeType) {
    return res.status(400).json({ error: "audioData and mimeType are required." });
  }

  try {
    const ai = getGeminiClient();
    
    const audioPart = {
      inlineData: {
        mimeType: mimeType, // e.g., 'audio/mp3', 'audio/wav', etc.
        data: audioData, // raw base64 string
      }
    };
    
    let textPrompt = `Please transcribe the attached audio recording with millisecond precision and break it into sequential, logical time-coded segments corresponding to sentences or natural conversational pauses.
If there are multiple distinct speakers, identify them and label them as "Speaker 1", "Speaker 2", etc.
Ensure all speech is translated or captured in its plain spoken text with maximum word fidelity.
Do not skip or summarize any sections.

`;

    if (language && language.trim() !== "") {
      textPrompt += `The primary language spoken in the audio is suspected to be: "${language}". Please transcribe/translate accordingly.\n\n`;
    }

    textPrompt += `Respond strictly using a JSON array of segment objects adhering to the specified schema schema. No introduction, no markdown backticks, and no explaining.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [audioPart, { text: textPrompt }] },
      config: {
        systemInstruction: "You are an advanced, world-class audio transcription system. Your core instruction is to analyze audio speech and produce highly accurate, verbatim string transcript segments with start and end markers (in seconds) in a strict JSON array format. Do not prepend or append any conversational comments or markdown delimiters.",
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.NUMBER, description: "Start time of the segment in seconds (relative to the audio file start)." },
              endTime: { type: Type.NUMBER, description: "End time of the segment in seconds (relative to the audio file start)." },
              speaker: { type: Type.STRING, description: "Speaker identification label like 'Speaker 1', 'Speaker 2' or similar." },
              text: { type: Type.STRING, description: "The transcribed spoken content for this segment." }
            },
            required: ["startTime", "endTime", "text"]
          }
        }
      }
    });

    const parsedTranscript = JSON.parse(response.text || "[]");
    res.json({ transcript: parsedTranscript });
  } catch (error: any) {
    console.error("Gemini Transcription Error:", error);
    res.status(500).json({ error: error.message || "Failed to transcribe audio file using Gemini AI." });
  }
});

// AI Document & PDF Q&A Analyst (Chat with PDF) Route
app.post("/api/pdf-analyst/chat", async (req, res) => {
  const { pdfData, mimeType, fileName, messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  try {
    const ai = getGeminiClient();
    const contents: any[] = [];

    // Map existing messages to Gemini format
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
      
      const parts: any[] = [{ text: msg.content }];
      
      // Prepend the PDF to the first user turn if present
      if (role === "user" && pdfData && !contents.some(c => c.role === "user")) {
        parts.unshift({
          inlineData: {
            data: pdfData,
            mimeType: mimeType || "application/pdf"
          }
        });
      }

      contents.push({
        role,
        parts
      });
    }

    const systemInstruction = 
      `You are an elite, highly precise AI Document Q&A Assistant and research researcher. 
Your role is to help users analyze, summarize, extract, and understand details from their uploaded file (which could be a PDF, txt, csv, or json).
Under no circumstances should you invent facts, hallucinate sections, or claim things exist in the document when they do not. 
If the uploaded document is a PDF, refer to page numbers, titles, and layout elements whenever possible to provide high confidence answers.
If the answer cannot be found in the document, state clearly: "I cannot find a direct mention of this in the uploaded document, but format standard knowledge is provided below..." and provide a high-caliber explanation.
Ensure your tone is professional, analytical, helpful, and concise. Format your responses with beautiful Markdown headers, clean bullet points, bold key insights, and code/table structures where fitting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Q&A Error:", error);
    res.status(500).json({ error: error.message || "Failed to query the document using Gemini AI." });
  }
});

// Vite middleware development check
const isProd = process.env.NODE_ENV === "production";

async function setupVite() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} [${isProd ? "production" : "development"}]`);
  });
}

setupVite().catch((err) => {
  console.error("Error setting up server:", err);
  process.exit(1);
});
