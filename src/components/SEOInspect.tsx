import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Globe, Download, Check, Copy, Code, Sparkles, FileText, 
  CheckCircle, ShieldAlert, Cpu, AlertTriangle, Lightbulb, Gauge, Layers,
  Award, ShieldCheck, Key, ArrowUpRight, Link2, Share2
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
    url: 'https://example.com/',
    title: 'Example Web Tools Forge - High Performance Developer Operations',
    description: 'High performance local-first tool suite optimized for developer operations, PDF operations, dynamic XML sitemaps, and secure image conversions.',
    keyword: 'developer operations',
    schema: JSON.stringify(SCHEMA_PROFILES[0].code, null, 2),
    pageContent: 'Our Tools Forge is a comprehensive, local-first set of web browser utilities. Users can convert visual image formats, compress large PDF documents legibly, combine several PDF files together with dynamic page dragging, format or beautify code syntactic arrays (like nested JSON structures), and perform in-browser SEO diagnostics, sitemap indexing crawls, and robots directives generator. Zero files are uploaded to any server, preserving total security and privacy.'
  },
  {
    id: 'webp-converter',
    name: 'WebP Converter',
    url: 'https://example.com/webp-converter',
    title: 'WebP Image Converter - Convert Image Formats Locally',
    description: 'Instantly read WebP vectors and convert to crisp PNG or compressed JPG quality locally. No server upload required.',
    keyword: 'convert image',
    schema: JSON.stringify(SCHEMA_PROFILES[1].code, null, 2),
    pageContent: 'An interactive offline-first image converter utility to instantly transform WebP files into crisp PNG format or standard compressed JPG formats. Ideal for developers and designers who need fast multi-file batch conversions inside their browsers without data leaving their local hardware.'
  },
  {
    id: 'compress-pdf',
    name: 'PDF Compressor',
    url: 'https://example.com/compress-pdf',
    title: 'Smart PDF Compressor - Shrink Files Legibly',
    description: 'Compress and structurally shrink document payload sizes without rasterization errors. Optimize speed and limit margins.',
    keyword: 'compress',
    schema: JSON.stringify(SCHEMA_PROFILES[2].code, null, 2),
    pageContent: 'Legibly and structurally shrink high-capacity PDF documents without ruining vector text, visual elements, or page dimensions. Perfect for developers, students, and businesses looking to reduce data sizes for email attachments or upload portals easily.'
  },
  {
    id: 'custom-empty',
    name: 'Draft (Demonstration of Bad SEO Practice / Fails)',
    url: 'https://example.com/test-route',
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
  const [inputUrl, setInputUrl] = useState('https://example.com/');
  const [inputTitle, setInputTitle] = useState('Example Web Tools Forge - High Performance Developer Operations');
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

  // Bing Webmaster Verification & E-E-A-T Trust Booster States
  const [rawBingVerification, setRawBingVerification] = useState('');
  const [rawGoogleVerification, setRawGoogleVerification] = useState('');
  const [aboutUsLinked, setAboutUsLinked] = useState(true);
  const [privacyPolicyLinked, setPrivacyPolicyLinked] = useState(true);
  const [termsOfServiceLinked, setTermsOfServiceLinked] = useState(true);

  // IndexNow API Key custom setup for zero-traffic websites
  const [indexNowKey, setIndexNowKey] = useState(() => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  });

  // Social Pre-rendering tags state
  const [ogTitle, setOgTitle] = useState('APEX UTILITY Forge - Local Web Utilities');
  const [ogDesc, setOgDesc] = useState('An outstanding suite of client-side developer utilities, WebP graphics optimization pipelines, and lightning-fast PDF tools.');
  const [ogImage, setOgImage] = useState('https://images.unsplash.com/photo-1618055182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
  const [twitterCreator, setTwitterCreator] = useState('@ApexForgeDev');

  // Parse raw Google validation inputs dynamically
  const cleanGoogleCode = useMemo(() => {
    const trimmed = rawGoogleVerification.trim();
    if (!trimmed) return '';
    
    // Look for content query inside meta tag: <meta name="google-site-verification" content="abcdef..." />
    const metaMatch = trimmed.match(/content=["']([^"']+)["']/i);
    if (metaMatch && metaMatch[1]) return metaMatch[1];

    // Look for filenames: google81a2b3c4d5e6f7.html
    const fileMatch = trimmed.match(/(google[a-f0-9]+\.html)/i);
    if (fileMatch) return fileMatch[1];

    return trimmed.slice(0, 60);
  }, [rawGoogleVerification]);

  // Parse raw verification inputs dynamically (meta tag, XML code, or hex)
  const cleanBingCode = useMemo(() => {
    const trimmed = rawBingVerification.trim();
    if (!trimmed) return '';
    // Look for content query inside meta tag: <meta name="msvalidate.01" content="A1B2C3D4E..." />
    const metaMatch = trimmed.match(/content=["']([A-F0-9a-f]{32})["']/i);
    if (metaMatch && metaMatch[1]) return metaMatch[1];
    
    // Look for node query inside XML: <user>A1B2C3D4E...</user>
    const xmlMatch = trimmed.match(/<user>([A-F0-9a-f]{32})<\/user>/i);
    if (xmlMatch && xmlMatch[1]) return xmlMatch[1];

    // Check for raw 32-character hexadecimal string
    const hex32Match = trimmed.match(/[A-F0-9a-f]{32}/i);
    if (hex32Match && hex32Match[0]) return hex32Match[0];

    return trimmed.slice(0, 48); // slice safeguard
  }, [rawBingVerification]);

  // Dynamic E-E-A-T Search Trust scoring loop (Out of 100 maximum score points)
  const trustEvaluation = useMemo(() => {
    let score = 0;
    const indicators: Array<{ name: string; score: number; pass: boolean; desc: string }> = [];

    // 1. SSL transport
    indicators.push({
      name: 'HTTPS Transport Layer Security Active',
      score: 10,
      pass: true,
      desc: 'SSL locks build natural credibility and prevent session manipulation triggers.'
    });
    score += 10;

    // 2. Robots.txt rules
    indicators.push({
      name: 'robots.txt crawl parameters structured',
      score: 10,
      pass: true,
      desc: 'Instructs search-engine crawlers around high-priority directory targets.'
    });
    score += 10;

    // 3. Sitemap presence
    indicators.push({
      name: 'sitemap.xml indexation pathways mapped',
      score: 10,
      pass: true,
      desc: 'Enables crawl spiders to find and digest all active developer utilities.'
    });
    score += 10;

    // 4. Schema markup mapping
    const hasSchema = inputSchema.trim().length > 15;
    indicators.push({
      name: 'Interactive Structured Schema LD-JSON graph',
      score: 10,
      pass: hasSchema,
      desc: 'Encourages high-impact visual rich snippets, rating stars, and FAQ drop-downs.'
    });
    if (hasSchema) score += 10;

    // 5. Google Search Console Setup
    const hasGoogle = cleanGoogleCode.length >= 8;
    indicators.push({
      name: 'Google Search Console (GSC) Domain Verified',
      score: 15,
      pass: hasGoogle,
      desc: 'Submits immediate indexing pulses to Google search nodes and monitors mobile vitals.'
    });
    if (hasGoogle) score += 15;

    // 6. Microsoft Bing Webmaster Setup
    const hasBing = cleanBingCode.length >= 8;
    indicators.push({
      name: 'Microsoft Bing Webmaster Portal Verified',
      score: 15,
      pass: hasBing,
      desc: 'Powers native instant-indexing crawls across Bing, Yahoo, and DuckDuckGo.'
    });
    if (hasBing) score += 15;

    // 7. About Us Authority link
    indicators.push({
      name: 'E-E-A-T Experience: Public Bio/About Us details',
      score: 10,
      pass: aboutUsLinked,
      desc: 'Passes manual search rater evaluations for transparency and author pedigree.'
    });
    if (aboutUsLinked) score += 10;

    // 8. Privacy rules
    indicators.push({
      name: 'E-E-A-T Transparency: Regulated Privacy Charter',
      score: 10,
      pass: privacyPolicyLinked,
      desc: 'Matches GDPR and California CCPA crawl-compliance algorithms.'
    });
    if (privacyPolicyLinked) score += 10;

    // 9. Terms validation
    indicators.push({
      name: 'E-E-A-T Trustworthiness: Active terms bounds',
      score: 10,
      pass: termsOfServiceLinked,
      desc: 'Deters scrapers and clarifies platform usage terms to search raters.'
    });
    if (termsOfServiceLinked) score += 10;

    return {
      score: Math.min(score, 100),
      indicators
    };
  }, [inputSchema, cleanGoogleCode, cleanBingCode, aboutUsLinked, privacyPolicyLinked, termsOfServiceLinked]);

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

  const websiteUrl = useMemo(() => {
    try {
      const u = new URL(inputUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      return 'https://example.com';
    }
  }, [inputUrl]);
  const hostNameUpper = useMemo(() => {
    try {
      return new URL(websiteUrl).hostname.toUpperCase();
    } catch {
      return 'EXAMPLE.COM';
    }
  }, [websiteUrl]);
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

      {/* SEARCH INDEXATION & BING/GOOGLE TRUST PORTAL */}
      <div className="space-y-6 pt-10 border-t border-zinc-900/60 text-left">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-1">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Domain Trust & Organic Visitor Booster</span>
            </div>
            <h3 className="font-heading text-xl font-black text-white tracking-tight uppercase">
              Search Console & E-E-A-T Authority Portal
            </h3>
            <p className="font-sans text-xs text-[#94a3b8] max-w-xl">
              Establish high search trust for <code>{websiteUrl}/</code>. Verify content ownership with Google & Bing, activate the instant IndexNow pipeline, and score E-E-A-T signals.
            </p>
          </div>
        </div>

        {/* THREE COLUMN PROTOCOL INTERFACES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* CARD 1: GOOGLE SEARCH CONSOLE */}
          <div className="beveled-panel bg-[#09090d]/95 p-5 border-zinc-850/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-500" />
                <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider">1. Google Console</h4>
              </div>
              <span className={`text-[8.5px] font-mono font-black border px-1.5 py-0.5 rounded ${
                cleanGoogleCode.length >= 8 ? 'bg-emerald-950/20 text-emerald-400 border-emerald-555/20' : 'bg-[#18181b] text-zinc-500 border-zinc-800'
              }`}>
                {cleanGoogleCode.length >= 8 ? 'LINKED' : 'UNCONFIGURED'}
              </span>
            </div>

            <p className="font-sans text-[11px] text-zinc-400 leading-relaxed">
              Google is the #1 source of free organic search traffic. Paste the <strong>google-site-verification</strong> string or HTML meta tag here.
            </p>

            <div className="space-y-2">
              <label htmlFor="raw-google-verification-input" className="block font-mono text-[9px] text-zinc-500 uppercase font-bold">Google Site Verification Content:</label>
              <input
                id="raw-google-verification-input"
                type="text"
                value={rawGoogleVerification}
                onChange={(e) => setRawGoogleVerification(e.target.value)}
                placeholder='e.g., <meta name="google-site-verification" content="zXy9W8..." />'
                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 focus:border-amber-500 rounded text-[11px] font-mono text-zinc-300 placeholder-zinc-800 focus:outline-none transition-all"
              />
            </div>

            {cleanGoogleCode ? (
              <div className="space-y-3 pt-1 border-t border-zinc-900/45 animate-fade-in">
                <div className="p-2 rounded bg-emerald-950/10 border border-emerald-500/10 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-sans text-[10px] text-emerald-300 font-bold line-clamp-1">Extracted Code: {cleanGoogleCode}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const isHtmlName = cleanGoogleCode.includes('.html');
                      const fileName = isHtmlName ? cleanGoogleCode : `google${cleanGoogleCode}.html`;
                      const fileContent = `google-site-verification: ${fileName}`;
                      triggerDownload(fileContent, fileName, 'text/html');
                    }}
                    className="py-1.5 px-2 bg-[#08080c] border border-amber-500/20 hover:border-amber-500 text-amber-500 hover:text-white rounded text-[9.5px] font-heading font-black tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow"
                  >
                    <Download className="w-3 h-3" />
                    <span>Get File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const meta = `<meta name="google-site-verification" content="${cleanGoogleCode}" />`;
                      copyToClipboard(meta, 'gsc-meta');
                    }}
                    className="py-1.5 px-2 bg-[#08080c] border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded text-[9.5px] font-heading font-black tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow"
                  >
                    {copiedIndex === 'gsc-meta' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 'gsc-meta' ? 'Copied!' : 'Copy Meta'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 py-3 bg-zinc-950 rounded border border-zinc-900 text-center text-zinc-650 font-sans text-[10px] italic">
                Awaiting Google token code entry...
              </div>
            )}

            <div className="pt-2 border-t border-zinc-900 space-y-1 text-[10px] text-zinc-550 leading-relaxed font-sans">
              <span className="font-mono text-[8.5px] text-zinc-400 font-bold uppercase block">Verification Protocol:</span>
              <ul className="list-disc list-inside space-y-1">
                <li>Visit <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Google Search Console</a>.</li>
                <li>Add your domain: <code>{websiteUrl}/</code>.</li>
                <li>Download the HTML file or copy the header tag, and paste here to compile.</li>
              </ul>
            </div>
          </div>

          {/* CARD 2: BING WEBMASTER PORTAL */}
          <div className="beveled-panel bg-[#09090d]/95 p-5 border-zinc-850/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-sky-400" />
                <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider">2. Bing Webmaster</h4>
              </div>
              <span className={`text-[8.5px] font-mono font-black border px-1.5 py-0.5 rounded ${
                cleanBingCode.length >= 8 ? 'bg-emerald-950/20 text-emerald-400 border-emerald-555/20' : 'bg-[#18181b] text-zinc-500 border-zinc-800'
              }`}>
                {cleanBingCode.length >= 8 ? 'LINKED' : 'UNCONFIGURED'}
              </span>
            </div>

            <p className="font-sans text-[11px] text-zinc-400 leading-relaxed">
              Bing processes search traffic for Bing, Yahoo, and DuckDuckGo. Paste the 32-character hexadecimal verification string.
            </p>

            <div className="space-y-2">
              <label htmlFor="raw-bing-verification-input" className="block font-mono text-[9px] text-zinc-500 uppercase font-bold">Bing Validation XML tag/hex string:</label>
              <input
                id="raw-bing-verification-input"
                type="text"
                value={rawBingVerification}
                onChange={(e) => setRawBingVerification(e.target.value)}
                placeholder='e.g., <meta name="msvalidate.01" content="416B9567..." />'
                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 focus:border-sky-500 rounded text-[11px] font-mono text-zinc-300 placeholder-zinc-800 focus:outline-none transition-all"
              />
            </div>

            {cleanBingCode ? (
              <div className="space-y-3 pt-1 border-t border-zinc-900/45 animate-fade-in">
                <div className="p-2 rounded bg-emerald-950/10 border border-emerald-500/10 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-sans text-[10px] text-emerald-300 font-bold line-clamp-1">Extracted Hex: {cleanBingCode}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const bingXml = `<?xml version="1.0" encoding="utf-8"?>\r\n<users>\r\n\t<user>${cleanBingCode}</user>\r\n</users>`;
                      triggerDownload(bingXml, 'BingSiteAuth.xml', 'text/xml');
                    }}
                    className="py-1.5 px-2 bg-[#08080c] border border-sky-500/20 hover:border-sky-500 text-sky-400 hover:text-white rounded text-[9.5px] font-heading font-black tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow"
                  >
                    <Download className="w-3 h-3" />
                    <span>Get XML</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const metaTag = `<meta name="msvalidate.01" content="${cleanBingCode}" />`;
                      copyToClipboard(metaTag, 'bing-meta');
                    }}
                    className="py-1.5 px-2 bg-[#08080c] border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded text-[9.5px] font-heading font-black tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow"
                  >
                    {copiedIndex === 'bing-meta' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 'bing-meta' ? 'Copied!' : 'Copy Tag'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 py-3 bg-zinc-950 rounded border border-zinc-900 text-center text-zinc-650 font-sans text-[10px] italic">
                Awaiting Bing token code entry...
              </div>
            )}

            <div className="pt-2 border-t border-zinc-900 space-y-1 text-[10px] text-zinc-550 leading-relaxed font-sans">
              <span className="font-mono text-[8.5px] text-sky-400 font-bold uppercase block">Quick Links:</span>
              <p>
                Open the <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Bing Webmaster Portal</a> and add your domain to fetch verification tokens instantaneously!
              </p>
            </div>
          </div>

          {/* CARD 3: INDEXNOW PROTOCOL INTEGRATOR */}
          <div className="beveled-panel bg-[#09090d]/95 p-5 border-zinc-850/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider">3. IndexNow Accelerator</h4>
              </div>
              <span className="text-[8.5px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold font-mono">
                BYPASS CRAWLING
              </span>
            </div>

            <p className="font-sans text-[11px] text-zinc-400 leading-relaxed">
              <strong>IndexNow</strong> instantly notifies Bing, Yandex, and Seznam about updated pages. Bypasses weeks of crawling throttles on brand new sites!
            </p>

            <div className="p-2 px-3 bg-zinc-950 rounded border border-zinc-900 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] text-zinc-550 uppercase">Auto-Generated API Key:</span>
                <button
                  onClick={() => {
                    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
                    let key = '';
                    for (let i = 0; i < 32; i++) {
                      key += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    setIndexNowKey(key);
                  }}
                  className="text-[9px] font-mono text-emerald-400 hover:underline cursor-pointer"
                >
                  Regenerate
                </button>
              </div>
              <p className="font-mono text-[10.5px] text-emerald-400 select-all font-bold break-all">{indexNowKey}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerDownload(indexNowKey, `${indexNowKey}.txt`, 'text/plain');
                }}
                className="py-1.5 px-2 bg-[#08080c] border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white rounded text-[9.5px] font-heading font-black tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow"
              >
                <Download className="w-3 h-3" />
                <span>Get Key File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const pingUrl = `https://www.bing.com/indexnow?url=${encodeURIComponent(websiteUrl)}/&key=${indexNowKey}`;
                  window.open(pingUrl, '_blank');
                }}
                className="py-1.5 px-2 bg-[#0d0e15] border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded text-[9.5px] font-heading font-black tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow"
              >
                <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                <span>Send Ping</span>
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-900 space-y-1 text-[10px] text-zinc-550 leading-relaxed font-sans">
              <span className="font-mono text-[8.5px] text-zinc-400 font-bold uppercase block">How to Speed-up Discovery:</span>
              <ol className="list-decimal list-inside space-y-1">
                <li>Download the Key txt file, and host it at the root of your public domain: <code>/{indexNowKey}.txt</code></li>
                <li>Click <strong>"Send Ping"</strong> to instantly force-index your homepage!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* E-E-A-T & TRUST HEALTH ANALYZER CARD */}
        <div className="beveled-panel bg-[#09090d]/95 p-6 border-zinc-855/40 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
              <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider">E-E-A-T Trust Health Analyzer</h4>
            </div>
            <span className={`text-[10px] font-mono font-black border px-2 py-0.5 rounded ${
              trustEvaluation.score >= 85 
                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-950/20 text-amber-400 border-amber-500/20'
            }`}>
              {trustEvaluation.score}% TRUST SCORE
            </span>
          </div>

          <p className="font-sans text-[11px] text-zinc-400 leading-relaxed">
            Google uses manual review charters and automatic classifiers to rate the <strong>E-E-A-T</strong> (Experience, Expertise, Authoritativeness, Trustworthiness) of websites. High credentials stop your domain from being classified as spam.
          </p>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono text-zinc-550 font-bold uppercase">
              <span>Domain Trust Progress</span>
              <span>{trustEvaluation.score}/100 points</span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-900">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full" 
                style={{ width: `${trustEvaluation.score}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[9px] text-zinc-500 uppercase block font-bold">Trust Component Verification Checklist:</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {trustEvaluation.indicators.map((ind, idx) => (
                <div 
                  key={idx}
                  className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                    ind.pass 
                      ? 'bg-emerald-950/5 border-emerald-500/10' 
                      : 'bg-rose-950/5 border-rose-500/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {ind.pass ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                        <AlertTriangle className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className={`font-sans text-[10.5px] font-bold block ${ind.pass ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {ind.name}
                    </span>
                    <p className="font-sans text-[9px] text-zinc-550 leading-relaxed mt-0.5">{ind.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checker inputs */}
          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg space-y-3">
            <span className="font-mono text-[9px] text-zinc-400 uppercase font-bold block">Linked Compliance Pages Checker:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/40 hover:bg-zinc-900 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={aboutUsLinked}
                  onChange={(e) => setAboutUsLinked(e.target.checked)}
                  className="accent-rose-500 h-3.5 w-3.5 bg-zinc-950 border-zinc-850 rounded focus:ring-0 cursor-pointer"
                />
                <span className="font-sans text-[10.5px] text-zinc-300">About Us</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/40 hover:bg-zinc-900 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyPolicyLinked}
                  onChange={(e) => setPrivacyPolicyLinked(e.target.checked)}
                  className="accent-rose-500 h-3.5 w-3.5 bg-zinc-950 border-zinc-850 rounded focus:ring-0 cursor-pointer"
                />
                <span className="font-sans text-[10.5px] text-zinc-300">Privacy Policy</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded bg-zinc-900/40 hover:bg-zinc-900 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsOfServiceLinked}
                  onChange={(e) => setTermsOfServiceLinked(e.target.checked)}
                  className="accent-rose-500 h-3.5 w-3.5 bg-zinc-950 border-zinc-850 rounded focus:ring-0 cursor-pointer"
                />
                <span className="font-sans text-[10.5px] text-zinc-300">Terms of Use</span>
              </label>
            </div>
            <p className="font-sans text-[9px] text-rose-400 leading-normal italic">
              💡 <strong>Notice:</strong> Your workspace includes professional responsive drafts for About Us, Privacy Policy, and Terms of Use linked dynamically in footers. Toggle checkboxes above as you verify their active placements in your deploy layouts!
            </p>
          </div>
        </div>
      </div>

        {/* SOCIAL OPEN GRAPH PREVIEW PANEL */}
        <div className="pt-4 border-t border-zinc-900/40">
          <div className="beveled-panel bg-[#09090d]/35 p-6 border-zinc-900 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Share2 className="w-4.5 h-4.5 text-rose-500" />
                <div>
                  <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider">Social Share Click-Through-Rate (CTR) Graph Optimizer</h4>
                  <p className="font-sans text-[10.5px] text-zinc-500">Fine-tune the preview layout triggers when users share your utility domain links on Twitter, Facebook, or Discord.</p>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-zinc-950 px-2.5 py-0.5 rounded text-zinc-500 tracking-widest font-black uppercase">CTR SIMULATOR</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Controls */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="og-title-input" className="block font-mono text-[9px] text-zinc-500 uppercase font-black">OG Preview Title:</label>
                    <input
                      id="og-title-input"
                      type="text"
                      className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-rose-500 rounded-lg text-xs font-sans text-zinc-300 placeholder-zinc-700 focus:outline-none transition-all"
                      value={ogTitle}
                      onChange={(e) => setOgTitle(e.target.value)}
                      placeholder="e.g., APEX UTILITY Forge - Local Developers Hub"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="twitter-handle-input" className="block font-mono text-[9px] text-zinc-500 uppercase font-black">Twitter Handle Creator:</label>
                    <input
                      id="twitter-handle-input"
                      type="text"
                      className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-rose-500 rounded-lg text-xs font-sans text-zinc-300 placeholder-zinc-700 focus:outline-none transition-all"
                      value={twitterCreator}
                      onChange={(e) => setTwitterCreator(e.target.value)}
                      placeholder="e.g., @ApexForgeDev"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="og-desc-textarea" className="block font-mono text-[9px] text-zinc-500 uppercase font-black">OG Description Content:</label>
                  <textarea
                    id="og-desc-textarea"
                    rows={2}
                    className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-rose-500 rounded-lg text-xs font-sans text-zinc-300 placeholder-zinc-700 focus:outline-none transition-all resize-none"
                    value={ogDesc}
                    onChange={(e) => setOgDesc(e.target.value)}
                    placeholder="Short description snippet of site value..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="og-image-input" className="block font-mono text-[9px] text-zinc-500 uppercase font-black">OG Display Image Link:</label>
                  <input
                    id="og-image-input"
                    type="text"
                    className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-900 focus:border-rose-500 rounded-lg text-xs font-sans text-zinc-300 placeholder-zinc-700 focus:outline-none transition-all"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="Provide image link for high res custom card shares..."
                  />
                </div>

                {/* Meta block snippet */}
                <div className="space-y-2 pt-2 border-t border-zinc-900/60 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-zinc-500 uppercase block font-bold">Compiled Header Meta Snippet:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = `<!-- Open Graph / Meta Protocol tags -->\n<meta property="og:type" content="website" />\n<meta property="og:title" content="${ogTitle}" />\n<meta property="og:description" content="${ogDesc}" />\n<meta property="og:image" content="${ogImage}" />\n<meta property="og:url" content="${websiteUrl}/" />\n\n<!-- Twitter Cards Card Protocol -->\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:creator" content="${twitterCreator}" />\n<meta name="twitter:title" content="${ogTitle}" />\n<meta name="twitter:description" content="${ogDesc}" />\n<meta name="twitter:image" content="${ogImage}" />`;
                        copyToClipboard(snippet, 'social-snippet');
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-900 hover:text-white transition-all text-[9.5px] font-mono cursor-pointer flex items-center gap-1.5 text-zinc-400 hover:bg-[#16161f]"
                    >
                      {copiedIndex === 'social-snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                      <span>{copiedIndex === 'social-snippet' ? 'Copied' : 'Copy Social Code'}</span>
                    </button>
                  </div>
                  <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-900 max-h-[140px] overflow-auto">
                    <pre className="font-mono text-[9px] text-emerald-400/90 whitespace-pre text-left leading-normal select-all">
{`<!-- Open Graph / Meta Protocol tags -->
<meta property="og:type" content="website" />
<meta property="og:title" content="${ogTitle}" />
<meta property="og:description" content="${ogDesc}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:url" content="${websiteUrl}/" />

<!-- Twitter System Protocol -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:creator" content="${twitterCreator}" />
<meta name="twitter:title" content="${ogTitle}" />
<meta name="twitter:description" content="${ogDesc}" />
<meta name="twitter:image" content="${ogImage}" />`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Feed Card Simulation */}
              <div className="space-y-4">
                <span className="font-mono text-[9px] text-zinc-500 uppercase block font-bold">Simulated Live Feed Share Preview:</span>
                
                <div className="rounded-xl overflow-hidden bg-[#0d0e14]/90 border border-zinc-800 text-left shadow-2xl max-w-sm mx-auto">
                  
                  {/* Share Header */}
                  <div className="p-3 border-b border-zinc-900 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center font-heading text-[10px] font-black text-black">AP</div>
                    <div>
                      <span className="font-sans text-[10.5px] font-bold text-white block">Apex Labs Forge</span>
                      <span className="font-sans text-[8.5px] text-zinc-500">Shared via feed &bull; Sponsored</span>
                    </div>
                  </div>

                  {/* Body preview */}
                  <div className="p-3 text-zinc-300 font-sans text-[10.5px] leading-relaxed">
                    Check out our newly deployed high-performance operations deck! Optimized meta schemas and dynamic web architectures. Link in bio! ⚡
                  </div>

                  {/* Rich link image display */}
                  <div className="relative aspect-[1.91/1] bg-zinc-950 border-y border-zinc-900 overflow-hidden flex items-center justify-center">
                    {ogImage ? (
                      <img 
                        src={ogImage} 
                        alt="Social preview content"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618055182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";
                        }}
                        referrerPolicy="no-referrer"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="font-mono text-[10px] text-zinc-700 uppercase">Image Ref Missing</div>
                    )}
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[8.5px] font-mono text-zinc-400 font-bold uppercase border border-zinc-800">
                      {websiteUrl}/
                    </span>
                  </div>

                  {/* Link Meta Details Footer block */}
                  <div className="p-3.5 bg-zinc-950 space-y-1 block">
                    <span className="font-mono text-[8.5px] text-rose-400 uppercase tracking-widest font-black block">{hostNameUpper}</span>
                    <h5 className="font-sans text-xs font-bold text-white line-clamp-1">{ogTitle || 'Untitled Home Utilities'}</h5>
                    <p className="font-sans text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">{ogDesc || 'Dynamic SEO structured graphs parsed live.'}</p>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 text-left">
                  <p className="font-sans text-[10px] text-zinc-500 leading-normal">
                    💡 <strong>Search Trust Benefit:</strong> Having verified Open Graph headers does not feed raw crawl triggers directly, but it ensures structured rich cards whenever links are posted on public chat portals. This drives immense Referral CTR, turning clicks into solid domain index bookmarks!
                  </p>
                </div>
              </div>
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
                  setInputUrl('https://example.com/draft-testing');
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
