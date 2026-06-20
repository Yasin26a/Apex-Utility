import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

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

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  // Serve a dynamically generated, search-crawler compliant sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const host = req.headers.host || 'apexutility.live';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    const tools = [
      'compress-pdf', 'webp-converter', 'json-beautifier', 
      'sitemap-seo', 'sitemap-generator', 'image-to-pdf', 'join-pdf', 'ai-writer', 
      'password-generator', 'qr-generator', 'unit-converter', 'svg-rasterizer', 'batch-processor', 'json-diff', 'secure-hash', 'color-palette', 'digital-signature', 'seo-optimizer', 'base64-converter', 'regex-tester', 'csv-json-converter', 'image-compressor', 'rich-text-stats', 'audio-trimmer', 'ai-transcriber', 'pdf-analyst', 'exif-stripper', 'video-recorder', 'image-vectorizer', 'code-snapshot', 'private-sketchpad', 'case-converter', 'lorem-generator', 'image-cropper', 'date-calculator', 'privacy-policy', 'terms-of-service', 'about-us', 'guides', 'content-planner', 'schema-generator', 'content-gap', 'keyword-cluster'
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
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server starting on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

createServer().catch((err) => {
  console.error('Error starting server:', err);
});
