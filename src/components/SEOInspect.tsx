import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Globe, Download, Check, Copy, Code, Sparkles, FileText, 
  CheckCircle, ShieldAlert, Cpu, AlertTriangle, Lightbulb, Gauge, Layers
} from 'lucide-react';

const SCHEMA_PROFILES = [
  {
    id: 'homepage',
    name: 'Home Portal Schema',
    description: 'Detailed search-engine structure for the primary APEX UTILITY hub portal.',
    code: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "APEX UTILITY Forge",
      "description": "High performance local-first tool suite optimized for developer operations, PDF operations, and image conversions.",
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  {
    id: 'webp-converter',
    name: 'WebP Converter Schema',
    description: 'Structure detailing the interactive WebP to PNG/JPG media engine.',
    code: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Interactive WebP Converter Engine",
      "description": "Instantly read WebP vectors and convert to crisp PNG or compressed JPG quality locally.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  {
    id: 'compress-pdf',
    name: 'PDF Compressor Schema',
    description: 'Structured mapping for local document size reduction pipeline.',
    code: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Smart PDF Compressor Forge",
      "description": "Compress and structurally shrink document payload sizes without rasterization errors.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF Schema',
    description: 'Structured metadata for compilation of visual assets to PDF.',
    code: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "JPG/PNG to PDF Converter & Merger",
      "description": "Merge and compile standard raster image formats into a single high-quality PDF document locally.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  {
    id: 'join-pdf',
    name: 'PDF Joiner Schema',
    description: 'Assembly mapping structures for fine-grained multi-document rendering.',
    code: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "PDF Joiner & Page Reorder Forge",
      "description": "Combine several PDF files into a single optimized document with page drag reordering.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  {
    id: 'json-beautifier',
    name: 'JSON Beautifier Schema',
    description: 'Developer workspace metadata tags targeting syntax arrays.',
    code: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "JSON Parser & Beautifier Engine",
      "description": "Format unreadable JSON data and debug structural arrays in real-time.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  {
    id: 'ai-writer',
    name: 'AI Copywriter Schema',
    description: 'Structured format mapping for professional content writing suite.',
    code: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex AI Content Writer Engine",
      "description": "Draft publications, articles, formal emails, or markdown posts instantly utilizing Gemini AI.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  {
    id: 'sitemap-seo',
    name: 'SEO Inspector Schema',
    description: 'Metadata mapping for structural crawl indexes and dynamic priorities.',
    code: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Dynamic XML Sitemap Generator & SEO Inspector",
      "description": "Generate dynamic sitemaps and inspect robots.txt files to index routes across search engines.",
      "applicationCategory": "SEOApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  }
];

const AUDIT_PROFILES = [
  {
    id: 'homepage',
    name: 'Home Portal',
    url: 'https://apexutility.live/',
    title: 'APEX UTILITY Forge - High Performance Developer Operations',
    description: 'High performance local-first tool suite optimized for developer operations, PDF operations, dynamic XML sitemaps, and secure image conversions.',
    keyword: 'developer operations',
    schema: JSON.stringify(SCHEMA_PROFILES[0].code, null, 2),
    pageContent: 'Apex Utility Forge is a comprehensive, local-first set of web browser utilities. Users can convert visual image formats, compress large PDF documents legibly, combine several PDF files together with dynamic page dragging, format or beautify code syntactic arrays (like nested JSON structures), and perform in-browser SEO diagnostics, sitemap indexing crawls, and robots directives generator. Zero files are uploaded to any server, preserving total security and privacy.'
  },
  {
    id: 'webp-converter',
    name: 'WebP Converter',
    url: 'https://apexutility.live/media-producer-toolkit/webp-converter',
    title: 'WebP Image Converter - Convert Image Formats Locally',
    description: 'Instantly read WebP vectors and convert to crisp PNG or compressed JPG quality locally. No server upload required.',
    keyword: 'convert image',
    schema: JSON.stringify(SCHEMA_PROFILES[1].code, null, 2),
    pageContent: 'An interactive offline-first image converter utility to instantly transform WebP files into crisp PNG format or standard compressed JPG formats. Ideal for developers and designers who need fast multi-file batch conversions inside their browsers without data leaving their local hardware.'
  },
  {
    id: 'compress-pdf',
    name: 'PDF Compressor',
    url: 'https://apexutility.live/pdf-document-optimizer/compress-pdf',
    title: 'Smart PDF Compressor - Shrink Files Legibly',
    description: 'Compress and structurally shrink document payload sizes without rasterization errors. Optimize speed and limit margins.',
    keyword: 'compress',
    schema: JSON.stringify(SCHEMA_PROFILES[2].code, null, 2),
    pageContent: 'Legibly and structurally shrink high-capacity PDF documents without ruining vector text, visual elements, or page dimensions. Perfect for developers, students, and businesses looking to reduce data sizes for email attachments or upload portals easily.'
  },
  {
    id: 'custom-empty',
    name: 'Draft (Demonstration of Bad SEO Practice / Fails)',
    url: 'https://apexutility.live/test-route',
    title: 'Draft',
    description: 'Short desc.',
    keyword: 'best tools',
    schema: '{ "broken_json": ',
    pageContent: 'Test route drafting bad content practice with extreme issues such as missing meta data, broken JSON schemas, and insufficient keyword occurrences.'
  }
];

export default function SEOInspect() {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState('homepage');

  // Automated Meta-Tag Compliance Auditor States
  const [selectedAuditProfile, setSelectedAuditProfile] = useState('homepage');
  const [inputUrl, setInputUrl] = useState('https://apexutility.live/');
  const [inputTitle, setInputTitle] = useState('APEX UTILITY Forge - High Performance Developer Operations');
  const [inputDesc, setInputDesc] = useState('High performance local-first tool suite optimized for developer operations, PDF operations, dynamic XML sitemaps, and secure image conversions.');
  const [inputKeyword, setInputKeyword] = useState('developer operations');
  const [inputSchema, setInputSchema] = useState(AUDIT_PROFILES[0].schema);
  const [inputPageContent, setInputPageContent] = useState(AUDIT_PROFILES[0].pageContent || '');

  // AI-Driven Variations States
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [variationResults, setVariationResults] = useState<{
    titles: Array<{ style: string; text: string; explanation: string }>;
    descriptions: Array<{ style: string; text: string; explanation: string }>;
  } | null>(null);
  const [variationError, setVariationError] = useState<string | null>(null);

  const handleLoadAuditProfile = (profileId: string) => {
    const prof = AUDIT_PROFILES.find(p => p.id === profileId);
    if (prof) {
      setSelectedAuditProfile(profileId);
      setInputUrl(prof.url);
      setInputTitle(prof.title);
      setInputDesc(prof.description);
      setInputKeyword(prof.keyword);
      setInputSchema(prof.schema);
      setInputPageContent(prof.pageContent || '');
      setVariationResults(null);
      setVariationError(null);
    }
  };

  const handleGenerateVariations = async () => {
    if (!inputPageContent.trim()) {
      setVariationError('Please provide webpage content in the "Webpage Reference Content" field first.');
      return;
    }
    setIsGeneratingVariations(true);
    setVariationError(null);
    try {
      const response = await fetch('/api/seo/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_variations',
          text: inputPageContent,
          targetKeyword: inputKeyword
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate tag recommendations.');
      }
      const data = await response.json();
      const parsed = JSON.parse(data.text);
      if (parsed && parsed.titles && parsed.descriptions) {
        setVariationResults(parsed);
      } else {
        throw new Error('Invalid formatting structure received from AI models.');
      }
    } catch (e: any) {
      console.error('AISuggestionsError:', e);
      setVariationError(e.message || 'Unified suggestion processor was unable to resolve content arrays.');
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const evaluation = useMemo(() => {
    const result = {
      score: 0,
      metrics: {
        title: { status: 'fail' as 'pass'|'warning'|'fail', score: 0, msg: '', details: '' },
        desc: { status: 'fail' as 'pass'|'warning'|'fail', score: 0, msg: '', details: '' },
        keywordInTitle: { status: 'fail' as 'pass'|'warning'|'fail', score: 0, msg: '', details: '' },
        keywordInDesc: { status: 'fail' as 'pass'|'warning'|'fail', score: 0, msg: '', details: '' },
        keywordDensity: { status: 'fail' as 'pass'|'warning'|'fail', score: 0, msg: '', details: '' },
        schema: { status: 'fail' as 'pass'|'warning'|'fail', score: 0, msg: '', details: '' }
      },
      recommendations: [] as string[]
    };

    const titleLength = inputTitle.trim().length;
    // Rule 1: Title Length (Best: 30 - 60 chars)
    if (titleLength === 0) {
      result.metrics.title = {
        status: 'fail',
        score: 0,
        msg: 'Title tag is empty',
        details: 'Must be 30–60 characters to capture maximum CTR and prevent search result clipping.'
      };
      result.recommendations.push('Add a concise page title between 30 and 60 characters.');
    } else if (titleLength < 30) {
      result.metrics.title = {
        status: 'warning',
        score: 10,
        msg: `Title is too short (${titleLength} chars)`,
        details: 'Slightly too short. Expand title to supply search algorithms with more relevant terms.'
      };
      result.recommendations.push('Expand page title length to at least 30 characters.');
    } else if (titleLength > 60) {
      result.metrics.title = {
        status: 'warning',
        score: 10,
        msg: `Title is too long (${titleLength} chars)`,
        details: 'Longer than 60 chars. Characters beyond 60 might be cut off (...) on visual search engine results pages.'
      };
      result.recommendations.push('Reduce title length under 60 characters to avoid snippet truncation.');
    } else {
      result.metrics.title = {
        status: 'pass',
        score: 20,
        msg: `Optimal length (${titleLength} chars)`,
        details: 'Perfect! Fall precisely within the 30-60 character standard of search engines.'
      };
    }

    // Rule 2: Description Length (Best: 75 - 160 chars)
    const descLength = inputDesc.trim().length;
    if (descLength === 0) {
      result.metrics.desc = {
        status: 'fail',
        score: 0,
        msg: 'Meta description is missing',
        details: 'Description tags act as organic sales pitch copy in the layout snippets. Do not omit.'
      };
      result.recommendations.push('Write a meta description summary summarizing the page benefits.');
    } else if (descLength < 75) {
      result.metrics.desc = {
        status: 'warning',
        score: 10,
        msg: `Description too short (${descLength} chars)`,
        details: 'A short description fails to leverage full search snippet real estate. Recommend expanding of values.'
      };
      result.recommendations.push('Lengthen the meta description to at least 75-160 characters.');
    } else if (descLength > 160) {
      result.metrics.desc = {
        status: 'warning',
        score: 10,
        msg: `Description too long (${descLength} chars)`,
        details: 'Longer than 160 chars. Text beyond 160 characters will likely get clipped in mobile and desktop snippets.'
      };
      result.recommendations.push('Shorten description under 160 characters to ensure full readability.');
    } else {
      result.metrics.desc = {
        status: 'pass',
        score: 20,
        msg: `Optimal length (${descLength} chars)`,
        details: 'Excellent. Standard descriptions operate cleanly between 75 and 160 characters.'
      };
    }

    // Rule 3: Keyword presence and density
    const hasKeyword = inputKeyword.trim().length > 0;
    const kw = inputKeyword.toLowerCase().trim();
    const titleLower = inputTitle.toLowerCase();
    const descLower = inputDesc.toLowerCase();

    if (!hasKeyword) {
      result.metrics.keywordInTitle = {
        status: 'warning',
        score: 10,
        msg: 'No focus keyword defined',
        details: 'Define a focus keyword to accurately calculate keyword correlation indices.'
      };
      result.metrics.keywordInDesc = {
        status: 'warning',
        score: 10,
        msg: 'No focus keyword defined',
        details: 'Without keywords, on-page term calculations are generic.'
      };
      result.metrics.keywordDensity = {
        status: 'warning',
        score: 10,
        msg: 'N/A',
        details: 'Please define a focus keyword to run density metrics audits.'
      };
      result.recommendations.push('Choose a specific target focus keyword/phrase to evaluate metadata placement.');
    } else {
      // Check keyword in title
      if (titleLower.includes(kw)) {
        result.metrics.keywordInTitle = {
          status: 'pass',
          score: 15,
          msg: `Found keyword term "${kw}"`,
          details: 'Having your focus keyword in the beginning/middle of your page title is a core ranking signal.'
        };
      } else {
        result.metrics.keywordInTitle = {
          status: 'fail',
          score: 0,
          msg: 'Keyword missing from title',
          details: 'Target keywords must be placed in title text to tell crawlers what the page focuses on.'
        };
        result.recommendations.push(`Include the focus keyword "${kw}" naturally in your page title.`);
      }

      // Check keyword in description
      if (descLower.includes(kw)) {
        result.metrics.keywordInDesc = {
          status: 'pass',
          score: 15,
          msg: `Found keyword term "${kw}"`,
          details: 'Keywords are highlighted in bold on engine queries if they match user search inputs.'
        };
      } else {
        result.metrics.keywordInDesc = {
          status: 'fail',
          score: 0,
          msg: 'Keyword missing from description',
          details: 'Having the keyword in description aligns relevance flags for scanning robots.'
        };
        result.recommendations.push(`Embed the target keyword "${kw}" inside the meta description draft.`);
      }

      // Keyword density check
      const combinedText = (inputTitle + ' ' + inputDesc).toLowerCase();
      const occurrences = kw ? (combinedText.split(kw).length - 1) : 0;
      const totalWords = combinedText.split(/\s+/).filter(w => w.length > 0).length;
      const kwWordsCount = kw.split(/\s+/).length;
      const matchedWords = occurrences * kwWordsCount;
      const density = totalWords > 0 ? (matchedWords / totalWords) * 100 : 0;

      if (occurrences === 0) {
        result.metrics.keywordDensity = {
          status: 'fail',
          score: 0,
          msg: '0% Keyword density',
          details: 'The focus keyword is absent from the page header elements.'
        };
      } else if (density > 5.5) {
        result.metrics.keywordDensity = {
          status: 'warning',
          score: 5,
          msg: `${density.toFixed(1)}% Density (Too high)`,
          details: 'Keyword stuffing detected. Having a density above 5.5% can penalize the page for search engines.'
        };
        result.recommendations.push(`Reduce the frequency of the keyword "${kw}" to prevent search crawlers penalizing for stuffing.`);
      } else if (density >= 1.0 && density <= 4.5) {
        result.metrics.keywordDensity = {
          status: 'pass',
          score: 10,
          msg: `${density.toFixed(1)}% Density (Excellent)`,
          details: 'Normal range. Standard content density benchmarks hover safely between 1.0% and 4.5%.'
        };
      } else {
        result.metrics.keywordDensity = {
          status: 'pass',
          score: 10,
          msg: `${density.toFixed(1)}% Density (Moderate)`,
          details: 'Safe density, but can be slightly enhanced to emphasize relevance.'
        };
      }
    }

    // Rule 4: Schema markup presence and validity
    const trimmedSchema = inputSchema.trim();
    if (!trimmedSchema) {
      result.metrics.schema = {
        status: 'fail',
        score: 0,
        msg: 'No Schema JSON-LD code detected',
        details: 'Structured Schema markup provides explicit clues about the meaning of a page to search engines.'
      };
      result.recommendations.push('Add a structured Entity or WebApplication JSON-LD schema markup block.');
    } else {
      try {
        const parsedObj = JSON.parse(trimmedSchema);
        const typeStr = parsedObj?.['@type'] || parsedObj?.['@context'];
        if (typeStr) {
          result.metrics.schema = {
            status: 'pass',
            score: 20,
            msg: `Valid Schema Markup (${parsedObj?.['@type'] || 'Structured'})`,
            details: 'Valid JSON-LD schema config successfully parsed on crawler mock syntax verification.'
          };
        } else {
          result.metrics.schema = {
            status: 'warning',
            score: 10,
            msg: 'Schema parsed, but missing context/type keys',
            details: 'Ensure standard @context: "https://schema.org" and @type are properly mapped in root.'
          };
          result.recommendations.push('Confirm that your JSON-LD schema specifies an "@type" and "@context" values.');
        }
      } catch (e) {
        result.metrics.schema = {
          status: 'fail',
          score: 5,
          msg: 'Invalid JSON-LD Syntax',
          details: 'Draft JSON code contains syntax faults (commas, quotes, or bracket errors). Cannot construct graphs.'
        };
        result.recommendations.push('Fix JSON-LD syntax errors in the Schema code snippet area so crawlers can parse it.');
      }
    }

    // Calculate sum of rules score
    const baseScore = 
      result.metrics.title.score +
      result.metrics.desc.score +
      result.metrics.keywordInTitle.score +
      result.metrics.keywordInDesc.score +
      result.metrics.keywordDensity.score +
      result.metrics.schema.score;
    result.score = Math.min(Math.max(baseScore, 0), 100);

    return result;
  }, [inputTitle, inputDesc, inputKeyword, inputSchema]);

  const websiteUrl = 'https://apexutility.live';
  const currentDateISO = '2026-06-05';

  // Sitemap XML markup string
  const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- PRIMARY PORT OPERATIONS DECK -->
  <url>
    <loc>${websiteUrl}/</loc>
    <lastmod>${currentDateISO}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.00</priority>
  </url>

  <!-- DOCUMENT OPTIMIZATION RESUMES COMPRESSOR -->
  <url>
    <loc>${websiteUrl}/pdf-document-optimizer/compress-pdf</loc>
    <lastmod>${currentDateISO}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>

  <!-- MEDIA PRODUCTION INSTANT WEBPE CONVERTER -->
  <url>
    <loc>${websiteUrl}/media-producer-toolkit/webp-converter</loc>
    <lastmod>${currentDateISO}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>

  <!-- DEVELOPER UTILITIES JSON FORMATTER & PARSER -->
  <url>
    <loc>${websiteUrl}/developer-utilities/json-beautifier</loc>
    <lastmod>${currentDateISO}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
</urlset>`;

  // Robots.txt content string
  const robotsTxt = `# APEX UTILITY Crawler Instructions
User-agent: *
Allow: /

Sitemap: ${websiteUrl}/sitemap.xml`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  // Circular gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (evaluation.score / 100) * circumference;

  const getGaugeColor = (score: number) => {
    if (score >= 85) return 'stroke-emerald-500 text-emerald-400';
    if (score >= 55) return 'stroke-amber-500 text-amber-500';
    return 'stroke-rose-500 text-rose-500';
  };

  const scoreTextColorClass = evaluation.score >= 85 
    ? 'text-emerald-400' 
    : evaluation.score >= 55 
    ? 'text-amber-500' 
    : 'text-rose-500 animate-pulse';

  const metricsList = [
    {
      key: 'title',
      label: 'Page Title length',
      data: evaluation.metrics.title,
      optimal: '30 - 60 chars',
      actual: `${inputTitle.trim().length} chars`
    },
    {
      key: 'desc',
      label: 'Description length',
      data: evaluation.metrics.desc,
      optimal: '75 - 160 chars',
      actual: `${inputDesc.trim().length} chars`
    },
    {
      key: 'keywordInTitle',
      label: 'Keyword in Title',
      data: evaluation.metrics.keywordInTitle,
      optimal: 'Included',
      actual: inputKeyword.trim() ? (inputTitle.toLowerCase().includes(inputKeyword.toLowerCase().trim()) ? 'Yes' : 'No') : 'N/A'
    },
    {
      key: 'keywordInDesc',
      label: 'Keyword in Meta Description',
      data: evaluation.metrics.keywordInDesc,
      optimal: 'Included',
      actual: inputKeyword.trim() ? (inputDesc.toLowerCase().includes(inputKeyword.toLowerCase().trim()) ? 'Yes' : 'No') : 'N/A'
    },
    {
      key: 'keywordDensity',
      label: 'Focus Keyword Density',
      data: evaluation.metrics.keywordDensity,
      optimal: '1.0% - 4.5%',
      actual: evaluation.metrics.keywordDensity.msg
    },
    {
      key: 'schema',
      label: 'Structured JSON-LD schema',
      data: evaluation.metrics.schema,
      optimal: 'Valid JSON-LD',
      actual: inputSchema.trim() ? 'Present' : 'Absent'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Header Info Banner */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-500/15 border border-rose-500/25 text-rose-400 text-xs font-mono font-bold uppercase">
          <Cpu className="w-3.5 h-3.5" />
          <span>SEO Optimization Engine Active</span>
        </div>
        <h1 className="font-heading text-3xl font-black text-white tracking-tight">
          Automated Dynamic Sitemap Generator
        </h1>
        <p className="font-sans text-sm text-[#94a3b8] max-w-2xl leading-relaxed">
          Technical SEO monitoring center. Preview and download pristine search-compliant crawl arrays configured to optimize sitemap indexings across Cloudflare edges instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* SITEMAP.XML PREVIEW PANEL */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-rose-500" />
              <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">sitemap.xml Output</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(xmlSitemap, 'sitemap')}
                className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 'sitemap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIndex === 'sitemap' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => triggerDownload(xmlSitemap, 'sitemap.xml', 'text/xml')}
                className="px-2.5 py-1 text-[10px] font-mono text-rose-400 hover:text-rose-300 rounded bg-rose-950/15 border border-rose-500/20 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export XML</span>
              </button>
            </div>
          </div>

          <div className="beveled-panel p-5 bg-[#08080c] border-rose-950/10 min-h-[350px] relative max-h-[450px] overflow-auto">
            <pre className="font-mono text-[11px] text-zinc-400 leading-normal whitespace-pre">
              <code>{xmlSitemap}</code>
            </pre>
          </div>
        </div>

        {/* ROBOTS.TXT PREVIEW PANEL & SEO STATS */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" />
                <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">robots.txt Instructions</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(robotsTxt, 'robots')}
                  className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedIndex === 'robots' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIndex === 'robots' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => triggerDownload(robotsTxt, 'robots.txt', 'text/plain')}
                  className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Export TXT</span>
                </button>
              </div>
            </div>

            <div className="beveled-panel p-5 bg-[#08080c] border-zinc-900 min-h-[120px] overflow-auto">
              <pre className="font-mono text-[11px] text-zinc-400 leading-normal whitespace-pre">
                <code>{robotsTxt}</code>
              </pre>
            </div>
          </div>

          {/* Crawler Priority Matrix & Recommendations */}
          <div className="beveled-panel p-6 border-rose-950/15 bg-rose-950/[0.03] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-rose-540 text-rose-500" />
              <h4 className="font-heading text-xs font-bold text-rose-400 uppercase tracking-widest">Dynamic Priority Directives</h4>
            </div>
            
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Crawlers rank resources based on strict weighting patterns. Our index maps have locked the optimization routes with high priority scores:
            </p>

            <ul className="space-y-3 font-mono text-[10px]">
              <li className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-550">HOMEPAGE CORE:</span>
                <span className="text-emerald-400 font-bold">Priority: 1.00 (Weekly)</span>
              </li>
              <li className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-550">PDF OPTIMIZATION RESUMES:</span>
                <span className="text-zinc-350">Priority: 0.85 (Weekly)</span>
              </li>
              <li className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-550">WEBP IMAGE RASTERIZER:</span>
                <span className="text-zinc-350">Priority: 0.85 (Weekly)</span>
              </li>
              <li className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-550">JSON SWISS PARSER:</span>
                <span className="text-zinc-350">Priority: 0.75 (Weekly)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* AUTOMATED META-DATA & SCHEMA COMPLIANCE AUDITOR */}
      <div id="seo-compliance-auditor-section" className="space-y-6 pt-10 border-t border-zinc-900/60">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-1">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
              <Cpu className="w-3 h-3" />
              <span>Diagnostic System Online</span>
            </div>
            <h3 className="font-heading text-xl font-black text-white tracking-tight uppercase">
              Automated Meta-Data Compliance Auditor
            </h3>
            <p className="font-sans text-xs text-[#94a3b8] max-w-xl">
              Evaluate page meta-tags against standard crawler best practice specifications including strict lengths, keyword relevance factors, and JSON-LD structured schemas.
            </p>
          </div>

          {/* Preset scenarios quick-loader tabs */}
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold md:text-right">
              Quick Load Scenario:
            </span>
            <div id="preset-audit-pills" className="flex flex-wrap gap-1.5 p-1 bg-zinc-950 border border-zinc-900 rounded-lg">
              {AUDIT_PROFILES.map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  id={`preset-audit-pill-${prof.id}`}
                  onClick={() => handleLoadAuditProfile(prof.id)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded transition-all cursor-pointer ${
                    selectedAuditProfile === prof.id
                      ? 'bg-rose-500 text-white font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                  }`}
                >
                  {prof.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analyzer Grid Container */}
        <div id="compliance-auditor-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Form input controls */}
          <div id="compliance-inputs-beveled" className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900/60">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-500" />
                <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">Page Meta Parameters</span>
              </div>
              <button
                type="button"
                id="reset-audit-form-btn"
                onClick={() => {
                  setSelectedAuditProfile('custom-empty');
                  setInputUrl('https://apexutility.live/draft-testing');
                  setInputTitle('');
                  setInputDesc('');
                  setInputKeyword('');
                  setInputSchema('');
                }}
                className="px-2 py-0.5 text-[9px] font-mono text-zinc-500 hover:text-rose-450 rounded bg-zinc-950 border border-zinc-900 hover:border-rose-950/40 cursor-pointer flex items-center gap-1 transition-all"
              >
                Clear Inputs
              </button>
            </div>

            <div className="space-y-4">
              {/* Target url */}
              <div id="audit-url-cell" className="space-y-1">
                <label htmlFor="audit-url-input" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
                  Reference Address (URL)
                </label>
                <input
                  type="text"
                  id="audit-url-input"
                  value={inputUrl}
                  onChange={(e) => {
                    setSelectedAuditProfile('');
                    setInputUrl(e.target.value);
                  }}
                  className="w-full bg-[#030305] border border-zinc-900 rounded p-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-rose-500/40"
                  placeholder="https://test.me"
                />
              </div>

              {/* Target Focus Keyword */}
              <div id="audit-key-cell" className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  <label htmlFor="audit-key-input">Focus Keyphrase / Keywords</label>
                  <span className="text-[8px] bg-zinc-900 text-zinc-400 border border-zinc-850 px-1 rounded">Density Audited</span>
                </div>
                <input
                  type="text"
                  id="audit-key-input"
                  value={inputKeyword}
                  onChange={(e) => {
                    setSelectedAuditProfile('');
                    setInputKeyword(e.target.value);
                  }}
                  className="w-full bg-[#030305] border border-zinc-900 rounded p-2 text-xs font-mono text-zinc-350 focus:outline-none focus:border-rose-500/40"
                  placeholder="e.g. compress pdf, image format"
                />
              </div>

              {/* Title String */}
              <div id="audit-title-cell" className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  <label htmlFor="audit-title-input">Page Title Tag</label>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    inputTitle.trim().length >= 30 && inputTitle.trim().length <= 60
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {inputTitle.trim().length} chars (Range: 30-60)
                  </span>
                </div>
                <input
                  type="text"
                  id="audit-title-input"
                  value={inputTitle}
                  onChange={(e) => {
                    setSelectedAuditProfile('');
                    setInputTitle(e.target.value);
                  }}
                  className="w-full bg-[#030305] border border-zinc-900 rounded p-2 text-xs font-mono text-zinc-350 focus:outline-none focus:border-rose-500/40"
                  placeholder="Insert attractive title snippet..."
                />
              </div>

              {/* Description Script */}
              <div id="audit-desc-cell" className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  <label htmlFor="audit-desc-input">Meta Description String</label>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    inputDesc.trim().length >= 75 && inputDesc.trim().length <= 160
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {inputDesc.trim().length} chars (Range: 75-160)
                  </span>
                </div>
                <textarea
                  id="audit-desc-input"
                  value={inputDesc}
                  onChange={(e) => {
                    setSelectedAuditProfile('');
                    setInputDesc(e.target.value);
                  }}
                  rows={3}
                  className="w-full bg-[#030305] border border-zinc-900 rounded p-2 text-xs font-mono text-zinc-350 focus:outline-none focus:border-rose-500/40 resize-none leading-relaxed"
                  placeholder="Supply descriptive meta summary to show under SERP..."
                />
              </div>

              {/* Schema JSON data */}
              <div id="audit-schema-cell" className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  <label htmlFor="audit-schema-input">Schema microdata graph (JSON-LD)</label>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${evaluation.metrics.schema.status === 'pass' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                    <span className="text-[8px] font-black uppercase">Valid Structure</span>
                  </div>
                </div>
                <textarea
                  id="audit-schema-input"
                  value={inputSchema}
                  onChange={(e) => {
                    setSelectedAuditProfile('');
                    setInputSchema(e.target.value);
                  }}
                  rows={4}
                  className="w-full bg-[#030305] border border-zinc-900 rounded p-2 text-[10.5px] font-mono text-emerald-400 focus:outline-none focus:border-rose-500/40 resize-y leading-normal"
                  placeholder="Paste or write structured JSON schema data..."
                />
              </div>
            </div>
          </div>

          {/* Evaluation Diagnostics & Score */}
          <div id="compliance-results-panel" className="space-y-5">
            
            {/* Compliance score card */}
            <div id="compliance-score-box" className="beveled-panel bg-[#09090d]/95 p-5 border-brand-border/40 grid grid-cols-1 md:grid-cols-12 gap-5 items-center shadow-xl">
              
              {/* Dynamic SVG Score Ring Gauge */}
              <div id="compliance-gauge-col" className="col-span-1 md:col-span-4 flex justify-center flex-col items-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="stroke-zinc-900 fill-none"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className={`fill-none transition-all duration-500 ${getGaugeColor(evaluation.score)}`}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className={`font-mono text-xl font-black ${scoreTextColorClass}`}>{evaluation.score}</span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Score</span>
                  </div>
                </div>
              </div>

              {/* Assessment Message */}
              <div id="compliance-verdict-col" className="col-span-1 md:col-span-8 space-y-2 text-center md:text-left">
                <div id="compliance-badge-row" className="flex items-center justify-center md:justify-start gap-2">
                  <span id="verdict-label" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                    Diagnostic verdict:
                  </span>
                  <span id="verdict-status-badge" className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    evaluation.score >= 85
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : evaluation.score >= 55
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                  }`}>
                    {evaluation.score >= 85 ? 'SEO Optimal' : evaluation.score >= 55 ? 'Needs Adjustment' : 'Severe SEO Issues'}
                  </span>
                </div>
                <h4 id="verdict-title" className="font-heading text-sm font-bold text-white uppercase tracking-wide">
                  {evaluation.score === 100 
                    ? 'Perfect Search Configuration' 
                    : evaluation.score >= 85 
                    ? 'Excellent Compliance Metrics' 
                    : evaluation.score >= 55 
                    ? 'Improvement Potential Identified' 
                    : 'Suboptimal Metadata Detected'}
                </h4>
                <p id="verdict-explanation" className="font-sans text-[11px] text-[#94a3b8] leading-relaxed">
                  {evaluation.score === 100 
                    ? 'All lengths, focus keyword tags, and structured JSON graphs parameters check green.'
                    : evaluation.score >= 85 
                    ? 'Almost complete! Resolve the minor warnings to get absolute peak visibility scores.'
                    : evaluation.score >= 55 
                    ? 'Moderate crawl discrepancies. Review recommended changes to stabilize rankings.'
                    : 'Search engines might overlook or penalize this page structure. Repair core failed tags.'}
                </p>
              </div>
            </div>

            {/* List of rules & status cards */}
            <div id="compliance-checklist-box" className="space-y-2 bg-[#050508] border border-zinc-900 rounded-xl p-4.5">
              <h5 className="font-heading text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-2 border-b border-zinc-900 mb-3">
                Core Rules Checklist
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metricsList.map((m) => {
                  const s = m.data.status;
                  return (
                    <div 
                      key={m.key} 
                      id={`compliance-metric-card-${m.key}`}
                      className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                        s === 'pass'
                          ? 'bg-emerald-950/[0.03] border-emerald-500/10'
                          : s === 'warning'
                          ? 'bg-amber-950/[0.03] border-amber-500/10'
                          : 'bg-rose-950/[0.03] border-rose-500/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-heading text-[10.5px] font-bold text-white leading-normal">
                          {m.label}
                        </span>
                        
                        {/* Circle badge indicator */}
                        {s === 'pass' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : s === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                          <span>Target: {m.optimal}</span>
                          <span className={`font-bold uppercase ${
                            s === 'pass' ? 'text-emerald-400' : s === 'warning' ? 'text-amber-500' : 'text-rose-450'
                          }`}>
                            ({m.actual})
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2" title={m.data.details}>
                          {m.data.msg || m.data.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations log */}
            <div id="compliance-recommendations-panel" className="beveled-panel bg-[#09090d]/95 p-5 border-brand-border/40 space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-900/60">
                <Lightbulb className="w-4 h-4 text-rose-500" />
                <span className="font-heading text-xs font-bold text-white uppercase tracking-wider block font-sans">
                  Crawler Action Recommendations
                </span>
                {evaluation.recommendations.length > 0 && (
                  <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.2 rounded font-mono font-bold">
                    {evaluation.recommendations.length} Pending
                  </span>
                )}
              </div>

              {evaluation.recommendations.length > 0 ? (
                <div id="compliance-recs-scroller" className="space-y-2 max-h-[160px] overflow-y-auto">
                  {evaluation.recommendations.map((rec, index) => (
                    <div 
                      key={index} 
                      id={`compliance-rec-${index}`}
                      className="flex items-start gap-2.5 p-2 rounded bg-zinc-950 border border-zinc-900 animate-slide-up"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <p className="font-sans text-[11px] text-zinc-350 leading-normal">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div id="compliance-recs-perfect" className="flex flex-col items-center justify-center py-4 text-center space-y-1 bg-emerald-950/10 border border-emerald-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="font-heading text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Perfect 100% Score</span>
                  <p className="font-sans text-[10px] text-zinc-400 max-w-xs">
                    This metadata sets the optimal balance for indexing speed and CTR. Highly compliant.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* AI SEO OPTIMIZER VARIATION ENGINE */}
      <div id="ai-seo-variations-section" className="space-y-6 pt-10 border-t border-zinc-900/60">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-1">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>AI Auto-Suggestion Engine</span>
            </div>
            <h3 className="font-heading text-xl font-black text-white tracking-tight uppercase">
              Metadata Variations Generator
            </h3>
            <p className="font-sans text-xs text-[#94a3b8] max-w-xl">
              Construct high click-through rate copy variations matching psychological search styles by direct semantic analysis of your webpage's copy layout.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Page body content controller */}
          <div className="col-span-1 lg:col-span-5 space-y-4">
            <div className="beveled-panel bg-[#09090d]/95 p-5 border-brand-border/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900/60">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">Webpage Reference Content</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500">
                  {inputPageContent.split(/\s+/).filter(Boolean).length} Words
                </span>
              </div>

              <div className="space-y-3">
                <p className="font-sans text-[11px] text-zinc-350 leading-relaxed">
                  Provide webpage visual copy, article content, or description text here. The AI model parses this to extract critical context.
                </p>
                <textarea
                  id="ai-page-content-input"
                  value={inputPageContent}
                  onChange={(e) => setInputPageContent(e.target.value)}
                  rows={5}
                  className="w-full bg-[#030305] border border-zinc-900 rounded p-2 text-xs font-sans text-zinc-350 focus:outline-none focus:border-rose-500/40 leading-relaxed"
                  placeholder="Paste webpage body draft, benefits overview, product details, or article text here..."
                />

                <button
                  type="button"
                  id="generate-variations-trigger-btn"
                  onClick={handleGenerateVariations}
                  disabled={isGeneratingVariations}
                  className="w-full py-2 px-4 rounded-lg bg-rose-500 hover:bg-rose-450 disabled:bg-zinc-900 text-white font-heading font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all disabled:text-zinc-650 disabled:cursor-not-allowed border border-rose-600/30 active:scale-[0.98]"
                >
                  {isGeneratingVariations ? (
                    <>
                      <Cpu className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Variations...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Suggest Meta Variations</span>
                    </>
                  )}
                </button>

                {variationError && (
                  <div className="p-3 bg-rose-950/10 border border-rose-500/25 rounded-md text-rose-400 text-[10.5px] font-mono leading-relaxed animate-fade-in/70">
                    {variationError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results chest */}
          <div className="col-span-1 lg:col-span-7">
            {isGeneratingVariations ? (
              <div className="beveled-panel bg-[#09090d]/35 min-h-[300px] border-zinc-900 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-rose-500/10 border-t-rose-500 animate-spin"></div>
                  <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" />
                </div>
                <div className="space-y-1.5 animate-pulse">
                  <span className="font-heading text-xs font-bold text-white block uppercase tracking-wider">Refining Optimized Variants</span>
                  <p className="font-sans text-[10px] text-zinc-400 max-w-xs leading-normal">
                    Parsing layout semantic copy, aligning with keyword correlation parameters and click metrics...
                  </p>
                </div>
              </div>
            ) : variationResults ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Optimized Titles Column */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-heading text-xs font-black text-white uppercase tracking-wider">
                        Optimized Page Titles
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">3 Variations</span>
                    </div>

                    <div className="space-y-3">
                      {variationResults.titles.map((title, i) => {
                        const count = title.text.length;
                        const isOptimal = count >= 30 && count <= 60;
                        return (
                          <div
                            key={i}
                            className="beveled-panel bg-zinc-950/95 border-zinc-900 p-3.5 space-y-2.5 flex flex-col justify-between transition-all hover:border-rose-950/30"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                                title.style.toLowerCase().includes('ctr')
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : title.style.toLowerCase().includes('creative')
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/15'
                                  : 'bg-sky-500/10 text-sky-400 border border-sky-500/15'
                              }`}>
                                {title.style}
                              </span>
                              <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded font-black ${
                                isOptimal
                                  ? 'bg-emerald-950/20 text-emerald-400 font-bold'
                                  : 'bg-amber-950/25 text-amber-500'
                              }`}>
                                {count} Chars
                              </span>
                            </div>

                            <p className="font-heading text-xs font-bold text-white leading-snug">
                              {title.text}
                            </p>

                            <p className="font-sans text-[10px] text-zinc-400 italic">
                              "{title.explanation}"
                            </p>

                            <div className="flex justify-end gap-2 pt-1 border-t border-zinc-900/60">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(title.text, `suggest-title-${i}`)}
                                className="px-2 py-1 rounded bg-zinc-950 border border-zinc-900 hover:text-white transition-all text-[9.5px] font-mono cursor-pointer flex items-center gap-1.5 text-zinc-400 hover:bg-[#16161f]"
                              >
                                {copiedIndex === `suggest-title-${i}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-zinc-500" />
                                )}
                                <span>Copy</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAuditProfile('');
                                  setInputTitle(title.text);
                                }}
                                className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-[9.5px] font-mono font-black uppercase cursor-pointer flex items-center gap-1"
                              >
                                <span>Apply to Audit</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optimized Descriptions Column */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-heading text-xs font-black text-white uppercase tracking-wider">
                        Optimized Meta Descriptions
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">3 Variations</span>
                    </div>

                    <div className="space-y-3">
                      {variationResults.descriptions.map((desc, i) => {
                        const count = desc.text.length;
                        const isOptimal = count >= 75 && count <= 160;
                        return (
                          <div
                            key={i}
                            className="beveled-panel bg-zinc-950/95 border-zinc-900 p-3.5 space-y-2.5 flex flex-col justify-between transition-all hover:border-rose-950/30"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                                desc.style.toLowerCase().includes('ctr')
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : desc.style.toLowerCase().includes('creative')
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/15'
                                  : 'bg-sky-500/10 text-sky-400 border border-sky-500/15'
                              }`}>
                                {desc.style}
                              </span>
                              <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded font-black ${
                                isOptimal
                                  ? 'bg-emerald-950/20 text-emerald-400 font-bold'
                                  : 'bg-amber-950/25 text-amber-500'
                              }`}>
                                {count} Chars
                              </span>
                            </div>

                            <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                              {desc.text}
                            </p>

                            <p className="font-sans text-[10px] text-zinc-400 italic">
                              "{desc.explanation}"
                            </p>

                            <div className="flex justify-end gap-2 pt-1 border-t border-zinc-900/60">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(desc.text, `suggest-desc-${i}`)}
                                className="px-2 py-1 rounded bg-zinc-950 border border-zinc-900 hover:text-white transition-all text-[9.5px] font-mono cursor-pointer flex items-center gap-1.5 text-zinc-400 hover:bg-[#16161f]"
                              >
                                {copiedIndex === `suggest-desc-${i}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-zinc-500" />
                                )}
                                <span>Copy</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAuditProfile('');
                                  setInputDesc(desc.text);
                                }}
                                className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-[9.5px] font-mono font-black uppercase cursor-pointer flex items-center gap-1"
                              >
                                <span>Apply to Audit</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="beveled-panel bg-[#09090d]/35 min-h-[300px] border-zinc-900 flex flex-col items-center justify-center p-8 text-center space-y-3 leading-6">
                <Sparkles className="w-8 h-8 text-rose-500 opacity-60" />
                <div className="space-y-1">
                  <span className="font-heading text-xs font-bold text-zinc-300 block uppercase tracking-wide">
                    Chest Awaiting Generation
                  </span>
                  <p className="font-sans text-[10.5px] text-zinc-500 max-w-sm leading-normal">
                    Set up your page parameters and text body content, then press the "Suggest Meta Variations" trigger button to draft Click-Through rate and SEO optimized meta-descriptor lists.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STRUCTURED DATA JSON-LD SCHEMAS SECTION */}
      <div className="space-y-4 pt-6 border-t border-zinc-900/60">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-rose-500" />
              <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">Generated JSON-LD Schema Markups</h3>
            </div>
            <p className="font-sans text-xs text-[#94a3b8]">
              Inject structured microdata templates to boost search result rich snippets and entity rankings.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor="active-schema-profile" className="sr-only">Select Schema Profile</label>
            <select
              id="active-schema-profile"
              value={activeProfileId}
              onChange={(e) => setActiveProfileId(e.target.value)}
              className="py-1 px-3 bg-zinc-950 border border-zinc-900 focus:border-rose-500 text-zinc-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow-md select-none focus:outline-none"
            >
              {SCHEMA_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                const profile = SCHEMA_PROFILES.find(p => p.id === activeProfileId);
                if (profile) {
                  copyToClipboard(JSON.stringify(profile.code, null, 2), `schema-${profile.id}`);
                }
              }}
              className="px-3.5 py-1.5 text-xs font-mono text-zinc-300 hover:text-white rounded-lg bg-zinc-950 hover:bg-[#16161f] border border-zinc-905 hover:border-zinc-800 flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              title="Copy JSON-LD Schema Markup to Clipboard"
            >
              {copiedIndex === `schema-${activeProfileId}` ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span>{copiedIndex === `schema-${activeProfileId}` ? 'Copied' : 'Copy Schema'}</span>
            </button>

            <button
              onClick={() => {
                const profile = SCHEMA_PROFILES.find(p => p.id === activeProfileId);
                if (profile) {
                  triggerDownload(JSON.stringify(profile.code, null, 2), `${profile.id}_schema_ld.json`, 'application/json');
                }
              }}
              className="px-3.5 py-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 rounded-lg bg-rose-950/10 hover:bg-rose-950/20 border border-rose-500/20 flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              title="Export structured JSON-LD draft schema markups"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON-LD</span>
            </button>
          </div>
        </div>

        {/* Selected Profile Explanation Badge */}
        {(() => {
          const activeProfile = SCHEMA_PROFILES.find(p => p.id === activeProfileId);
          if (!activeProfile) return null;
          return (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-950/5 border border-rose-950/15 rounded-xl animate-fade-in">
              <CheckCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5 animate-slide-up">
                <span className="font-heading text-xs font-bold text-white block uppercase tracking-wide">{activeProfile.name} Parameters</span>
                <p className="font-sans text-[11px] text-zinc-400 leading-normal">{activeProfile.description}</p>
              </div>
            </div>
          );
        })()}

        {/* JSON Code Code Block */}
        <div className="beveled-panel p-5 bg-[#08080c] border-rose-950/10 min-h-[180px] relative max-h-[320px] overflow-auto">
          <pre className="font-mono text-[11px] text-emerald-400/90 leading-relaxed whitespace-pre">
            <code>
              {(() => {
                const profile = SCHEMA_PROFILES.find(p => p.id === activeProfileId);
                return profile ? JSON.stringify(profile.code, null, 2) : '';
              })()}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
