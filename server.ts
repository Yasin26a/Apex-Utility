import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { AT_LEAST_20_ARTICLES } from './src/data/articles';

async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: { model: string; contents: any; config?: any }
) {
  const primaryModel = params.model;
  // Fallback chain: primary -> 'gemini-3.1-flash-lite' -> 'gemini-flash-latest'
  const fallbackModels = [primaryModel];
  if (primaryModel === 'gemini-3.5-flash') {
    fallbackModels.push('gemini-3.1-flash-lite');
    fallbackModels.push('gemini-flash-latest');
  } else if (primaryModel === 'gemini-3.1-flash-lite') {
    fallbackModels.push('gemini-3.5-flash');
    fallbackModels.push('gemini-flash-latest');
  }

  let finalError: any = null;
  for (const model of fallbackModels) {
    try {
      console.log(`[Gemini API] Attempting call with model: ${model}`);
      const result = await ai.models.generateContent({
        ...params,
        model
      });
      return result;
    } catch (err: any) {
      console.log(`[Gemini API] Soft hint: model ${model} was unavailable (503 or overload). Retrying in fallback sequence...`);
      finalError = err;
    }
  }
  console.error('[Gemini API] All fallback models failed. Final error is:', finalError);
  throw finalError;
}

async function createServer() {
  const app = express();
  const port = 3000;

  // Disable X-Powered-By header to prevent fingerprinting/tech-profiling
  app.disable('x-powered-by');

  // 301 Redirect alternative hosts and subdomains of apexutility.live to the canonical apexutility.live
  app.use((req, res, next) => {
    const host = (req.headers.host || '').toLowerCase();
    const hostname = host.split(':')[0]; // Exclude the port number to handle various environment headers cleanly
    
    // Check if the hostname ends with apexutility.live but is not exactly the canonical 'apexutility.live'
    const isSubdomainOrAlt = (hostname.endsWith('apexutility.live') && hostname !== 'apexutility.live') || 
                             hostname.includes('apexutility.com.apexutility.live');
    
    if (isSubdomainOrAlt) {
      return res.redirect(301, `https://apexutility.live${req.originalUrl}`);
    }
    next();
  });

  // Hardened Security Headers Middleware
  app.use((req, res, next) => {
    // Set 'Link: <url>; rel="canonical"' HTTP response header for robust cross-subdomain canonicalization
    const cleanPath = req.path.endsWith('/') && req.path.length > 1 ? req.path.slice(0, -1) : req.path;
    const canonicalHeaderUrl = `https://apexutility.live${cleanPath}`;
    res.setHeader('Link', `<${canonicalHeaderUrl}>; rel="canonical"`);

    // Prevent browser MIME-sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enforce legacy Cross-Site Scripting (XSS) filters
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Control referer details passed in outgoing link requests
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Force HTTP Strict Transport Security (HSTS) in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    
    // Mitigate search frame hijack / clickjacking
    // Allow local development and native AI Studio environments to preview
    const host = req.headers.host || '';
    const referer = req.headers.referer || '';
    const isPlatformFrame = referer.includes('studio.google') || referer.includes('ai.studio') || host.includes('run.app') || host.includes('localhost');
    
    if (process.env.NODE_ENV === 'production' && !isPlatformFrame) {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    next();
  });

  // Limit JSON and URL-encoded payload sizes to protect from Memory Exhaustion Attacks (DoS)
  // Generous limit of 25mb configures large PDF manipulation tasks safety
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // -----------------------------------------------------------------
  // High-Performance Native Sliding Window Rate Limiter
  // -----------------------------------------------------------------
  const rateLimitStore = new Map<string, { timestamps: number[] }>();
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
  const RATE_LIMIT_MAX_REQUESTS = 60; // Max 60 requests per minute per IP for developer routes

  const ipRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Only rate limit API paths
    if (!req.path.startsWith('/api/')) {
      return next();
    }
    
    // Safely extract client IP taking proxy layers into account
    const rawIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-client';
    const ip = rawIp.split(',')[0].trim();
    const now = Date.now();
    
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, { timestamps: [now] });
      return next();
    }
    
    const clientRecord = rateLimitStore.get(ip)!;
    
    // Prune entries older than the sliding window limits
    clientRecord.timestamps = clientRecord.timestamps.filter(ts => (now - ts) < RATE_LIMIT_WINDOW_MS);
    
    if (clientRecord.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      const oldestRemaining = clientRecord.timestamps[0];
      const timeElapsed = now - oldestRemaining;
      const cooldownSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - timeElapsed) / 1000);
      
      console.warn(`[Security Patrol] Rate limit exceeded by IP: ${ip} on path ${req.path}`);
      res.status(429).json({
        error: 'Too many requests. For security and quota limits, please wait a minute and try again.',
        retryAfterSeconds: Math.max(1, cooldownSeconds)
      });
      return;
    }
    
    clientRecord.timestamps.push(now);
    next();
  };

  // Bind the security rate-limiter middleware of state requests
  app.use('/api/', ipRateLimiter);

  // API Content Planner Endpoint using Gemini 3.5 Flash
  app.post('/api/content-planner', async (req, res) => {
    try {
      const { keyword, audience, tone, format } = req.body;
      if (!keyword || typeof keyword !== 'string') {
        res.status(400).json({ error: 'Keyword must be a non-empty string.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      // Initialize the modern GoogleGenAI client with required header
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const userPrompt = `Develop a detailed search intent & content planning strategy for the following keyword/topic:
Keyword: "${keyword}"
Target Audience: ${audience || 'General public'}
Desired Editorial Tone: ${tone || 'Professional & informative'}
Suggested Content Format: ${format || 'Comprehensive Guide'}

Generate recommendations, semantic keyword expansions, long-tail search questions, target audience profiling, meta compliance details, an editorial word-count target, detailed outlining structure (H1, H2s, H3s) containing bullet lists of key details, and relevant schema-compliant FAQs.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          searchIntent: {
            type: Type.OBJECT,
            properties: {
              intentType: { type: Type.STRING },
              explanation: { type: Type.STRING },
              stage: { type: Type.STRING }
            },
            required: ["intentType", "explanation", "stage"]
          },
          userProblem: { type: Type.STRING },
          audienceProfile: {
            type: Type.OBJECT,
            properties: {
              demographics: { type: Type.STRING },
              expertiseLevel: { type: Type.STRING },
              intentTriggers: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["demographics", "expertiseLevel", "intentTriggers"]
          },
          keywords: {
            type: Type.OBJECT,
            properties: {
              primary: { type: Type.STRING },
              semantic: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              longTailQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ["question", "explanation"]
                }
              }
            },
            required: ["primary", "semantic", "longTailQuestions"]
          },
          seoGuidelines: {
            type: Type.OBJECT,
            properties: {
              recommendedWordCount: { type: Type.INTEGER },
              metaTitle: { type: Type.STRING },
              metaDescription: { type: Type.STRING },
              editorialTone: { type: Type.STRING }
            },
            required: ["recommendedWordCount", "metaTitle", "metaDescription", "editorialTone"]
          },
          outline: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                keyPointsToCover: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["heading", "type", "description", "keyPointsToCover"]
            }
          },
          faq: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          }
        },
        required: [
          "keyword",
          "searchIntent",
          "userProblem",
          "audienceProfile",
          "keywords",
          "seoGuidelines",
          "outline",
          "faq"
        ]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an elite SEO strategist, semantic search architecture engineer, and pro copywriting outline directory editor. Return strict, pristine structural layouts in raw JSON according to the exact response schema. Keep descriptions and answers precise, highly professional, with no markdown codeblock wrappers.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty response.');
      }

      const cleanJson = JSON.parse(result.text.trim());
      res.json(cleanJson);
    } catch (err: any) {
      console.error('Error in content-planner api:', err);
      res.status(500).json({ error: err.message || 'Internal server error processing report.' });
    }
  });

  // API Social Media Hook Generator Endpoint using Gemini 3.5 Flash
  app.post('/api/hook-generator', async (req, res) => {
    try {
      const { topic, platform, tone, audience, format } = req.body;
      if (!topic || typeof topic !== 'string') {
        res.status(400).json({ error: 'Topic must be a non-empty string.' });
        return;
      }
      if (!platform || typeof platform !== 'string') {
        res.status(400).json({ error: 'Platform must be a non-empty string.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      // Initialize the modern GoogleGenAI client with required header
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const userPrompt = `Generate a set of 5 highly compelling, high-engagement viral social media hooks specifically tailored for the platform "${platform}".
Topic/Context: "${topic}"
Target Audience: "${audience || 'General public / professionals'}"
Emotional Tone: "${tone || 'Curious & Provocative'}"
Format Style: "${format || 'Any/Optimal'}"

Each hook should follow an established high-performance copywriting formula. Provide:
1. The hook formula name (e.g., "The Negative Frame Pattern Interrupt", "The Value Loop", "The Contrarian Claim").
2. The exact hook text (polished, ready to copy, utilizing proper spacing, bolding highlights if appropriate, or relevant emoji accents for maximum CTR).
3. The psychological trigger explanation.
4. A smooth continuation transition/suggestion (e.g. what the next sentence or thread item should cover to sustain the reader's attention).
5. A list of 2 specific engagement tips for publishing this hook.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          platform: { type: Type.STRING },
          tone: { type: Type.STRING },
          hooks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                formulaName: { type: Type.STRING, description: "Name of the psychological copywriting hook formula." },
                hookText: { type: Type.STRING, description: "The high-impact hook text, beautifully spaced." },
                psychology: { type: Type.STRING, description: "Why this works, referencing cognitive bias or triggers like pattern interrupt or curiosity gaps." },
                transition: { type: Type.STRING, description: "The immediate follow-up sentence or line to keep attention." },
                engagementTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "2 custom tactical publishing or formatting tips."
                }
              },
              required: ["formulaName", "hookText", "psychology", "transition", "engagementTips"]
            }
          }
        },
        required: ["topic", "platform", "tone", "hooks"]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an elite, world-class copywriter, social media algorithm whisperer, and viral marketing director. Generate high-engagement hook strategies that maximize dwell time, clicks, impressions, and conversions. Return strict, pristine structures in raw JSON with no markdown block wrappers.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.7
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty response.');
      }

      const cleanJson = JSON.parse(result.text.trim());
      res.json(cleanJson);
    } catch (err: any) {
      console.error('Error in hook-generator api:', err);
      res.status(500).json({ error: err.message || 'Internal server error generating hooks.' });
    }
  });

  // API Code Explainer & Translator Endpoint using Gemini 3.5 Flash
  app.post('/api/code-explainer-translator', async (req, res) => {
    try {
      const { mode, code, language, complexity, sourceLanguage, targetLanguage, targetStyle } = req.body;
      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Code block must be a non-empty string.' });
        return;
      }
      if (!mode || (mode !== 'explain' && mode !== 'translate')) {
        res.status(400).json({ error: 'Mode must be either "explain" or "translate".' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      // Initialize the modern GoogleGenAI client with required header
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      let userPrompt = '';
      if (mode === 'explain') {
        userPrompt = `Please explain this script line-by-line or logical block-by-block.
Language: "${language || 'Unspecified/Auto-detect'}"
Explanation Complexity Level: "${complexity || 'detailed'}"

Code Block:
\`\`\`
${code}
\`\`\`

Provide:
1. summary: A high-level overview of what the script does and its overall responsibility.
2. explainedLines: Logical chunks of code, mapped with line ranges, containing a snippet and a clear explanation of what is happening under the hood (focusing on tricky operations, memory, legacy syntax, pointer arithmetic, or potential side-effects).
3. timeComplexity & spaceComplexity: Theoretical complexity analysis.
4. keyConcepts: 2-3 prominent paradigms or computer science topics seen in the script.
5. bugsOrOptimizations: Any bugs, style anti-patterns, security bugs, memory leaks, or execution bottlenecks.`;
      } else {
        userPrompt = `Please translate this code block into the requested target programming language.
Source Language: "${sourceLanguage || 'Unspecified/Auto-detect'}"
Target Language: "${targetLanguage}"
Coding Style/Format Guideline: "${targetStyle || 'idiomatic'}"

Code Block to Translate:
\`\`\`
${code}
\`\`\`

Provide:
1. summary: Brief overview of what was translated.
2. translatedCode: The complete, fully working, correctly indented target language block with syntax conforming to target language guidelines.
3. translationAnnotations: Detailed mapping comparing source code expressions and structures to their counterparts in the target language (e.g., explaining why a pointer was replaced with a reference, or a primitive map replaced with a HashMap).
4. paradigmDifferences: Key conceptual differences (e.g. garbage collection vs manual tracking, strong typing vs duck typing, or event loops vs multithreaded models) between "${sourceLanguage}" and "${targetLanguage}" relevant to this block.`;
      }

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A high-level overview of the script/code block and its core responsibility." },
          explainedLines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                lineRange: { type: Type.STRING, description: "Line numbers or range in the original code, e.g., '1-4' or '12'." },
                codeSnippet: { type: Type.STRING, description: "The corresponding line/lines of code." },
                explanation: { type: Type.STRING, description: "Detailed explanation of what this block does, any hidden gotchas, or legacy context." }
              },
              required: ["lineRange", "codeSnippet", "explanation"]
            },
            description: "Line-by-line or block-by-block logical explanation of the code."
          },
          timeComplexity: { type: Type.STRING, description: "Big O time complexity analysis, e.g., 'O(N log N)' with a short 1-sentence reason." },
          spaceComplexity: { type: Type.STRING, description: "Big O space complexity analysis, e.g., 'O(1)' with a short 1-sentence reason." },
          keyConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 key computer science concepts or syntax quirks utilized (e.g. 'closures', 'pointer arithmetic', 'generator delegation')."
          },
          bugsOrOptimizations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Any bugs, security loopholes, memory leaks, or optimizations found in the original code."
          },
          translatedCode: { type: Type.STRING, description: "The fully translated, working, idiomatic target code block. Leave empty if mode is 'explain'." },
          translationAnnotations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sourceSegment: { type: Type.STRING, description: "Source code chunk." },
                targetSegment: { type: Type.STRING, description: "Corresponding translated code chunk." },
                explanation: { type: Type.STRING, description: "Why the translation was done this way, syntax shifts, or standard library changes." }
              },
              required: ["sourceSegment", "targetSegment", "explanation"]
            },
            description: "Mapping of structural patterns from source to target. Leave empty if mode is 'explain'."
          },
          paradigmDifferences: { type: Type.STRING, description: "Contrast of standard libraries, type safety, performance, or concurrency models between the two languages." }
        },
        required: ["summary"]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an elite, world-class principal system architect and compiler engineer. You explain complex, obscure, obfuscated, or ancient legacy scripts with crystal-clear pedagogical brilliance, and translate algorithms across high-level, system, and assembly languages with flawless idiom, precision, and structural correctness. Return a strict, pristine structure in raw JSON format with no markdown wrappers.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty response.');
      }

      const cleanJson = JSON.parse(result.text.trim());
      res.json(cleanJson);
    } catch (err: any) {
      console.error('Error in code-explainer-translator api:', err);
      res.status(500).json({ error: err.message || 'Internal server error processing code.' });
    }
  });

  // API Schema Generator Endpoint using Gemini 3.5 Flash
  app.post('/api/schema-generator', async (req, res) => {
    try {
      const { schemaType, textPrompt } = req.body;
      if (!textPrompt || typeof textPrompt !== 'string') {
        res.status(400).json({ error: 'Text prompt or raw content must be a non-empty string.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const userPrompt = `Extract or compile a valid JSON-LD SEO schema object based on the details provided.
Desired SchemaType: "${schemaType || 'Article'}"
Source Context & Inputs:
"${textPrompt}"

Your task:
1. Create a fully compliant, rich JSON-LD schema using the @context: "https://schema.org" namespace.
2. Ensure properties are nested, detailed, realistic, and schema-compliant. Include relevant rich-snippet properties (e.g., author names, publisher, price, currency, rating count, reviews, step details, coordinates, breadcrumb URLs, dates, custom nesting, etc.).
3. Return only the flat JSON-LD object itself inside the "schema" key of the response JSON.
4. Provide a 2-3 sentence markdown summary explaining the structured fields generated and any recommended additions. Match the language of the source text if it is not English.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          schemaJson: { type: Type.STRING, description: "The stringified JSON-LD block. Ensure it has correct syntax, escapes, and fits the Google Rich Snippet compliance rules. Start with @context." },
          explanation: { type: Type.STRING, description: "A brief summary explaining the fields populated and some optimization recommendations." }
        },
        required: ["schemaJson", "explanation"]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an elite SEO Search Architecture specialist who specializes in Google Rich Snippets, JSON-LD microdata, Schema.org specifications, and technical search markup. Generate a high-quality schema compilation matching schema.org definitions. Return strict JSON according to the response schema. Never include markdown code wrappers around the schema string itself.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.1
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty response.');
      }

      const cleanJson = JSON.parse(result.text.trim());
      res.json(cleanJson);
    } catch (err: any) {
      console.error('Error in schema-generator api:', err);
      res.status(500).json({ error: err.message || 'Internal server error processing schema compilation.' });
    }
  });

  // API Content-Gap Analyzer Endpoint using Gemini 3.5 Flash
  app.post('/api/content-gap-analyzer', async (req, res) => {
    try {
      const { targetKeyword, ourContent, competitors } = req.body;
      if (!targetKeyword || !ourContent) {
        res.status(400).json({ error: 'Target keyword and your current content/topic are required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const userPrompt = `Compare our content idea/draft against competitors to locate high-value keyword and structural gaps.
Primary Target Keyword: "${targetKeyword}"
Our Current Content/Topic Draft:
"${ourContent}"

Competitors Information:
${JSON.stringify(competitors, null, 2)}

Your task:
1. Identify the Search Intent category, primary intent stage (TOFU/MOFU/BOFU) and user pain points.
2. Formulate a list of high-impact LSI / semantic keywords found in competitor material but missing (or under-represented) in ours.
3. Analyze structural topics or specific sections covered by rivals which we omitted. Evaluate the GAP severity (e.g., High, Medium, Low).
4. Outline 4-5 highly actionable, SEO-focused recommendations to fill these gaps.
5. Provide quantitative scores (Depth Score 1-100) comparing our content draft against competitor materials. Make sure to generate the depth score for our draft first and then each competitor named or specified.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          searchIntent: { type: Type.STRING, description: "Category of research intent e.g. Informational (TOFU), and summary of user behavior." },
          missingKeywords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                keyword: { type: Type.STRING },
                importance: { type: Type.STRING, description: "High/Medium/Critical" },
                rationale: { type: Type.STRING, description: "Why do we need this keyword?" }
              },
              required: ["keyword", "importance", "rationale"]
            }
          },
          structuralGaps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                competitorTopic: { type: Type.STRING, description: "The subtopic or head-to-head title aspect competitors covered well" },
                missedDetail: { type: Type.STRING, description: "What exactly did they write about that we didn't include?" },
                severity: { type: Type.STRING, description: "High/Medium/Low" },
                fillAction: { type: Type.STRING, description: "Draft title or specific suggestion to fill this gap" }
              },
              required: ["competitorTopic", "missedDetail", "severity", "fillAction"]
            }
          },
          scores: {
            type: Type.OBJECT,
            properties: {
              ourScore: { type: Type.INTEGER, description: "Score representing content completeness out of 100" },
              competitorsScores: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nameOrUrl: { type: Type.STRING },
                    score: { type: Type.INTEGER }
                  },
                  required: ["nameOrUrl", "score"]
                }
              }
            },
            required: ["ourScore", "competitorsScores"]
          },
          actionPlan: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Step by step list of guidelines to revise or upgrade our material to rank above competitors."
          }
        },
        required: ["searchIntent", "missingKeywords", "structuralGaps", "scores", "actionPlan"]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an absolute grandmaster Content Strategist and Competition SEO Auditing wizard. Your specialty is taking raw text drafts, extracting structural outline hierarchies, mapping semantic gaps, and detailing exact actions to dominate search engine results. Return strictly correct JSON adhering to the specified return structure.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty response.');
      }

      res.json(JSON.parse(result.text.trim()));
    } catch (err: any) {
      console.error('Error in content-gap analyzer:', err);
      res.status(500).json({ error: err.message || 'Internal server error processing content gap analysis.' });
    }
  });

  // API Keyword Cluster & Semantic Mapping Endpoint using Gemini 3.5 Flash
  app.post('/api/keyword-cluster', async (req, res) => {
    try {
      const { rawKeywords, groupingSensitivity, includeSearchIntent } = req.body;
      if (!rawKeywords || !rawKeywords.trim()) {
        res.status(400).json({ error: 'At least one keyword/list of terms is required to perform clustering.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please verify the Secrets panel in Settings.' 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const userPrompt = `Perform an advanced keyword clustering and semantic map compilation.
Raw input terms/keywords:
"${rawKeywords}"

Settings:
Grouping Sensitivity: ${groupingSensitivity || 'medium'}
Analyze Search Intent: ${includeSearchIntent !== false ? 'Yes' : 'No'}

Instructions:
1. Parse each keyword from the raw query. If raw queries are unorganized fragments, compile them into cohesive target keywords.
2. Group related items into semantic "clusters" matching the grouping sensitivity. For broad, group them into high-level categories; for tight, separate elements with slight semantic distance into minor narrow clusters.
3. For each cluster, define a strong visual parent clusterName, evaluate the Core Search Intent & stage, estimate monthly search volumes, assign keyword difficulties (Low/Medium/High), and flag whether the term is a Core or Secondary keyword for that cluster.
4. Construct a content-marketing layout: propose a recommended page title and visual H2 Article Outline headings representing how a writer should address the topic to rank effectively.
5. Provide a summary of the topical map and a percentage or item count distribution across the TOFU (Top of Funnel/Informational), MOFU (Middle of Funnel/Evaluation), and BOFU (Bottom of Funnel/Action/Transactional) lifecycle stages.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          clusters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                clusterName: { type: Type.STRING, description: "High-level theme or semantic hub title" },
                coreIntent: { type: Type.STRING, description: "E.g. Informational (TOFU), Commercial (MOFU), Transactional (BOFU)" },
                keywords: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      keyword: { type: Type.STRING },
                      volume: { type: Type.INTEGER, description: "Estimated monthly search volume (realistic standard)" },
                      difficulty: { type: Type.STRING, description: "Low / Medium / High" },
                      relevance: { type: Type.STRING, description: "Core / Secondary / LSI" }
                    },
                    required: ["keyword", "volume", "difficulty", "relevance"]
                  }
                },
                recommendedTitle: { type: Type.STRING, description: "Suggested H1 or Page Title matching this cluster" },
                articleStructureOutline: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of H2 subtopics to cover in a comprehensive article/page for this cluster"
                }
              },
              required: ["clusterName", "coreIntent", "keywords", "recommendedTitle", "articleStructureOutline"]
            }
          },
          topicalMapSummary: { type: Type.STRING, description: "Strategic summary detailing how these semantic groups construct a robust topical map" },
          keywordFunnelDist: {
            type: Type.OBJECT,
            properties: {
              tofu: { type: Type.INTEGER, description: "TOFU distribution value (sum to 100 or raw item levels)" },
              mofu: { type: Type.INTEGER, description: "MOFU distribution value (sum to 100 or raw item levels)" },
              bofu: { type: Type.INTEGER, description: "BOFU distribution value (sum to 100 or raw item levels)" }
            },
            required: ["tofu", "mofu", "bofu"]
          }
        },
        required: ["clusters", "topicalMapSummary", "keywordFunnelDist"]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an elite Senior On-Page Architect, SEO Data Scientist, and Semantic Core Engineer. You group arbitrary search words into clean visual topical siloing systems, calculating intent matrices and returning valid structural JSON outputs according to responseSchema rules.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.1
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty output stream.');
      }

      res.json(JSON.parse(result.text.trim()));
    } catch (err: any) {
      console.error('Error in keyword cluster api:', err);
      res.status(500).json({ error: err.message || 'Internal server error during keyword clustering execution.' });
    }
  });

  // API SERP Snippet CTR Optimizer Endpoint using Gemini 3.5 Flash
  app.post('/api/serp-optimizer', async (req, res) => {
    try {
      const { title, description, keywords, url, tone } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const userPrompt = `You are a world-class SEO specialist and copywriting grandmaster. Analyze the following Google SERP snippet data and provide search-optimized CTR improvements.

Inputs:
- Current Title: "${title || ''}"
- Current Description: "${description || ''}"
- Focus Keywords: "${keywords || ''}"
- Page URL: "${url || ''}"
- Desired Style/Tone for Suggestions: "${tone || 'balanced'}"

Tasks:
1. Provide an overall SEO Audit Score (0 to 100) for the current title, description, and keywords.
2. Formulate 3-4 distinct actionable feedback points (auditFeedback) on length, keyword density, and appeal.
3. Suggest 4 highly optimized alternative Page Titles (under 60 characters / 600px width equivalent) utilizing copywriting tricks (like numbers, emotional hooks, curiosity gaps, or bracketed content). Match the requested tone: "${tone || 'balanced'}".
4. Suggest 3 highly optimized alternative Meta Descriptions (under 155 characters / 960px width equivalent) with compelling calls-to-action.
5. Provide a quick keyword analysis mapping focus terms to where they are present and actionable tips.

Ensure suggested titles are under 60 characters and descriptions are under 155 characters. Keep explanations punchy and focused on boosting the CTR (Click-Through Rate).`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          seoAuditScore: { type: Type.INTEGER, description: "A comprehensive SEO and CTR audit score out of 100." },
          auditFeedback: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Detailed bullet points of feedback regarding character limits, title appeal, keywords, and call to action."
          },
          titleSuggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The optimized title, under 60 characters." },
                ctrBoostReason: { type: Type.STRING, description: "A short, professional explanation of the psychological or SEO copywriting hook used." }
              },
              required: ["text", "ctrBoostReason"]
            }
          },
          descriptionSuggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The optimized description, under 155 characters." },
                ctrBoostReason: { type: Type.STRING, description: "A short professional explanation of why this description drives action." }
              },
              required: ["text", "ctrBoostReason"]
            }
          },
          keywordAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                keyword: { type: Type.STRING },
                foundInTitle: { type: Type.BOOLEAN },
                foundInDescription: { type: Type.BOOLEAN },
                recommendation: { type: Type.STRING }
              },
              required: ["keyword", "foundInTitle", "foundInDescription", "recommendation"]
            }
          }
        },
        required: ["seoAuditScore", "auditFeedback", "titleSuggestions", "descriptionSuggestions", "keywordAnalysis"]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an elite, world-class SERP snippet optimizer, organic search click-through rate specialist, and search-marketing copywriter. You generate highly clickable, compliant titles and meta descriptions that align focus keywords with human interest. Return strictly valid JSON adhering to the specified response schema with no markdown block wrappers.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.7
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty output.');
      }

      res.json(JSON.parse(result.text.trim()));
    } catch (err: any) {
      console.error('Error in serp-optimizer api:', err);
      res.status(500).json({ error: err.message || 'Internal server error during SERP optimization analysis.' });
    }
  });

  // API endpoints
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // API PDF Encryption & Access Restriction Endpoint
  app.post('/api/encrypt-pdf', async (req, res) => {
    let tempInput = '';
    let tempOutput = '';
    try {
      const { pdfBase64, userPassword, ownerPassword, perms } = req.body;
      if (!pdfBase64) {
        res.status(400).json({ error: 'pdfBase64 string is required.' });
        return;
      }

      // Convert base64 back to Buffer
      const buffer = Buffer.from(pdfBase64, 'base64');

      // Create unique temporary file paths
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const fs = await import('fs');
      const path = await import('path');
      tempInput = path.join('/tmp', `input-${uniqueId}.pdf`);
      tempOutput = path.join('/tmp', `output-${uniqueId}.pdf`);

      // Write the buffer to the temporary input file
      fs.writeFileSync(tempInput, buffer);

      // Import muhammara dynamically to ensure it loads cleanly
      const muhammara = (await import('muhammara')).default;

      // Handle user protection flags for permissions
      let flag = -4; // Default fully-allowed (0xFFFFFFFC)
      if (perms) {
        if (perms.restrictPrinting) flag &= ~4;
        if (perms.restrictModifying) flag &= ~8;
        if (perms.restrictCopying) flag &= ~16;
        if (perms.restrictAnnotating) flag &= ~32;
      }

      // Execute PDF recryption
      muhammara.recrypt(tempInput, tempOutput, {
        userPassword: userPassword || '',
        ownerPassword: ownerPassword || '',
        userProtectionFlag: flag
      });

      // Read the encrypted file back and convert to base64
      if (fs.existsSync(tempOutput)) {
        const encryptedBuffer = fs.readFileSync(tempOutput);
        const encryptedBase64 = encryptedBuffer.toString('base64');
        res.json({ pdfBase64: encryptedBase64 });
      } else {
        throw new Error('Encryption process completed but output file could not be generated.');
      }
    } catch (err: any) {
      console.error('Error encrypting PDF:', err);
      res.status(500).json({ error: err.message || 'Verification and encryption of PDF file failed.' });
    } finally {
      // Robust clean up of disk streams to preserve privacy and memory footprint
      try {
        const fs = await import('fs');
        if (tempInput && fs.existsSync(tempInput)) {
          fs.unlinkSync(tempInput);
        }
        if (tempOutput && fs.existsSync(tempOutput)) {
          fs.unlinkSync(tempOutput);
        }
      } catch (cleanErr) {
        console.error('Secondary error cleaning temporary pdf files:', cleanErr);
      }
    }
  });

  // Helper to chunk text safely for TTS requests (limit 200 chars)
  function chunkText(text: string, maxLen: number = 200): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if ((currentChunk + ' ' + trimmed).length <= maxLen) {
        currentChunk = currentChunk ? (currentChunk + ' ' + trimmed) : trimmed;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        // If a single sentence is extremely long, split it by spaces
        if (trimmed.length > maxLen) {
          const words = trimmed.split(/\s+/);
          let wordChunk = '';
          for (const word of words) {
            if ((wordChunk + ' ' + word).length <= maxLen) {
              wordChunk = wordChunk ? (wordChunk + ' ' + word) : word;
            } else {
              if (wordChunk) chunks.push(wordChunk);
              wordChunk = word;
            }
          }
          if (wordChunk) {
            currentChunk = wordChunk;
          } else {
            currentChunk = '';
          }
        } else {
          currentChunk = trimmed;
        }
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    return chunks;
  }

  // API Text-To-Speech audio download endpoint (concatenates audio streams into high-quality MP3)
  app.post('/api/tts-download', async (req, res) => {
    try {
      const { text, title } = req.body;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text content is required' });
        return;
      }

      // Chunk the narration text to stay within Translate TTS API limits (safely below 200)
      const chunks = chunkText(text, 180);
      const buffers: Buffer[] = [];

      // Limit length to avoid infinite/extremely long fetches (safely max out at 60 chunks)
      const activeChunks = chunks.slice(0, 60);

      for (const chunk of activeChunks) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=en&client=tw-ob`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch TTS segment from provider (status ${response.status})`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffers.push(Buffer.from(arrayBuffer));
        
        // Politeness delay to prevent rate-limiting triggers
        await new Promise(resolve => setTimeout(resolve, 80));
      }

      if (buffers.length === 0) {
        res.status(400).json({ error: 'No audio segments were successfully synthesized.' });
        return;
      }

      const combinedBuffer = Buffer.concat(buffers);
      const safeTitle = (title || 'narration')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle || 'narration'}.mp3"`);
      res.send(combinedBuffer);
    } catch (error: any) {
      console.error('Error generating TTS download:', error);
      res.status(500).json({ error: error.message || 'Failed to generate and synthesize audio download' });
    }
  });

  // API Summarize Article Endpoint using Gemini 3.5 Flash (3-bullet TL;DR summary)
  app.post('/api/summarize-article', async (req, res) => {
    try {
      const { title, summary, content } = req.body;
      if (!title || !content || !Array.isArray(content)) {
        res.status(400).json({ error: 'Article title and content array are required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const articleText = `Title: ${title}\nSummary: ${summary || ''}\n\nContent:\n${content.join('\n')}`;
      const userPrompt = `Analyze the tech and compliance article below and generate a pristine, high-impact TL;DR summarizing it.
Your summary MUST consist of exactly 3 concise, actionable bullet points. Each bullet point should be professional, clear, and highlight a critical takeaway or compliance standard from the article.

Article text:
"""
${articleText}
"""`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          bullets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 3 concise bullet points summarizing the key takeaways."
          }
        },
        required: ["bullets"]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an elite research summarizer and compliance expert. Create a precise, high-impact, 3-bullet TL;DR summary from the provided technical article. Return strictly correct JSON matching the response schema. Keep bullets professional, concise, and direct with no conversational intro.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.3
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty output.');
      }

      res.json(JSON.parse(result.text.trim()));
    } catch (err: any) {
      console.error('Error in summarize-article api:', err);
      res.status(500).json({ error: err.message || 'Internal server error during summarization.' });
    }
  });

  // API Image Alt-Text Generator Endpoint using Gemini 3.5 Flash
  app.post('/api/alt-text-generator', async (req, res) => {
    try {
      const { image, mimeType, keyword, context, tone } = req.body;
      if (!image || typeof image !== 'string') {
        res.status(400).json({ error: 'Image content in base64 format is required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      // Safe base64 parsing and mime type extraction
      let base64Data = image;
      let resolvedMimeType = mimeType || 'image/jpeg';
      if (image.includes(';base64,')) {
        const parts = image.split(';base64,');
        base64Data = parts[1];
        const mimePart = parts[0];
        if (mimePart.startsWith('data:')) {
          resolvedMimeType = mimePart.substring(5);
        }
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const userPrompt = `Analyze this image and generate highly professional, search-engine optimized (SEO), and accessible web-ready alternative text (alt-text) attributes.
${keyword ? `Optimize one of the alt text fields specifically around this target keyword: "${keyword}" (make it natural and relevant).` : ''}
${context ? `The image is being used in this context on the webpage: "${context}". Ensure the descriptions reflect this.` : ''}
${tone ? `Apply a "${tone}" tone or style to the generated descriptions where suitable.` : ''}

Provide a structured, detailed visual analysis including:
1. Screen-reader friendly 'shortAltText' (<125 characters, highly functional, no fluffy 'image of' intros).
2. Descriptive 'detailedAltText' (125-250 characters, capturing setting, colors, atmosphere).
3. 'keywordOptimizedAltText' (naturally integrating the target keyword "${keyword || 'relevant terms'}" into a high-quality alt attribute).
4. An SEO-optimized, lowercase, hyphen-separated 'suggestedFileName' (preserving the correct file extension based on MIME type: "${resolvedMimeType}").
5. A list of 5 to 8 recommended LSI keywords or semantic search terms.
6. A Boolean flag 'isDecorative' indicating if the image appears to be purely visual clutter/spacer/background.
7. A visual elements breakdown (primary subject, secondary objects, detected colors, detected text, setting).
8. 3 to 4 technical SEO/accessibility recommendations.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          shortAltText: { type: Type.STRING },
          detailedAltText: { type: Type.STRING },
          keywordOptimizedAltText: { type: Type.STRING },
          suggestedFileName: { type: Type.STRING },
          recommendedKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          isDecorative: { type: Type.BOOLEAN },
          visualAnalysis: {
            type: Type.OBJECT,
            properties: {
              primarySubject: { type: Type.STRING },
              secondaryObjects: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              detectedColors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              detectedText: { type: Type.STRING },
              settingOrContext: { type: Type.STRING }
            },
            required: ["primarySubject", "secondaryObjects", "detectedColors", "detectedText", "settingOrContext"]
          },
          seoRecommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: [
          "shortAltText",
          "detailedAltText",
          "keywordOptimizedAltText",
          "suggestedFileName",
          "recommendedKeywords",
          "isDecorative",
          "visualAnalysis",
          "seoRecommendations"
        ]
      };

      const imagePart = {
        inlineData: {
          mimeType: resolvedMimeType,
          data: base64Data
        }
      };

      const textPart = {
        text: userPrompt
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction: 'You are an elite SEO auditor, senior On-Page content architect, and accessibility compliance engineer (WCAG 2.2). Your specialty is auditing web images to produce descriptive, contextual, and highly optimized alt tags and filenames. You return strictly formatted JSON following the responseSchema rules.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty description output.');
      }

      res.json(JSON.parse(result.text.trim()));
    } catch (err: any) {
      console.error('Error in alt-text-generator API:', err);
      res.status(500).json({ error: err.message || 'Internal server error during visual alt-text generation.' });
    }
  });

  // API SEO Keyword Difficulty Checker using Gemini 3.5 Flash
  app.post('/api/keyword-difficulty', async (req, res) => {
    try {
      const { keyword, geoCountry, platform } = req.body;
      if (!keyword || typeof keyword !== 'string') {
        res.status(400).json({ error: 'Target keyword parameter is required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const userPrompt = `Conduct a rigorous, deep SEO audit, search intent mapping, and simulated SERP landscape analysis for the keyword: "${keyword.trim()}".
Platform/Device target context: "${platform || 'Desktop'}".
Geographic search territory context: "${geoCountry || 'Global/US'}".

You must evaluate and return:
1. An overall 'difficultyScore' between 0 and 100 based on simulated domain/page strengths and keyword density of ranking players.
2. A matching 'difficultyCategory' (e.g., "Easy", "Medium", "Hard", "Very Hard") and 'difficultyColor' (hex colors like "#22c55e" for easy, "#eab308" for medium, "#f97316" for hard, "#ef4444" for very hard).
3. Estimated monthly 'searchVolume' in search engines (formatted string like "12,500" or "450").
4. High-fidelity 'searchIntent' classification (e.g., "Informational", "Transactional", "Commercial", "Navigational").
5. 'searchIntentDescription' highlighting exactly what the user is seeking.
6. A realistic Cost-Per-Click 'cpc' in USD (e.g. "$1.25", "$0.00").
7. A competitive 'competitionLevel' index (e.g., "Low", "Medium", "High").
8. 12-month search 'trendData' array representing seasonal interest indexes from 0 to 100, starting from Jan to Dec.
9. A highly realistic simulation of the Top 5 search engine results ('serpResults'), including title, ranking page url, Page Authority (0-100), Domain Authority (0-100), estimated page backlinks, an on-page content rating ("Poor", "Moderate", "Excellent"), and a concise snippet highlighting why it ranks.
10. A list of 5-8 LSI Keywords or semantic search terms.
11. A list of 5 concrete SEO recommendations / action plan tasks to successfully rank for this keyword.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          difficultyScore: { type: Type.INTEGER },
          difficultyCategory: { type: Type.STRING },
          difficultyColor: { type: Type.STRING },
          searchVolume: { type: Type.STRING },
          searchIntent: { type: Type.STRING },
          searchIntentDescription: { type: Type.STRING },
          cpc: { type: Type.STRING },
          competitionLevel: { type: Type.STRING },
          trendData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                index: { type: Type.INTEGER }
              },
              required: ["month", "index"]
            }
          },
          serpResults: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                rank: { type: Type.INTEGER },
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                domainAuthority: { type: Type.INTEGER },
                pageAuthority: { type: Type.INTEGER },
                backlinks: { type: Type.INTEGER },
                onPageOptimization: { type: Type.STRING },
                contentSnippet: { type: Type.STRING }
              },
              required: ["rank", "title", "url", "domainAuthority", "pageAuthority", "backlinks", "onPageOptimization", "contentSnippet"]
            }
          },
          seoRecommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          lsiKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: [
          "keyword",
          "difficultyScore",
          "difficultyCategory",
          "difficultyColor",
          "searchVolume",
          "searchIntent",
          "searchIntentDescription",
          "cpc",
          "competitionLevel",
          "trendData",
          "serpResults",
          "seoRecommendations",
          "lsiKeywords"
        ]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an advanced search intelligence backend, senior on-page SEO architect, and search engine analyst. You possess deep knowledge of search engines, PageRank vectors, link authorities (Page Authority/Domain Authority profiles), and latent user search intent patterns. You generate accurate simulated SERP audits in structured JSON adhering precisely to the required responseSchema rules.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.3
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty output during keyword assessment.');
      }

      res.json(JSON.parse(result.text.trim()));
    } catch (err: any) {
      console.error('Error in keyword-difficulty API:', err);
      res.status(500).json({ error: err.message || 'Internal server error during search engine intelligence calculations.' });
    }
  });

  // API: URL Slugifier SEO Analyzer
  app.post('/api/url-slugifier', async (req, res) => {
    try {
      const { 
        title, 
        lowercase, 
        replaceSpaces, 
        removeSpecial, 
        stripStopWords, 
        maxLength, 
        targetKeyword, 
        addSuffix, 
        customInstructions 
      } = req.body;

      if (!title || typeof title !== 'string') {
        res.status(400).json({ error: 'Title parameter is required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Simple local baseline helper to create a local baseline slug
      let localSlug = title.trim();
      if (lowercase !== false) {
        localSlug = localSlug.toLowerCase();
      }
      
      // Remove diacritics / accents
      localSlug = localSlug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (removeSpecial !== false) {
        // Remove special characters, keep alphanumeric, spaces, and hyphens/underscores
        localSlug = localSlug.replace(/[^a-zA-Z0-9\s-_]/g, '');
      }

      if (replaceSpaces !== false) {
        localSlug = localSlug.replace(/[\s_]+/g, '-');
      } else {
        localSlug = localSlug.replace(/\s+/g, '-');
      }

      // Cleanup multi-hyphens and leading/trailing
      localSlug = localSlug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

      if (maxLength && typeof maxLength === 'number' && maxLength > 0) {
        localSlug = localSlug.substring(0, maxLength).replace(/-+$/g, '');
      }

      if (addSuffix && typeof addSuffix === 'string' && addSuffix.trim() !== '') {
        const cleanSuffix = addSuffix.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '').replace(/\s+/g, '-');
        if (cleanSuffix) {
          localSlug = `${localSlug}-${cleanSuffix}`;
        }
      }

      const userPrompt = `You are a professional search engine optimization expert specializing in high-performance URL structure design, permalinks, and keyword routing.
Create a series of SEO-optimized, URL-friendly slugs for the following blog/post/page title:

Title: "${title.trim()}"
Baseline Standard Slug: "${localSlug}"
Target Keyword context (optional): "${targetKeyword || 'None specified'}"
Max Length constraint: ${maxLength || 'No limit'}
Strip Stopwords rule enabled: ${stripStopWords ? 'Yes' : 'No'}
Custom Instructions/Constraints: "${customInstructions || 'None specified'}"

Please analyze and generate:
1. 'seoOptimizedSlug': A highly refined slug targeting search engines. If 'Strip Stopwords' is enabled, strip low-value grammatical particles (like "and", "the", "a", "or", "is", "in", "with", "to", "for", "on", "of", "how-to", "why", "what") to keep it highly concise and punchy. Prioritize target keywords if provided.
2. 'minimalSlug': An ultra-short, minimalist 2-3 word slug capturing only the high-value nouns/verbs.
3. 'engagementSlug': A click-optimized version that is punchy, high-interest, and ideal for social media or newsletter tracking.
4. 'transliteratedSlug': If the title contains non-English characters (e.g. Spanish, German, Hindi, Arabic, Chinese), translate the concepts to clean, fluent, URL-friendly English slugs. If already in English, return a perfectly optimized synonym-based alternative slug.
5. 'seoAnalysis': A technical report card assessing the baseline standard slug. Provide a score (0 to 100), length evaluation, stopword count, a readability label ("High", "Moderate", "Low"), and 2-3 specific, actionable recommendations for slug optimization.
6. 'variations': A list of 3-4 other creative, high-quality URL-friendly slug options that target different SEO keyword angles.

All generated slugs must be lowercase, use hyphens instead of spaces, remove diacritics/special characters, and have any trailing/leading hyphens trimmed. Ensure they adhere to any provided max length constraints.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          originalTitle: { type: Type.STRING },
          standardSlug: { type: Type.STRING },
          seoOptimizedSlug: { type: Type.STRING },
          minimalSlug: { type: Type.STRING },
          engagementSlug: { type: Type.STRING },
          transliteratedSlug: { type: Type.STRING },
          seoAnalysis: {
            type: Type.OBJECT,
            properties: {
              lengthCheck: { type: Type.STRING },
              score: { type: Type.INTEGER },
              stopwordCount: { type: Type.INTEGER },
              readability: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["lengthCheck", "score", "stopwordCount", "readability", "recommendations"]
          },
          variations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: [
          "originalTitle",
          "standardSlug",
          "seoOptimizedSlug",
          "minimalSlug",
          "engagementSlug",
          "transliteratedSlug",
          "seoAnalysis",
          "variations"
        ]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an advanced SEO Slug Architect. You analyze textual titles and craft beautiful, clean, semantic, and highly indexable URLs. You do not explain or write markdown text outside the JSON structure. Return only valid JSON conforming strictly to the responseSchema.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty output during URL slugification.');
      }

      res.json(JSON.parse(result.text.trim()));
    } catch (err: any) {
      console.error('Error in url-slugifier API:', err);
      res.status(500).json({ error: err.message || 'Internal server error during URL slugification calculations.' });
    }
  });

  // API: SEO Optimizer and Inspector Assistant
  app.post('/api/seo/optimize', async (req, res) => {
    try {
      const { action, text, targetKeyword, targetDensity, title } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      let systemInstruction = 'You are an elite, senior SEO copywriter and on-page optimization expert.';
      let userPrompt = '';
      let responseMimeType = 'text/plain';
      let responseSchema: any = undefined;

      if (action === 'rewrite_keyword') {
        userPrompt = `Please rewrite the following copy to naturally and seamlessly integrate the focus keyword "${targetKeyword || ''}" so it achieves an optimal density of approximately ${targetDensity || '2'}% (count of focus keyword / total words). Keep the content informative, professional, and matching the original tone. Do not stuff keywords. Return only the rewritten text.
        
Copy:
"${text || ''}"`;
      } else if (action === 'improve_readability') {
        userPrompt = `Please optimize the following copy to dramatically improve its Flesch Reading Ease and Flesch-Kincaid readability marks. Use active voice, shorter sentences (aim for under 20 words per sentence), simpler vocabulary, and clear structural hierarchies while preserving all core factual arguments and professional tone. Return only the improved text.

Copy:
"${text || ''}"`;
      } else if (action === 'autofill_meta') {
        systemInstruction = 'You are an elite search click-through rate (CTR) optimizer. You return strictly formatted JSON following the responseSchema rules.';
        responseMimeType = 'application/json';
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'An optimized page title, 30-60 characters.' },
            description: { type: Type.STRING, description: 'An engaging meta description, 75-160 characters.' }
          },
          required: ['title', 'description']
        };
        userPrompt = `Given the following body content and focus keyword, generate a high-performing page SEO Title (30-60 characters) and a click-optimized Meta Description (75-160 characters) that naturally highlights the keyword.

Focus Keyword: "${targetKeyword || ''}"
Content Body:
"${text || ''}"`;
      } else if (action === 'suggest_keywords') {
        systemInstruction = 'You are a veteran search analyst and keyword research director. You return strictly formatted JSON following the responseSchema rules.';
        responseMimeType = 'application/json';
        responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              rationale: { type: Type.STRING }
            },
            required: ['keyword', 'rationale']
          }
        };
        userPrompt = `Analyze the following webpage copy to extract 5 high-value, high-intent LSI (Latent Semantic Indexing) keyword suggestions or search terms that align perfectly with the context, along with a brief technical rationale for targeting each.

Content:
"${text || ''}"`;
      } else if (action === 'generate_variations') {
        systemInstruction = 'You are an advanced A/B testing copywriter specializing in search snippets. You return strictly formatted JSON following the responseSchema rules.';
        responseMimeType = 'application/json';
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            descriptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['titles', 'descriptions']
        };
        userPrompt = `Given the webpage page reference content, generate a series of 3 high-performance variations for the page title and 3 variations for the meta description. Make sure they are click-optimized, benefit-driven, and highly engaging.

Target Keyword: "${targetKeyword || ''}"
Content:
"${text || ''}"`;
      } else if (action === 'suggest_slug') {
        systemInstruction = 'You are an elite URL architecture specialist. You return strictly formatted JSON following the responseSchema rules.';
        responseMimeType = 'application/json';
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            slug: { type: Type.STRING, description: 'A lowercase, hyphen-separated, keyword-optimized URL slug.' }
          },
          required: ['slug']
        };
        userPrompt = `Given the page title and focus keyword below, generate a single, highly optimized, lowercase, hyphenated URL slug.
Rules:
1. It must contain only lowercase letters, numbers, and hyphens (no spaces, special characters, or underscores).
2. It must be keyword-optimized, prioritizing the focus keyword if relevant.
3. Strip out low-value grammatical particles (like "and", "the", "a", "or", "is", "in", "with", "to", "for", "on", "of", "how-to", "why", "what") to keep it concise.
4. Keep it clean and natural.

Page Title: "${title || ''}"
Focus Keyword: "${targetKeyword || ''}"`;
      } else if (action === 'slug_keywords') {
        systemInstruction = 'You are an expert SEO copywriter and URL keyword architect. You analyze a webpage title and return strictly formatted JSON matching the responseSchema.';
        responseMimeType = 'application/json';
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING, description: 'A suggested keyword or short phrase to include in the URL slug.' },
                  rationale: { type: Type.STRING, description: 'Short technical rationale of why this keyword is high-ranking or beneficial for search CTR.' }
                },
                required: ['keyword', 'rationale']
              }
            }
          },
          required: ['suggestions']
        };
        userPrompt = `Given the webpage/article title below, suggest 4 high-ranking keywords or short keyword variations that are highly optimized for a search-friendly URL slug. For each suggestion, provide a concise technical SEO rationale.
        
Page Title: "${title || ''}"`;
      } else {
        res.status(400).json({ error: `Unsupported action parameter: ${action}` });
        return;
      }

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType,
          responseSchema,
          temperature: 0.3
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty output during SEO processing.');
      }

      const cleanText = result.text.trim();
      res.json({ text: cleanText });
    } catch (err: any) {
      console.error('Error in /api/seo/optimize API:', err);
      res.status(500).json({ error: err.message || 'Internal server error during SEO optimization.' });
    }
  });

  // API: Meta Tag Auditor
  app.post('/api/meta-tag-auditor', async (req, res) => {
    try {
      let { url, html } = req.body;

      if (!url && !html) {
        res.status(400).json({ error: 'Either a valid URL or raw HTML code must be provided.' });
        return;
      }

      let source = 'pasted_html';
      let fetchedUrl = url || '';

      if (url && !html) {
        source = 'fetched_url';
        // Add protocol if missing
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
          fetchedUrl = url;
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const fetchResponse = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!fetchResponse.ok) {
            throw new Error(`Server responded with HTTP status ${fetchResponse.status}`);
          }

          html = await fetchResponse.text();
        } catch (fetchErr: any) {
          console.error(`Fetch error for URL ${url}:`, fetchErr);
          res.status(422).json({ 
            error: `Could not load the URL. Connection failed, timed out, or blocked by the server: ${fetchErr.message}. You can still copy and paste the page source HTML below to run the audit instantly!` 
          });
          return;
        }
      }

      // Safeguard: trim HTML if huge
      if (html.length > 800000) {
        html = html.substring(0, 800000);
      }

      // Extract Head Block
      const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      const headContent = headMatch ? headMatch[1] : html.substring(0, 150000);

      // Simple regex parser to extract structured tags so we can pass them cleaner to Gemini
      // and display them in a list
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const extractedTitle = titleMatch ? titleMatch[1].trim() : '';

      // Extract raw meta tag properties for visual report in the frontend
      const metaTags: Array<{ name?: string; property?: string; content?: string; httpEquiv?: string; raw: string }> = [];
      const metaRegex = /<meta\s+([^>]*?)>/gi;
      let match;
      while ((match = metaRegex.exec(headContent)) !== null && metaTags.length < 100) {
        const rawTag = match[0];
        const attrsStr = match[1];
        const attrs: Record<string, string> = {};
        const attrRegex = /([a-zA-Z0-9:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
          const key = attrMatch[1].toLowerCase();
          const val = attrMatch[2] || attrMatch[3] || attrMatch[4] || '';
          attrs[key] = val;
        }
        metaTags.push({
          name: attrs['name'],
          property: attrs['property'],
          content: attrs['content'],
          httpEquiv: attrs['http-equiv'],
          raw: rawTag
        });
      }

      // Find Canonical links
      const links: Array<{ rel?: string; href?: string; raw: string }> = [];
      const linkRegex = /<link\s+([^>]*?)>/gi;
      while ((match = linkRegex.exec(headContent)) !== null && links.length < 50) {
        const rawTag = match[0];
        const attrsStr = match[1];
        const attrs: Record<string, string> = {};
        const attrRegex = /([a-zA-Z0-9:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
          const key = attrMatch[1].toLowerCase();
          const val = attrMatch[2] || attrMatch[3] || attrMatch[4] || '';
          attrs[key] = val;
        }
        if (attrs['rel'] || attrs['href']) {
          links.push({
            rel: attrs['rel'],
            href: attrs['href'],
            raw: rawTag
          });
        }
      }

      // Build compact summary of tags for Gemini prompt
      const metaSummary = metaTags.map(t => {
        const ident = t.name ? `name="${t.name}"` : t.property ? `property="${t.property}"` : t.httpEquiv ? `http-equiv="${t.httpEquiv}"` : '';
        return ident ? `<meta ${ident} content="${t.content || ''}">` : t.raw;
      }).join('\n');

      const linkSummary = links.map(l => `<link rel="${l.rel || ''}" href="${l.href || ''}">`).join('\n');

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const userPrompt = `You are a world-class Technical SEO Auditor and Social Sharing preview expert.
Analyze the following webpage tags extracted from ${fetchedUrl ? `URL: "${fetchedUrl}"` : 'pasted HTML code'}:

Webpage Title Tag: "${extractedTitle || 'None found'}"

Extracted Meta Tags:
${metaSummary || 'No meta tags found'}

Extracted Link Tags:
${linkSummary || 'No link tags found'}

Please audit this head metadata against best-practices:
1. Canonical Link: Check if rel="canonical" is present. Is it absolute? Does it look structurally valid? If the source is URL "${fetchedUrl}", does the canonical match the source URL?
2. Viewport: Check if <meta name="viewport"> is present. Does it configure layout correctly (width=device-width, initial-scale=1)? Does it improperly restrict user scalability (which is an accessibility issue)?
3. OpenGraph & Twitter Tags: Check for presence of: og:title, og:description, og:image, og:url, og:site_name, og:type, twitter:card, twitter:title, twitter:description, twitter:image. Give scores, list present and missing elements.
4. Traditional SEO: Check title length (ideal 50-60 chars) and meta description length (ideal 120-160 chars).
5. Calculate overall score (0 to 100), overall grade, and generate actionable recommendations with priority levels ("High", "Medium", "Low") detailing the issue and clear fix guidelines.
6. Provide a consolidated, optimized "socialPreview" block, which combines the best tags or provides smart fallbacks if the original is empty or missing. For socialPreview.image, if none exists, return an empty string or suggest a default mock placeholder (like a solid colored template).

Analyze deeply and return a strict JSON payload conforming exactly to the responseSchema.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          canonicalUrl: { type: Type.STRING },
          viewport: { type: Type.STRING },
          openGraphStatus: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              presentTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              assessment: { type: Type.STRING }
            },
            required: ["score", "presentTags", "missingTags", "assessment"]
          },
          canonicalStatus: {
            type: Type.OBJECT,
            properties: {
              isPresent: { type: Type.BOOLEAN },
              isValid: { type: Type.BOOLEAN },
              urlFound: { type: Type.STRING },
              assessment: { type: Type.STRING }
            },
            required: ["isPresent", "isValid", "urlFound", "assessment"]
          },
          viewportStatus: {
            type: Type.OBJECT,
            properties: {
              isPresent: { type: Type.BOOLEAN },
              isResponsive: { type: Type.BOOLEAN },
              valueFound: { type: Type.STRING },
              assessment: { type: Type.STRING }
            },
            required: ["isPresent", "isResponsive", "valueFound", "assessment"]
          },
          seoStatus: {
            type: Type.OBJECT,
            properties: {
              titleLength: { type: Type.INTEGER },
              titleAssessment: { type: Type.STRING },
              descriptionLength: { type: Type.INTEGER },
              descriptionAssessment: { type: Type.STRING }
            },
            required: ["titleLength", "titleAssessment", "descriptionLength", "descriptionAssessment"]
          },
          totalScore: { type: Type.INTEGER },
          overallGrade: { type: Type.STRING },
          overallSummary: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                priority: { type: Type.STRING },
                title: { type: Type.STRING },
                issue: { type: Type.STRING },
                fix: { type: Type.STRING }
              },
              required: ["category", "priority", "title", "issue", "fix"]
            }
          },
          socialPreview: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              image: { type: Type.STRING },
              siteName: { type: Type.STRING },
              twitterCard: { type: Type.STRING }
            },
            required: ["title", "description", "image", "siteName", "twitterCard"]
          }
        },
        required: [
          "title",
          "description",
          "canonicalUrl",
          "viewport",
          "openGraphStatus",
          "canonicalStatus",
          "viewportStatus",
          "seoStatus",
          "totalScore",
          "overallGrade",
          "overallSummary",
          "recommendations",
          "socialPreview"
        ]
      };

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an elite, highly critical Technical SEO Auditor and Webmaster. You return a JSON-structured tag-by-tag audit. You do not explain or write markdown text outside the JSON structure. Return only valid JSON conforming strictly to the responseSchema.',
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.1
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty output during Meta Tag Audit.');
      }

      const parsedAudit = JSON.parse(result.text.trim());

      res.json({
        source,
        fetchedUrl,
        parsedTags: {
          title: extractedTitle,
          metaTagsCount: metaTags.length,
          linkTagsCount: links.length,
          metaTags: metaTags.map(t => ({ name: t.name, property: t.property, content: t.content, raw: t.raw })),
          linkTags: links.map(l => ({ rel: l.rel, href: l.href, raw: l.raw }))
        },
        audit: parsedAudit
      });

    } catch (err: any) {
      console.error('Error in meta-tag-auditor API:', err);
      res.status(500).json({ error: err.message || 'Internal server error during Meta Tag Audit.' });
    }
  });

  // API Assistant / Supervisor Endpoint using Gemini 3.5 Flash
  app.post('/api/assistant', async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Messages array is required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please verify the Secrets panel in Settings.' 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Map roles to Gemini roles ('user' or 'model')
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const systemInstruction = `You are "Apex AI Supervisor" – the elite in-browser coach and domain optimization strategist for Apex Utility.
Your goal is to help users navigate and master the rich suite of SEO, compliance, asset optimization, and development tools available on this website.

The website provides the following interactive web tools:
1. XML Sitemap & Robots Generator ('sitemap-generator'): Build crawler-compliant sitemaps and custom robots.txt.
2. SEO Competitor Content-Gap Analyzer ('content-gap'): Extract keywords, identify missing sections, and target rank superiority.
3. AI Content Planner & Intent Optimizer ('content-planner'): Plan comprehensive outlines, target headings, and schema questions under full intent guidelines.
4. AI Keyword Cluster Tool ('keyword-cluster'): Group raw search terms into visual intent siloing maps.
5. Schema Generator & Meta compiler ('schema-generator'): Build microdata block models for advanced FAQ or product snippets.
6. PDF Joiner, Compressor & Analyst: Merge tracks or compress document payload structures completely local and secure.
7. WebP & Image Compressor: Convert heavy assets into lightweight, layout-compliant layouts.
8. Security Tools: Check regex, configure color palettes, calculate date math, generate qr codes, and build secure cryptographically random password formats.

Tone Guidelines:
- Highly professional, encouraging, analytical, and supportive.
- Proactively guide users to select the right tool or tab to solve their issues. For example, if they want to build a sitemap, suggest clicking "Sitemap Generator" (active tab name 'sitemap-generator').
- Keep answers super-informative, structured, and friendly. Avoid long-winded paragraphs; use rich lists and bold focal terms to make inputs easily scan.`;

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7
        }
      });

      if (!result.text) {
        throw new Error('Gemini API returned an empty output stream.');
      }

      res.json({ text: result.text.trim() });
    } catch (err: any) {
      console.error('Error in assistant api:', err);
      res.status(500).json({ error: err.message || 'Internal server error during assistant conversation.' });
    }
  });

  // Submit sitemap directly to Google Search Console (Ping Submission API)
  app.get('/api/ping-google-sitemap', async (req, res) => {
    try {
      const host = req.headers.host || 'apexutility.live';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      
      // Support custom domain if requested parameter exists
      const queryBaseUrl = req.query.baseUrl as string;
      const sitemapUrl = queryBaseUrl 
        ? `${queryBaseUrl.replace(/\/$/, '')}/sitemap.xml`
        : `${protocol}://${host}/sitemap.xml`;
        
      const targetUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      
      console.log(`[Sitemap Ping] Submitting sitemap to Google: ${targetUrl}`);
      
      // Perform backend fetch to Google ping endpoint
      const response = await fetch(targetUrl);
      const isOk = response.ok;
      
      res.json({
        success: isOk,
        sitemapUrl,
        pingUrl: targetUrl,
        status: response.status,
        message: isOk 
          ? `Successfully submitted sitemap to Google Search Console!`
          : `Failed to submit. Google responded with status ${response.status}.`
      });
    } catch (err: any) {
      console.error('[Sitemap Ping] Error pinging Google Search Console:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Error occurred while contacting Google submission servers.'
      });
    }
  });

  // API: Single Link Health Check
  app.post('/api/check-link-health', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'A valid URL is required.' });
        return;
      }

      const http = await import('http');
      const https = await import('https');
      const { URL } = await import('url');

      let currentUrl = url.trim();
      if (!/^https?:\/\//i.test(currentUrl)) {
        currentUrl = 'http://' + currentUrl;
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(currentUrl);
      } catch (e) {
        res.json({
          url,
          statusCode: 0,
          statusText: 'Invalid URL',
          responseTimeMs: 0,
          redirectUrl: null,
          contentType: null,
          error: 'Malformed URL structure'
        });
        return;
      }

      const startTime = process.hrtime();
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        method: 'GET',
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: (parsedUrl.pathname || '/') + parsedUrl.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 ApexLinkAuditor/1.0',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 4000,
      };

      const requestObj = client.request(options, (responseStream) => {
        const diff = process.hrtime(startTime);
        const responseTimeMs = Math.round(diff[0] * 1000 + diff[1] / 1000000);
        
        const statusCode = responseStream.statusCode || 200;
        const statusText = responseStream.statusMessage || '';
        const contentType = responseStream.headers['content-type'] || null;

        let redirectUrl: string | null = null;
        if ([301, 302, 303, 307, 308].includes(statusCode) && responseStream.headers['location']) {
          const loc = responseStream.headers['location'];
          try {
            redirectUrl = new URL(loc, parsedUrl.href).href;
          } catch (e) {
            redirectUrl = loc;
          }
        }

        // Consume response stream immediately to close connection cleanly without downloading full body
        responseStream.resume();
        requestObj.destroy();

        res.json({
          url: parsedUrl.href,
          statusCode,
          statusText,
          responseTimeMs,
          redirectUrl,
          contentType,
          error: null
        });
      });

      requestObj.on('error', (err: any) => {
        const diff = process.hrtime(startTime);
        const responseTimeMs = Math.round(diff[0] * 1000 + diff[1] / 1000000);
        res.json({
          url: currentUrl,
          statusCode: 0,
          statusText: 'Failed',
          responseTimeMs,
          redirectUrl: null,
          contentType: null,
          error: err.message || 'Connection failed'
        });
      });

      requestObj.on('timeout', () => {
        requestObj.destroy();
        const diff = process.hrtime(startTime);
        const responseTimeMs = Math.round(diff[0] * 1000 + diff[1] / 1000000);
        res.json({
          url: currentUrl,
          statusCode: 0,
          statusText: 'Timeout',
          responseTimeMs,
          redirectUrl: null,
          contentType: null,
          error: 'Connection timeout (4s limit)'
        });
      });

      requestObj.end();
    } catch (err: any) {
      console.error('Error checking single link:', err);
      res.status(500).json({ error: err.message || 'Error occurred during health check.' });
    }
  });

  // API: AI SEO Content Brief & Outline Generator
  app.post('/api/seo/generate-content-brief', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      const { keyword, intent, headers, secondaryKeywords, targetAudience, tone, wordCount } = req.body;
      if (!keyword || typeof keyword !== 'string') {
        res.status(400).json({ error: 'A valid target seed keyword is required.' });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const systemInstruction = `You are a world-class SEO content strategist and search intent specialist. Your task is to generate a comprehensive, search-optimized content brief and heading outline that is meticulously engineered to rank #1 on Google.
Analyze the target seed keyword, search intent, and target audience, then build a structure that satisfies search intent completely, incorporates LSI and secondary keywords, and sets up a high-converting meta structure.

Format the output strictly as a JSON object matching the requested schema. Ensure the outline sections have a logical flow, use proper heading levels (H1, H2, H3), and incorporate any focus headers specified by the user.`;

      const prompt = `Please generate an SEO content brief and structural outline for the following parameters:
- Target Seed Keyword: "${keyword}"
- Specified Search Intent: "${intent || 'Auto-detect'}"
- Focus Headers / Required Sections to Include: ${headers && headers.length > 0 ? JSON.stringify(headers) : 'None'}
- Secondary Keywords: ${secondaryKeywords && secondaryKeywords.length > 0 ? JSON.stringify(secondaryKeywords) : 'None'}
- Target Audience: "${targetAudience || 'General online reader looking for deep, authoritative insights'}"
- Tone of Voice: "${tone || 'Professional, informative, and engaging'}"
- Word Count Preference: "${wordCount || 'Auto-recommend'}"

Ensure:
1. The outline contains H1 (typically one for title), H2s, and H3s if appropriate.
2. If custom "Focus Headers" are specified, seamlessly integrate them into the outline at appropriate heading levels.
3. Every section has clear, actionable instructions for the writer on exactly what semantic points to hit, facts to address, and tone to maintain.
4. FAQs section includes 3-5 high-priority questions that real searchers ask (People Also Ask).`;

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              intent: { type: Type.STRING },
              summary: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              recommendedWordCount: { type: Type.STRING },
              secondaryKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              suggestedMetaTitle: { type: Type.STRING },
              suggestedMetaDescription: { type: Type.STRING },
              faqs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    intent: { type: Type.STRING }
                  },
                  required: ["question", "intent"]
                }
              },
              outline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    level: { type: Type.STRING },
                    description: { type: Type.STRING },
                    keywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["id", "title", "level", "description"]
                }
              }
            },
            required: [
              "keyword", "intent", "summary", "targetAudience", 
              "recommendedWordCount", "secondaryKeywords", 
              "suggestedMetaTitle", "suggestedMetaDescription", "faqs", "outline"
            ]
          }
        }
      });

      if (!result.text) {
        throw new Error('Empty response from AI Brief Generator.');
      }

      res.json(JSON.parse(result.text.trim()));
    } catch (err: any) {
      console.error('Error generating content brief:', err);
      res.status(500).json({ error: err.message || 'Error occurred during brief generation.' });
    }
  });

  // API: AI Outline Section Snippet/Paragraph Writer
  app.post('/api/seo/generate-section-draft', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in Settings.' 
        });
        return;
      }

      const { keyword, sectionTitle, sectionDescription, level, tone, wordCount, sectionKeywords } = req.body;
      if (!sectionTitle) {
        res.status(400).json({ error: 'Section title is required.' });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const systemInstruction = `You are an elite, highly engaging copywriter and search optimizer. Your task is to write a high-converting, deeply engaging draft for a single heading section of a larger outline.
Incorporate any specified target keywords naturally. Structure with clear paragraphs, list items if helpful, and use bold styling to improve readability and retention. Output must be in beautiful Markdown format only.`;

      const prompt = `Please write a comprehensive, high-quality content draft for the following section:
- Overall Target Keyword: "${keyword || 'Not specified'}"
- Heading/Section Title: "${sectionTitle}" (Heading Level: ${level || 'H2'})
- Section Content Guidelines & Focal Points: "${sectionDescription || 'Write an informative, thorough guide covering this heading topic.'}"
- Tone of Voice: "${tone || 'Professional, informative, and engaging'}"
- Targeted Word Count: "${wordCount || '150-250 words'}"
- Suggested Keywords to incorporate: ${sectionKeywords && sectionKeywords.length > 0 ? JSON.stringify(sectionKeywords) : 'None'}

Draft guidelines:
- Satisfy user search intent completely.
- Be clear, authoritative, and engaging.
- Use clean Markdown styling (paragraphs, lists if logical, strong/bold text). Do not output heading titles (e.g. # or ##) in the text unless specifically helpful, just write the body draft content for this section.`;

      const result = await generateContentWithFallback(ai, {
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7
        }
      });

      if (!result.text) {
        throw new Error('Empty draft generated.');
      }

      res.json({ draft: result.text.trim() });
    } catch (err: any) {
      console.error('Error generating section draft:', err);
      res.status(500).json({ error: err.message || 'Error occurred during section draft generation.' });
    }
  });

  // API Redirect Chain & HTTP Header Auditor Endpoint
  app.post('/api/audit-redirect', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'A valid URL is required.' });
        return;
      }

      const http = await import('http');
      const https = await import('https');
      const { URL } = await import('url');

      const chain: any[] = [];
      let currentUrl = url.trim();
      const maxRedirects = 10;
      let errorOccurred = null;

      for (let i = 0; i < maxRedirects; i++) {
        // Ensure protocol exists
        if (!/^https?:\/\//i.test(currentUrl)) {
          currentUrl = 'http://' + currentUrl;
        }

        let parsedUrl: URL;
        try {
          parsedUrl = new URL(currentUrl);
        } catch (e: any) {
          errorOccurred = `Invalid URL: ${currentUrl}`;
          break;
        }

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          errorOccurred = `Unsupported protocol: ${parsedUrl.protocol}`;
          break;
        }

        // Avoid infinite loops by checking if we have seen this URL in this chain already
        const alreadyVisited = chain.some(hop => hop.url === parsedUrl.href);
        if (alreadyVisited) {
          errorOccurred = `Circular redirect detected at ${parsedUrl.href}`;
          break;
        }

        const startTime = process.hrtime();
        try {
          const hop = await new Promise<any>((resolve, reject) => {
            const client = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
              method: 'GET',
              hostname: parsedUrl.hostname,
              port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
              path: (parsedUrl.pathname || '/') + parsedUrl.search,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ApexRedirectAuditor/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
              },
              timeout: 6000,
            };

            const requestObj = client.request(options, async (responseStream) => {
              const diff = process.hrtime(startTime);
              const responseTimeMs = Math.round(diff[0] * 1000 + diff[1] / 1000000);
              
              const headers: Record<string, string> = {};
              for (const [key, val] of Object.entries(responseStream.headers)) {
                if (Array.isArray(val)) {
                  headers[key] = val.join(', ');
                } else if (val !== undefined) {
                  headers[key] = val;
                }
              }

              const statusCode = responseStream.statusCode || 200;
              const statusText = responseStream.statusMessage || '';

              let redirectUrl: string | null = null;
              if ([301, 302, 303, 307, 308].includes(statusCode) && headers['location']) {
                const loc = headers['location'];
                try {
                  redirectUrl = new URL(loc, parsedUrl.href).href;
                } catch (e) {
                  redirectUrl = loc;
                }
              }

              // Read HTML body if it's 200 OK and is text/html to look for Meta/JS redirects
              let bodyText = '';
              const contentType = headers['content-type'] || '';
              if (statusCode === 200 && contentType.toLowerCase().includes('text/html')) {
                try {
                  await new Promise<void>((resolveBody) => {
                    let size = 0;
                    responseStream.on('data', (chunk) => {
                      size += chunk.length;
                      bodyText += chunk.toString('utf8');
                      if (size > 80 * 1024) { // limit to 80KB to remain fast
                        requestObj.destroy();
                        resolveBody();
                      }
                    });
                    responseStream.on('end', () => {
                      resolveBody();
                    });
                  });
                } catch (err) {
                  // Ignore read body issues, we can proceed with what we have
                }
              } else {
                // Otherwise destroy immediately to conserve resources
                responseStream.resume();
                requestObj.destroy();
              }

              // If 200 OK and we have a body, check for Meta/JS redirects
              let redirectType: string | null = null;
              if (statusCode === 200 && bodyText) {
                // Meta Refresh check
                const metaRefreshRegex = /<meta\s+[^>]*http-equiv=["']refresh["'][^>]*content=["']\d+;\s*url=(.*?)["']/i;
                const metaMatch = bodyText.match(metaRefreshRegex);
                if (metaMatch && metaMatch[1]) {
                  const rawLoc = metaMatch[1].trim();
                  try {
                    redirectUrl = new URL(rawLoc, parsedUrl.href).href;
                    redirectType = 'Meta Refresh Tag';
                  } catch (e) {
                    redirectUrl = rawLoc;
                    redirectType = 'Meta Refresh Tag';
                  }
                }

                // JS Redirect check (window.location / location.href / location.replace)
                if (!redirectUrl) {
                  const jsRedirectRegex = /(?:window\.|document\.)?location(?:\.href|\.replace)?\s*=\s*["'](.*?)["']/i;
                  const jsMatch = bodyText.match(jsRedirectRegex);
                  if (jsMatch && jsMatch[1]) {
                    const rawLoc = jsMatch[1].trim();
                    try {
                      redirectUrl = new URL(rawLoc, parsedUrl.href).href;
                      redirectType = 'JavaScript (location.href)';
                    } catch (e) {
                      redirectUrl = rawLoc;
                      redirectType = 'JavaScript (location.href)';
                    }
                  }
                }
              }

              const securityHeaders = {
                hsts: headers['strict-transport-security'] || null,
                csp: headers['content-security-policy'] || null,
                xFrameOptions: headers['x-frame-options'] || null,
                xContentTypeOptions: headers['x-content-type-options'] || null,
                referrerPolicy: headers['referrer-policy'] || null,
                xXssProtection: headers['x-xss-protection'] || null,
              };

              resolve({
                url: parsedUrl.href,
                statusCode,
                statusText,
                redirectUrl,
                redirectType: redirectType || (redirectUrl ? 'HTTP Header' : null),
                responseTimeMs,
                headers,
                securityHeaders,
              });
            });

            requestObj.on('error', (err) => {
              reject(err);
            });

            requestObj.on('timeout', () => {
              requestObj.destroy();
              reject(new Error('Request timeout'));
            });

            requestObj.end();
          });

          chain.push(hop);
          if (hop.redirectUrl) {
            currentUrl = hop.redirectUrl;
          } else {
            break;
          }
        } catch (err: any) {
          errorOccurred = err.message || 'Connection error';
          break;
        }
      }

      res.json({
        targetUrl: url,
        redirectChain: chain,
        finalUrl: chain.length > 0 ? chain[chain.length - 1].url : url,
        totalRedirects: Math.max(0, chain.filter(hop => hop.redirectUrl).length),
        error: errorOccurred,
        success: chain.length > 0
      });
    } catch (err: any) {
      console.error('Error in /api/audit-redirect:', err);
      res.status(500).json({ error: err.message || 'An error occurred during redirect auditing.' });
    }
  });

  // Explicit route to serve ads.txt with correct plain text content-type
  app.get('/ads.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const distPath = path.join(process.cwd(), 'dist', 'ads.txt');
    const publicPath = path.join(process.cwd(), 'public', 'ads.txt');
    if (fs.existsSync(distPath)) {
      return res.sendFile(distPath);
    } else if (fs.existsSync(publicPath)) {
      return res.sendFile(publicPath);
    } else {
      return res.send('google.com, pub-3493943620806779, DIRECT, f08c47fec0942fa0');
    }
  });

  // Explicit route to serve robots.txt with correct plain text content-type
  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const distPath = path.join(process.cwd(), 'dist', 'robots.txt');
    const publicPath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(distPath)) {
      return res.sendFile(distPath);
    } else if (fs.existsSync(publicPath)) {
      return res.sendFile(publicPath);
    } else {
      return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /debug\nSitemap: https://apexutility.live/sitemap.xml');
    }
  });

  // Serve a dynamically generated, search-crawler compliant sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const host = req.headers.host || 'apexutility.live';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    const tools = [
      'css-generator', 'compress-pdf', 'webp-converter', 'json-beautifier', 
      'sitemap-seo', 'sitemap-generator', 'image-to-pdf', 'join-pdf', 'ai-writer', 
      'password-generator', 'qr-generator', 'unit-converter', 'svg-rasterizer', 'batch-processor',
      'json-diff', 'secure-hash', 'color-palette', 'digital-signature', 'seo-optimizer',
      'base64-converter', 'regex-tester', 'csv-json-converter', 'image-compressor', 'rich-text-stats',
      'audio-trimmer', 'ai-transcriber', 'pdf-analyst', 'exif-stripper', 'video-recorder',
      'image-vectorizer', 'code-snapshot', 'private-sketchpad', 'case-converter', 'lorem-generator',
      'image-cropper', 'date-calculator', 'privacy-policy', 'terms-of-service', 'about-us',
      'guides', 'content-planner', 'social-hooks', 'code-explainer', 'favicon-generator',
      'alt-text-generator', 'keyword-difficulty', 'url-slugifier', 'schema-generator', 'content-gap',
      'keyword-cluster', 'redirect-auditor', 'google-serp', 'sql-formatter', 'subnet-cidr',
      'svg-wave', 'box-shadow', 'robots-txt', 'dns-lookup', 'user-agent',
      'html-markdown', 'meta-tags', 'ai-humanizer', 'tone-analyzer', 'resume-optimizer',
      'text-summarizer', 'passport-photo', 'meme-generator', 'headshot-generator', 'image-upscaler',
      'mockup-generator', 'pdf-converter', 'pdf-form-filler', 'pdf-signer', 'uuid-generator',
      'cron-builder', 'jwt-decoder', 'gradient-generator', 'password-sharer', 'data-breach',
      'checksum-verifier', 'age-calculator', 'loan-calculator', 'bmi-calculator'
    ];

    const today = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // 1. Add home path
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.00</priority>\n';
    xml += '  </url>\n';

    // 2. Add each dynamic tool route
    tools.forEach(tool => {
      const isLegal = ['privacy-policy', 'terms-of-service', 'about-us'].includes(tool);
      const isHighPriority = ['sitemap-generator', 'sitemap-seo', 'seo-optimizer', 'guides'].includes(tool);
      
      const prio = isLegal ? '0.40' : (isHighPriority ? '0.90' : '0.80');
      const freq = isLegal ? 'monthly' : 'weekly';
      
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/${tool}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${freq}</changefreq>\n`;
      xml += `    <priority>${prio}</priority>\n`;
      xml += '  </url>\n';
    });

    // 3. Add all editorial articles (50+ structural guides)
    if (Array.isArray(AT_LEAST_20_ARTICLES)) {
      AT_LEAST_20_ARTICLES.forEach(art => {
        if (art && art.id) {
          xml += '  <url>\n';
          xml += `    <loc>${baseUrl}/${art.id}</loc>\n`;
          xml += `    <lastmod>${today}</lastmod>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.75</priority>\n';
          xml += '  </url>\n';
        }
      });
    }

    // 4. Add Apex Subdomains for indexing
    const subdomains = [
      'https://news.apexutility.live/',
      'https://www.smallpdf.com.apexutility.live/',
      'https://pdf.apexutility.live/',
      'https://png.apexutility.live/',
      'https://utility.apexutility.live/',
      'https://jpg2pdf.com.apexutility.live/',
      'https://json.apexutility.live/',
      'https://ilovepdf.com.apexutility.live/',
      'https://www.apexutility.live/',
      'https://beta.apexutility.live/',
      'https://apex.apexutility.live/',
      'https://jpg.apexutility.live/',
      'https://apexutility.com.apexutility.live/',
      'https://ai.apexutility.live/',
      'https://docs.apexutility.live/',
      'https://image.apexutility.live/',
      'https://blog.apexutility.live/',
      'https://www.ilovepdf.com.apexutility.live/',
      'https://seo.apexutility.live/',
      'https://qrcode.apexutility.live/',
      'https://regex.apexutility.live/',
      'https://audio.apexutility.live/',
      'https://video.apexutility.live/',
      'https://dev.apexutility.live/',
      'https://tools.apexutility.live/',
      'https://api.apexutility.live/',
      'https://converter.apexutility.live/',
      'https://design.apexutility.live/',
      'https://sketch.apexutility.live/',
      'https://secure.apexutility.live/'
    ];

    subdomains.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.90</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  });

  // -------------------------------------------------------------
  // AI Header Generation and Metadata Storage Endpoints
  // -------------------------------------------------------------

  // Setup /headers static serving from public/headers
  try {
    const fs = await import('fs');
    const path = await import('path');
    const headersDir = path.join(process.cwd(), 'public/headers');
    if (!fs.existsSync(headersDir)) {
      fs.mkdirSync(headersDir, { recursive: true });
    }
    app.use('/headers', express.static(headersDir));
  } catch (err) {
    console.error('Error setting up static headers directory serving:', err);
  }

  // Get all generated AI article headers
  app.get('/api/articles-images', async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const metadataPath = path.join(process.cwd(), 'public/headers/metadata.json');
      
      if (fs.existsSync(metadataPath)) {
        const fileContent = fs.readFileSync(metadataPath, 'utf-8');
        res.json(JSON.parse(fileContent));
      } else {
        res.json({});
      }
    } catch (err: any) {
      console.error('Error fetching article images metadata:', err);
      res.json({});
    }
  });

  // Generate an AI header image using the Imagen API
  app.post('/api/generate-article-image', async (req, res) => {
    try {
      const { articleId, prompt, articleTitle, articleTags } = req.body;
      if (!articleId) {
        res.status(400).json({ error: 'Article ID is required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Please check your Secret keys.' 
        });
        return;
      }

      // Initialize the modern GoogleGenAI client (no named client, direct inst.)
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Construct a premium descriptive prompt
      let finalPrompt = prompt;
      if (!finalPrompt) {
        const tagsString = articleTags && articleTags.length > 0 ? articleTags.join(', ') : 'technology';
        finalPrompt = `An ultra-premium, high-fidelity, highly detailed cinematic digital representation of raw concepts for the tech article titled "${articleTitle || articleId}". Relevant terms: ${tagsString}. Style: modern workspace, minimalist glowing neon vectors, beautiful deep slate canvas, ambient lighting, widescreen 16:9 banner layout suitable for a leading tech publisher's article cover header, 4k detail, clean with zero words, letters, or fonts.`;
      }

      console.log(`[Imagen API] Generating article header for ID "${articleId}" using prompt: "${finalPrompt}"`);

      // Call generateImages as documented in the gemini-api skill
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error('No images returned from standard Imagen API endpoints. Generative queue was empty.');
      }

      const imageObj = response.generatedImages[0].image;
      if (!imageObj || !imageObj.imageBytes) {
        throw new Error('Image bytes were empty or unresolved in the Google Imagen response payload.');
      }
      const base64Bytes = imageObj.imageBytes;
      const buffer = Buffer.from(base64Bytes, 'base64');

      const fs = await import('fs');
      const path = await import('path');

      // Double verify directory exists at runtime
      const headersDir = path.join(process.cwd(), 'public/headers');
      if (!fs.existsSync(headersDir)) {
        fs.mkdirSync(headersDir, { recursive: true });
      }

      // Save the generated image
      const imageFilename = `${articleId}.png`;
      const imagePath = path.join(headersDir, imageFilename);
      fs.writeFileSync(imagePath, buffer);

      // Save to metadata mapping file
      const metadataPath = path.join(headersDir, 'metadata.json');
      let metadata: Record<string, string> = {};
      if (fs.existsSync(metadataPath)) {
        try {
          const content = fs.readFileSync(metadataPath, 'utf-8');
          metadata = JSON.parse(content);
        } catch (e) {
          metadata = {};
        }
      }
      
      const imageUrl = `/headers/${imageFilename}`;
      metadata[articleId] = imageUrl;
      
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`[Imagen API] Saved generated AI header under "${imageUrl}"`);
      res.json({ success: true, imageUrl, prompt: finalPrompt });
    } catch (err: any) {
      console.error('Error generating AI header via Imagen:', err);
      res.status(500).json({ error: err.message || 'Verification and generation of standard Imagen visual failed.' });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static assets in production, but disable index.html auto-serving so we can dynamically parse the / path
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    
    app.get('*', (req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
          return res.status(404).send('Index template not found');
        }
        
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        // Resolve path segments to extract matching tools or articles
        const rawPath = req.path;
        const cleanPath = rawPath.replace(/^\/|\/$/g, '').toLowerCase();
        
        // Match deep article queries to resolve duplicate page layouts
        const queryArtId = (req.query.id || req.query.art || req.query.article) as string;
        let matchedArt = null;
        if (queryArtId) {
          matchedArt = AT_LEAST_20_ARTICLES.find(art => art && art.id && art.id.toLowerCase() === queryArtId.toLowerCase());
        }
        if (!matchedArt && Array.isArray(AT_LEAST_20_ARTICLES) && AT_LEAST_20_ARTICLES.some(art => art && art.id && art.id.toLowerCase() === cleanPath)) {
          matchedArt = AT_LEAST_20_ARTICLES.find(art => art && art.id && art.id.toLowerCase() === cleanPath);
        }

        let title = "Apex Processing Labs | Best Free PDF Converter, PDF Size Reducer & AI Tools";
        let desc = "Compress PDF online free to 100kb, convert JPG to PDF, merge PDF files offline, draw digital signatures, and convert WebP to JPG safely in your browser. 100% private & secure.";
        let ogImage = "https://apexutility.live/favicon.svg";
        let seoBody = "";
        
        // 1. Article route (either via query parameters or direct path segment)
        if (matchedArt) {
          title = `${matchedArt.title} | Apex Processing Labs`;
          desc = matchedArt.summary.substring(0, 155);
          seoBody = getArticleSEOBody(matchedArt);
        }
        // 2. Root / Home route or Dashboard
        else if (cleanPath === "" || cleanPath === "dashboard") {
          title = "Apex Processing Labs | Ultimate Free Client-Side PDF, WebP & Developer Tools";
          desc = "The ultimate collection of 100% offline, privacy-first browser tools. Compress PDF to 100kb, convert WebP to JPG, write articles with AI, and generate XML sitemaps safely.";
          seoBody = `
            <div id="seo-home" style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5; line-height: 1.6; background-color: #09090b;">
              <span style="text-transform: uppercase; font-size: 0.85rem; font-weight: 700; color: #ef4444; letter-spacing: 0.05em;">Apex Processing Labs</span>
              <h1 style="font-size: 2.5rem; font-weight: 800; margin-top: 10px; margin-bottom: 20px; color: #ffffff; letter-spacing: -0.02em;">Ultimate 100% Secure Client-Side Web Utilities</h1>
              <p style="font-size: 1.15rem; color: #a1a1aa; margin-bottom: 30px;">Welcome to the premier hub for high-performance browser utilities. Our next-generation platform leverages browser-native technologies such as WebAssembly, HTML5 Canvas API, and the Web Cryptography API to execute 100% of all operations completely locally in your browser. Absolutely zero files or inputs are ever uploaded to any external servers, ensuring complete and ironclad privacy compliance.</p>
              
              <h2 style="font-size: 1.75rem; font-weight: 700; margin-top: 40px; margin-bottom: 15px; color: #ffffff;">Our High-Performance Web Tools Categories:</h2>
              <ul style="list-style-type: none; padding-left: 0; margin-bottom: 40px;">
                <li style="margin-bottom: 15px; padding-left: 15px; border-left: 3px solid #ef4444;"><strong style="color: #ffffff;">Document & PDF Optimization:</strong> Shrink PDF file sizes to under 100kb/2mb natively, merge image portfolios into PDFs, and join or reorder PDF pages with smooth drag-and-drop.</li>
                <li style="margin-bottom: 15px; padding-left: 15px; border-left: 3px solid #f97316;"><strong style="color: #ffffff;">Media & Graphic Laboratories:</strong> Convert JPG/PNG/GIF assets to lightweight WebP, convert vector SVGs to high-resolution PNGs, strip sensitive geographic camera EXIF tags, or trace raster photos into scalable vectors.</li>
                <li style="margin-bottom: 15px; padding-left: 15px; border-left: 3px solid #3b82f6;"><strong style="color: #ffffff;">Developer Operations & Data Tools:</strong> Cleanly parse and beautifier JSON blocks, calculate diff mappings, generate standardized XML sitemaps, test regular expressions, and convert CSV tables to arrays instantly.</li>
                <li style="margin-bottom: 15px; padding-left: 15px; border-left: 3px solid #10b981;"><strong style="color: #ffffff;">Privacy & Cryptographic Vaults:</strong> Draw professional digital signatures, generate secure high-entropy passwords, compile MD5/SHA-256 secure hash values, and analyze readability metrics.</li>
              </ul>
              
              <h2 style="font-size: 1.75rem; font-weight: 700; color: #ffffff; margin-bottom: 15px;">Discover Other Native Utilities</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; margin-top: 20px;">
                <a href="/compress-pdf" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">Smart PDF Compressor</a>
                <a href="/webp-converter" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">WebP Image Converter</a>
                <a href="/json-beautifier" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">JSON Parser & Beautifier</a>
                <a href="/sitemap-generator" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">XML Sitemap Generator</a>
                <a href="/seo-optimizer" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">SEO Tag Optimizer</a>
                <a href="/password-generator" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">Shield Vault Generator</a>
              </div>
            </div>
          `;
        }
        // 3. Tool route
        else {
          const toolMeta = getToolMetadata(cleanPath);
          if (toolMeta) {
            title = `${toolMeta.title} - Free & Secure | Apex Processing Labs`;
            desc = toolMeta.desc.substring(0, 155);
            seoBody = getToolSEOBody(cleanPath, toolMeta.title, toolMeta.desc, toolMeta.tagline, toolMeta.category);
          }
        }
        
        // Construct canonical tag link URL
        let canonicalUrl = 'https://apexutility.live';
        if (matchedArt) {
          canonicalUrl = `https://apexutility.live/${matchedArt.id}`;
        } else if (cleanPath && cleanPath !== 'dashboard') {
          canonicalUrl = `https://apexutility.live/${cleanPath}`;
        }
        
        // Enforce strict stripping of trailing slashes to eliminate duplicate page penalties
        if (canonicalUrl.endsWith('/') && canonicalUrl !== 'https://apexutility.live') {
          canonicalUrl = canonicalUrl.slice(0, -1);
        }
        
        const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
        
        // Dynamically replace head metadata in static index.html
        html = html.replace(/<title>[^]*?<\/title>/, `<title>${title}</title>`);
        
        // Try replacing description
        if (html.includes('name="description"')) {
          html = html.replace(/<meta\s+name="description"\s+content="[^]*?"\s*\/?>/, `<meta name="description" content="${desc}" />`);
        } else {
          html = html.replace('</head>', `<meta name="description" content="${desc}" />\n</head>`);
        }
        
        // Handle Canonical tag injection
        if (html.includes('rel="canonical"')) {
          html = html.replace(/<link\s+rel="canonical"\s+href="[^]*?"\s*\/?>/, canonicalTag);
        } else {
          html = html.replace('</head>', `${canonicalTag}\n</head>`);
        }
        
        // Inject / replace OpenGraph & Twitter title, description, and url properties
        if (html.includes('property="og:title"')) {
          html = html.replace(/<meta\s+property="og:title"\s+content="[^]*?"\s*\/?>/, `<meta property="og:title" content="${title}" />`);
        } else {
          html = html.replace('</head>', `<meta property="og:title" content="${title}" />\n</head>`);
        }
        
        if (html.includes('property="og:description"')) {
          html = html.replace(/<meta\s+property="og:description"\s+content="[^]*?"\s*\/?>/, `<meta property="og:description" content="${desc}" />`);
        } else {
          html = html.replace('</head>', `<meta property="og:description" content="${desc}" />\n</head>`);
        }
        
        if (html.includes('property="og:url"')) {
          html = html.replace(/<meta\s+property="og:url"\s+content="[^]*?"\s*\/?>/, `<meta property="og:url" content="${canonicalUrl}" />`);
        } else {
          html = html.replace('</head>', `<meta property="og:url" content="${canonicalUrl}" />\n</head>`);
        }
        
        // Dynamically inject body fallback HTML inside <div id="root">
        if (seoBody) {
          html = html.replace('<div id="root"></div>', `<div id="root">\n${seoBody}\n</div>`);
        }
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      } catch (err: any) {
        console.error('[SEO pre-renderer] Failed to pre-render page:', err);
        return res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server starting on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

// -----------------------------------------------------------------
// Server-Side SEO Dynamic Pre-Rendering Helper Functions
// -----------------------------------------------------------------

function getToolMetadata(toolId: string) {
  const meta: Record<string, { title: string; desc: string; tagline: string; category: string }> = {
    'css-generator': {
      title: 'CSS Glass & Shadow Generator',
      desc: 'Design backdrop filters, interactive glass surfaces, and complex organic box-shadow layers with production-ready CSS and Tailwind exporters.',
      tagline: 'interactive glassmorphism builder and soft ambient shadow tester offline',
      category: 'Design & Signals'
    },
    'webp-converter': {
      title: 'WebP Image Converter',
      desc: 'Convert standard images (JPEG, PNG, GIF) into highly-optimized WebP files using Canvas API structures, with side-by-side comparative previews.',
      tagline: 'optimize images to webp to boost page load speed',
      category: 'Media Lab'
    },
    'compress-pdf': {
      title: 'Smart PDF Compressor',
      desc: 'Compress and structurally shrink document payload sizes without rasterization errors.',
      tagline: 'compress pdf to 2mb for job application online free',
      category: 'Document Optimization'
    },
    'image-to-pdf': {
      title: 'JPG/PNG to PDF Converter',
      desc: 'Merge multiple JPG, JPEG, and PNG images into a single highly optimized PDF document locally.',
      tagline: 'merge and compile raster designs into pdf portfolio',
      category: 'PDF Compilation'
    },
    'join-pdf': {
      title: 'PDF Joiner & Reorder',
      desc: 'Upload multiple existing PDF documents and merge them into a single file with page-by-page drag-and-drop reordering.',
      tagline: 'combine multiple pdf documents and reorder pages free',
      category: 'PDF Joiner'
    },
    'json-beautifier': {
      title: 'JSON Parser & Beautifier',
      desc: 'Validate structural arrays and format complex unreadable telemetry blocks instantly with clean layouts.',
      tagline: 'format unreadable json data tool',
      category: 'Developer Operations'
    },
    'ai-writer': {
      title: 'Apex AI Content Writer',
      desc: 'Draft publications, articles, formal emails, or markdown instantly and refine their structure using Gemini.',
      tagline: 'ai copywriter and professional editor',
      category: 'AI Copywriting'
    },
    'password-generator': {
      title: 'Shield Vault Generator',
      desc: 'Generate strong random password keys or memorable multi-word passphrases locally offline.',
      tagline: 'secure cryptographic key builder and entropy diagnostic offline',
      category: 'Security Vault'
    },
    'qr-generator': {
      title: 'QR & Barcode Studio',
      desc: 'Generate highly custom QR codes and multi-format linear barcodes offline. Personalize colors, margins, text sizes, and error levels.',
      tagline: 'custom high-resolution client-side vector qr and linear barcode generator',
      category: 'Design & Signals'
    },
    'unit-converter': {
      title: 'Metric Solver & Converter',
      desc: 'Convert length, weight, volume, and temperature metrics in real-time with an instant preview comparison matrix.',
      tagline: 'custom high-resolution secure metric conversion grid',
      category: 'Design & Signals'
    },
    'svg-rasterizer': {
      title: 'Vector SVG Rasterizer',
      desc: 'Load or paste raw SVG code, edit in real-time, scale up to 8x for high-resolution PNG, JPG, or WebP outputs natively.',
      tagline: 'custom high-resolution client-side vector to raster image compiler',
      category: 'Design & Signals'
    },
    'batch-processor': {
      title: 'Multi-threaded Batch Processor',
      desc: 'Load or drag multiple image assets, adjust compression quality, apply scales, and optimize files dynamically in parallel with fluid metrics.',
      tagline: 'secure client-side multi-threaded image transformation engine',
      category: 'Design & Signals'
    },
    'image-vectorizer': {
      title: 'Local Image Vectorizer',
      desc: 'Convert PNG, JPEG, and WebP images into high-quality scalable SVG vectors offline with customizable tracing styles.',
      tagline: 'free offline PNG/JPEG to scalable SVG vectorizer',
      category: 'Media Lab'
    },
    'json-diff': {
      title: 'JSON Object Diff Checker',
      desc: 'Compare two JSON schemas, detect additions, deletions, slight drifts or value updates, side-by-side with color-coded highlights.',
      tagline: 'accurate client-side structural diff compiler',
      category: 'Design & Signals'
    },
    'secure-hash': {
      title: 'Cryptographic Hash Vault',
      desc: 'Input text parameters to instantly compile multiple secure cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512) completely offline.',
      tagline: 'secure client-side password hash and cryptography machine',
      category: 'Security Vault'
    },
    'color-palette': {
      title: 'Aesthetic Color Palette Suite',
      desc: 'Generate perfect harmonious color schemes from hex base codes, extract dominant brand palettes from images, and compile exportable CSS/Tailwind variables 100% offline.',
      tagline: 'premium offline color palette studio & brand extractor',
      category: 'Design & Signals'
    },
    'digital-signature': {
      title: 'Digital Signature Studio',
      desc: 'Create beautiful, high-fidelity drawn or text-based signatures. Customize pen style, sizing, and color, and export vector-ready PNGs/SVGs for documents.',
      tagline: 'professional ink and typography signature builder',
      category: 'Design & Signals'
    },
    'seo-optimizer': {
      title: 'SEO Content Optimizer',
      desc: 'Analyze text in real-time for keyword targets, Flesch-Kincaid readability ease, word counts, and metadata. Preview instant Google and social media snippets.',
      tagline: 'ultra-premium search snippet builder & copy optimizer',
      category: 'Design & Signals'
    },
    'content-planner': {
      title: 'AI Content & Intent Planner',
      desc: 'Establish semantic cluster outlines, generate programmatic user intent roadmaps, and structure target articles with advanced Gemini models.',
      tagline: 'hierarchical topic generator and keyword intent builder',
      category: 'AI Copywriting'
    },
    'schema-generator': {
      title: 'JSON-LD Schema Generator',
      desc: 'Create fully compliant structured search snippets (Article, LocalBusiness, FAQ, Product, JobPosting) with instant JSON-LD clipboard exports.',
      tagline: 'validated rich schema markup machine offline',
      category: 'Developer Operations'
    },
    'content-gap': {
      title: 'SEO Content Gap Analyzer',
      desc: 'Compare your target article outline against top competitors to identify missing contextual sub-topics and missing entities natively with AI recommendations.',
      tagline: 'advanced visual layout gap analysis engine offline',
      category: 'Developer Operations'
    },
    'keyword-cluster': {
      title: 'Keyword Clustering Engine',
      desc: 'Group thousands of unorganized raw keyword phrases into semantic logical search hubs based on parent relevance, mapping intent pathways with high density.',
      tagline: 'automated semantic clustering machine offline',
      category: 'Developer Operations'
    },
    'base64-converter': {
      title: 'Base64 Encoder & Decoder',
      desc: 'Convert strings or files to base64 encoding and decode them instantly in your browser.',
      tagline: 'safe offline base64 file and string converter',
      category: 'Developer Operations'
    },
    'regex-tester': {
      title: 'Regex Diagnostic Lab',
      desc: 'Test, visualize, and debug regular expressions with real-time matching highlights, explanatory breakdowns, and quick reference cheatsheets.',
      tagline: 'real-time regular expression playground offline',
      category: 'Developer Operations'
    },
    'csv-json-converter': {
      title: 'CSV to JSON Converter',
      desc: 'Convert CSV spreadsheets to JSON arrays and JSON arrays back to CSV spreadsheets with intelligent automatic delimiter detection and formatting.',
      tagline: 'instant client-side flat csv schema mapper',
      category: 'Developer Operations'
    },
    'image-compressor': {
      title: 'WebAssembly Image Compressor',
      desc: 'Compress and resize JPEG/PNG images locally inside WebAssembly worker nodes for maximum size reduction while retaining pristine visual fidelity.',
      tagline: 'advanced client-side webassembly multi-image compressor',
      category: 'Media Lab'
    },
    'rich-text-stats': {
      title: 'Rich Text Word Counter & Stats',
      desc: 'Calculate detailed word metrics, character distributions, reading times, readability grades, and word frequency histograms.',
      tagline: 'comprehensive text character analysis suite',
      category: 'AI Copywriting'
    },
    'audio-trimmer': {
      title: 'Client-Side Audio Trimmer',
      desc: 'Trim, slice, and crop audio files (MP3, WAV, OGG) with a high-fidelity visual waveform editor locally inside your browser.',
      tagline: 'instant offline web audio wave trimmer',
      category: 'Media Lab'
    },
    'ai-transcriber': {
      title: 'AI Audio Transcriber',
      desc: 'Transcribe audio tracks, voice notes, and recordings to text using standard browser speech-to-text models or offline APIs.',
      tagline: 'instant localized speech recognition engine',
      category: 'AI Copywriting'
    },
    'pdf-analyst': {
      title: 'PDF Structure Analyst',
      desc: 'Inspect internal PDF file streams, cross-reference tables, structural dictionaries, embedded fonts, and page object hierarchies.',
      tagline: 'expert diagnostic pdf object structure viewer',
      category: 'Document Optimization'
    },
    'exif-stripper': {
      title: 'EXIF Metadata Stripper',
      desc: 'Upload images to scan, review, and completely strip sensitive EXIF camera parameters, GPS coordinates, and date timestamps before sharing.',
      tagline: 'privacy-first geographic tag cleaner offline',
      category: 'Security Vault'
    },
    'video-recorder': {
      title: 'Video Screen Recorder',
      desc: 'Record screen viewports, individual application windows, or webcam streams with live mic audio overlays, saving standard WebM movies offline.',
      tagline: 'client-side html5 capture media studio',
      category: 'Media Lab'
    },
    'image-cropper': {
      title: 'Image Cropper Studio',
      desc: 'Crop, rotate, and flip image assets with pixel-perfect aspect ratios and drag handles, exporting outputs natively in WebP, PNG, or JPEG.',
      tagline: 'flexible client-side raster crop tool',
      category: 'Media Lab'
    },
    'date-calculator': {
      title: 'Date Calculator & Time Zone Studio',
      desc: 'Compute intervals between days, analyze workdays, generate calendar ranges, and inspect time coordinates across various zones.',
      tagline: 'comprehensive offline coordinate date builder',
      category: 'Developer Operations'
    },
    'sitemap-seo': {
      title: 'Sitemap SEO Crawler & Validator',
      desc: 'Analyze XML sitemaps for response status codes, redirect loops, and crawl errors with interactive grids.',
      tagline: 'professional xml schema indexing analyzer',
      category: 'Developer Operations'
    },
    'sitemap-generator': {
      title: 'XML Sitemap Generator',
      desc: 'Generate, validate, and download standard-compliant XML sitemaps with custom frequencies, prioritizations, and change schedules.',
      tagline: 'dynamic web crawler map constructor',
      category: 'Developer Operations'
    },
    'about-us': {
      title: 'About Apex Processing Labs',
      desc: 'Learn about our core mission of providing 100% offline, secure, private, and high-performance client-side browser utilities.',
      tagline: 'the team behind the browser privacy revolution',
      category: 'Information'
    },
    'privacy-policy': {
      title: 'Privacy Policy',
      desc: 'Read our strict commitment to privacy. We operate on a zero-upload model where your files and data never leave your browser.',
      tagline: 'our zero-upload absolute confidentiality assurance',
      category: 'Legal'
    },
    'terms-of-service': {
      title: 'Terms of Service',
      desc: 'Read the terms of use for Apex Processing Labs. Learn about browser licensing, offline operations, and usage permissions.',
      tagline: 'licensing and usage parameters for browser suites',
      category: 'Legal'
    },
    'guides': {
      title: 'SEO and Asset Optimization Guides',
      desc: 'Discover expert guides on XML sitemaps, browser performance optimization, security, and AdSense compliance.',
      tagline: 'authoritative technical education library',
      category: 'Information'
    }
  };
  return meta[toolId];
}

function getToolSEOBody(toolId: string, title: string, desc: string, tagline: string, category: string): string {
  return `
    <article style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5; line-height: 1.6; background-color: #09090b;">
      <header style="margin-bottom: 30px; border-bottom: 1px solid #27272a; padding-bottom: 20px;">
        <span style="text-transform: uppercase; font-size: 0.85rem; font-weight: 700; color: #ef4444; letter-spacing: 0.05em;">${category}</span>
        <h1 style="font-size: 2.25rem; font-weight: 800; margin-top: 10px; margin-bottom: 15px; color: #ffffff; letter-spacing: -0.02em;">${title}</h1>
        <p style="font-size: 1.2rem; color: #a1a1aa; line-height: 1.5;">${desc} ${tagline ? tagline.replace(/"/g, '') : ''}</p>
      </header>
      
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 15px; color: #ffffff;">What is ${title}?</h2>
        <p style="color: #d4d4d8; margin-bottom: 15px;">Welcome to <strong>${title}</strong> by Apex Processing Labs, the premier professional browser-based utility designed for high-speed, secure, and fully private processing. Unlike legacy cloud tools that upload your sensitive documents and private information to external third-party database servers, our advanced client-side framework executes 100% of the conversion, compression, and diagnostic computations locally inside your web browser using cutting-edge WebAssembly (WASM), Javascript Canvas API, and Web Cryptography protocols.</p>
        <p style="color: #d4d4d8; margin-bottom: 15px;">This serverless, zero-upload architecture guarantees absolute confidentiality, security compliance, and defense against data leaks or unauthorized data collection. Whether you are an enterprise developer formatting massive JSON structures, a designer rendering precise vector graphics, or an office professional compressing confidential PDF files, our browser utilities provide instant desktop-grade performance directly inside your viewport.</p>
      </section>

      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 15px; color: #ffffff;">Key Features & Advanced Engineering Capabilities</h2>
        <ul style="padding-left: 20px; margin-bottom: 20px; color: #d4d4d8;">
          <li style="margin-bottom: 10px;"><strong style="color: #ffffff;">100% Client-Side Privacy:</strong> All data, files, hashes, and inputs remain locally in your browser memory buffer. We enforce a strict zero-upload policy for absolute security compliance.</li>
          <li style="margin-bottom: 10px;"><strong style="color: #ffffff;">High-Performance Execution:</strong> Harnesses modern browser capabilities, including multi-threaded worker pools, hardware-accelerated rendering, and localized cryptography.</li>
          <li style="margin-bottom: 10px;"><strong style="color: #ffffff;">Responsive UX Interface:</strong> Styled with modern fluid layouts, elegant interactive buttons, touch-friendly components, and smooth transitions.</li>
          <li style="margin-bottom: 10px;"><strong style="color: #ffffff;">Cross-Platform Compatibility:</strong> Seamlessly operates across desktop, mobile, and tablet viewports without requiring external plugins or account signups.</li>
        </ul>
      </section>

      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 15px; color: #ffffff;">How to Use ${title} Successfully</h2>
        <p style="color: #d4d4d8; margin-bottom: 15px;">Getting started with ${title} is simple and intuitive. First, navigate to the utility card within our comprehensive dashboard. Depending on the tool, you can upload your files via standard drag-and-drop zones, paste raw input text into our optimized editor panels, or adjust configurations using responsive dials and buttons. Once your input is prepared, trigger the processing engine. The results are calculated in milliseconds, and you can instantly download the output file, copy formatted code to your clipboard, or review diagnostic visual charts.</p>
        <p style="color: #d4d4d8; margin-bottom: 15px;">By leveraging local browser memory caches and local persistence layers, you can seamlessly save your progress and access your previous configurations across different tabs without losing work or leaking data.</p>
      </section>

      <section style="margin-bottom: 40px; border-top: 1px solid #27272a; padding-top: 30px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 15px; color: #ffffff;">Explore More High-Performance Developer & PDF Utilities</h2>
        <p style="color: #a1a1aa;">Apex Processing Labs offers an entire suite of search-crawler compliant, privacy-first tools designed to streamline your daily digital workflows. Explore some of our other high-performance, responsive browser systems:</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; margin-top: 20px;">
          <a href="/compress-pdf" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">Smart PDF Compressor</a>
          <a href="/webp-converter" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">WebP Image Converter</a>
          <a href="/json-beautifier" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">JSON Parser & Beautifier</a>
          <a href="/sitemap-generator" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">XML Sitemap Generator</a>
          <a href="/seo-optimizer" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">SEO Tag Optimizer</a>
          <a href="/password-generator" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">Shield Vault Generator</a>
        </div>
      </section>
    </article>
  `;
}

function getArticleSEOBody(art: any): string {
  const paragraphs = Array.isArray(art.content) 
    ? art.content.map((p: string) => {
        if (p.startsWith('###')) {
          return `<h3 style="font-size: 1.25rem; font-weight: 700; margin-top: 25px; margin-bottom: 10px; color: #ffffff;">${p.replace('###', '').trim()}</h3>`;
        } else if (p.startsWith('##')) {
          return `<h2 style="font-size: 1.5rem; font-weight: 700; margin-top: 30px; margin-bottom: 12px; color: #ffffff;">${p.replace('##', '').trim()}</h2>`;
        } else if (p.startsWith('```')) {
          return ''; // omit raw code blocks from fallback text
        }
        return `<p style="margin-bottom: 15px; color: #d4d4d8;">${p}</p>`;
      }).join('\n')
    : `<p style="color: #d4d4d8;">${art.summary}</p>`;

  return `
    <article style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5; line-height: 1.6; background-color: #09090b;">
      <header style="margin-bottom: 30px; border-bottom: 1px solid #27272a; padding-bottom: 20px;">
        <span style="text-transform: uppercase; font-size: 0.85rem; font-weight: 700; color: #38bdf8; letter-spacing: 0.05em;">${art.category}</span>
        <h1 style="font-size: 2.25rem; font-weight: 800; margin-top: 10px; margin-bottom: 15px; color: #ffffff; letter-spacing: -0.02em; line-height: 1.2;">${art.title}</h1>
        <div style="font-size: 0.9rem; color: #71717a; display: flex; gap: 15px; margin-bottom: 15px;">
          <span>Published: ${art.publishDate}</span>
          <span>Read time: ${art.readTime}</span>
          <span>Words: ${art.wordCount}</span>
        </div>
        <p style="font-size: 1.15rem; color: #a1a1aa; line-height: 1.5; font-style: italic;">${art.summary}</p>
      </header>
      
      <section style="margin-bottom: 40px;">
        ${paragraphs}
      </section>

      <section style="margin-bottom: 40px; border-top: 1px solid #27272a; padding-top: 30px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 15px; color: #ffffff;">Explore Our Premium Utilities</h2>
        <p style="color: #a1a1aa;">After reviewing our technical guide, feel free to use our suite of offline-first, browser-safe tools. All calculations are performed 100% locally on your computer for maximum security compliance:</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; margin-top: 20px;">
          <a href="/compress-pdf" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">Smart PDF Compressor</a>
          <a href="/webp-converter" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">WebP Image Converter</a>
          <a href="/json-beautifier" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">JSON Parser & Beautifier</a>
          <a href="/sitemap-generator" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">XML Sitemap Generator</a>
          <a href="/seo-optimizer" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">SEO Tag Optimizer</a>
          <a href="/password-generator" style="text-decoration: none; color: #38bdf8; font-weight: 600; padding: 12px; border: 1px solid #27272a; background-color: #18181b; text-align: center; display: block; border-radius: 8px;">Shield Vault Generator</a>
        </div>
      </section>
    </article>
  `;
}

createServer().catch((err) => {
  console.error('Error starting server:', err);
});
