import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing and size limits
app.use(express.json({ limit: "10mb" }));

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
