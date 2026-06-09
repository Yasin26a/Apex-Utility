import { ActiveTab } from '../types';

export interface LandingFAQ {
  question: string;
  answer: string;
}

export interface LandingPageConfig {
  toolId: ActiveTab;
  path: string;
  title: string;
  headline: string;
  subheadline: string;
  introParagraph: string;
  benefits: string[];
  howToSteps: string[];
  faqs: LandingFAQ[];
  relatedTools: { label: string; tab: ActiveTab }[];
}

const COMMON_RELATED = [
  { label: 'PDF Compressor', tab: 'compress-pdf' as const },
  { label: 'AI Audio Transcriber', tab: 'ai-transcriber' as const },
  { label: 'Code Snapshot Creator', tab: 'code-snapshot' as const },
  { label: 'SEO Content Optimizer', tab: 'seo-optimizer' as const }
];

// High-fidelity configuration containing granular answers targeting long-tail queries
const CUSTOM_LANDING_LOGIC: Record<string, Partial<LandingPageConfig>> = {
  'compress-pdf': {
    title: 'Compress PDF to 2MB for Job Applications Online Free - Secure & Private',
    headline: 'Securely Shrink Resumes and Portfolios to Under 2MB Free',
    subheadline: 'Perfect compatibility for Applicant Tracking Systems (ATS) without uploading credentials or files to any remote cloud servers.',
    introParagraph: 'Reducing file size for job portals is crucial. APEX uses local PDF parsing which compresses structure, down-samples embedded raster elements, and strips bloating fonts while keeping text readable. This ensures your resume matches ATS crawler engines flawlessly while respecting tight 2MB limits.',
    benefits: [
      '100% Client-Side: File files never leave your web browser workspace, ensuring complete document privacy.',
      'ATS Preservation: Retains structural text nodes so indexing engines can crawl candidate credentials.',
      'Super-Fast WASM Engine: Compression takes less than 3 seconds on standard mobile or desktop devices.'
    ],
    howToSteps: [
      'Hover or click on the file processor area to pick your portfolio or resume PDF.',
      'Select a target optimization scale or leave it at optimal high-density balance settings.',
      'Click Compress. The client assembler immediately produces a downloadable asset under 2MB.'
    ],
    faqs: [
      {
        question: 'Will My CV remain readable by automatic recruiters or ATS systems?',
        answer: 'Yes! Unlike standard compression services that flatten files into low-resolution pictures, APEX preserves native text layers, fonts, and hyperlinks. Your resume remains fully searchable and parsable.'
      },
      {
        question: 'Is it safe to compress confidential legal contracts here?',
        answer: 'Absolutely. All processing occurs locally via WebAssembly structures. Zero packets are transferred to a cloud interface, making it secure and GDPR compliant.'
      }
    ]
  },
  'ai-transcriber': {
    title: 'Precision AI Audio Transcriber - Secure Automated Transcription Free',
    headline: 'Convert Voice Memos, Call Records, and Audio of Conversations into Structured Text',
    subheadline: 'Leverage the latest Gemini model architectures to draft time-coded logs, captions, and SRT subtitle files.',
    introParagraph: 'Transcribing lectures, research interviews, or enterprise phone calls was historically labor-intensive. With the APEX AI Transcription sandbox, you upload local MP3 or WAV sounds and generate speaker-tagged paragraphs alongside accurate timestamp vectors to power professional copywriting workflows.',
    benefits: [
      'Enterprise Accuracy: Restructures sentences, flags speaker changes, and identifies contextual industry jargon.',
      'Multi-Format Exports: Download clean text files or perfectly synchronized SRT caption logs for video editing.',
      'Time-Coded Segmenting: Navigate files easily by jumping to specific, indexed minute marks.'
    ],
    howToSteps: [
      'Upload an audio recording of a call, presentation, or meeting.',
      'Confirm the language target or leverage the automatic voice detection algorithms.',
      'Generate Transcript wrapper. Follow along in real-time as words serialize, then export as TXT or SRT.'
    ],
    faqs: [
      {
        question: 'What audio file standards are supported?',
        answer: 'You can upload various formats including MP3, WAV, M4A, OGG, and WebM voice records up to standard browser memory limitations.'
      },
      {
        question: 'Can I export files directly for YouTube or Premier Pro subtitles?',
        answer: 'Yes! The SRT exports are fully compliant with YouTube timestamps, Premiere Pro, and standard video players.'
      }
    ]
  },
  'webp-converter': {
    title: 'Convert WebP to JPG Offline instantly - No Registration & Free',
    headline: 'High-Speed WebP Image Rasterizer to JPG & Portable PNG',
    subheadline: 'Instant local conversion of Google modern graphics to standard legacy layers without server uploads.',
    introParagraph: 'WebP provides amazing graphic compression on the web, but many photo editors and vintage portals reject WebP files. Run instant raster conversions to generate full-resolution JPG or transparent PNG images securely on your device.',
    benefits: [
      'Zero Sign-Ups: Convert files instantly without inputting emails or completing complex robot verifications.',
      'Batch Capability: Convert multiple media files at once in a parallel multi-threaded layout.',
      'Adjustable Quality Sliders: Pinpoint exact target ratios to save disk storage while retaining high clarity.'
    ],
    howToSteps: [
      'Drop your WebP files directly onto the converter target section.',
      'Choose whether to export as a lightweight JPG image or a lossless PNG.',
      'Download your converted assets immediately into your device library.'
    ],
    faqs: [
      {
        question: 'Does this app alter my original WebP resolution?',
        answer: 'No. By default, conversions occur at 100% exact resolution scale. You can customize quality values if you wish to shrink files.'
      },
      {
        question: 'How do multiple images get processed?',
        answer: 'Our batch-processor pipeline queues multiple files on asynchronous threads, scaling and saving each file in parallel.'
      }
    ]
  },
  'seo-optimizer': {
    title: 'SEO Content Copywriter & Flesch-Kincaid Readability Auditor',
    headline: 'Optimize Keyword Density & Readability Benchmarks in Real-Time',
    subheadline: 'Craft text that search engines index and human audiences love using dynamic syllable analytic scores.',
    introParagraph: 'Succeeding in search page results requires perfect visual density, balanced copy styles, and approachable text structures. APEX scans raw markdown and text layout segments to rank readability indices, and preview real-time Google search snippet listings.',
    benefits: [
      'Dynamic Snippet Preview: See live previews of your metadata tags on desktop and mobile mockups.',
      'Exhaustive Word Metrics: Track keyword frequencies, syllable metrics, and Flesch-Kincaid readability ease.',
      'Instant Local Scoring: Complete grading updates on every keystroke without network latency.'
    ],
    howToSteps: [
      'Type or paste your copywriting drafts directly into our rich analytics canvas.',
      'Set target focus keywords to audit frequency percentages.',
      'Review Flesch-Kincaid readability marks and adjust vocabulary to optimize ranking index structures.'
    ],
    faqs: [
      {
        question: 'What is a good Flesch-Kincaid Readability score for blog articles?',
        answer: 'Aiming for a score between 60 and 70 is ideal. This ensures your copy is comfortable for secondary school level reading and ranks optimally on crawler accessibility crawls.'
      },
      {
        question: 'Does this optimizer send my writing to third-party databases?',
        answer: 'Absolutely not. All grammar parsing, syllable counting, and keyword frequency tracking are performed inside your browser sandbox.'
      }
    ]
  },
  'code-snapshot': {
    title: 'Premium Code Snapshot Maker - Free Carbon & Ray.so Online Alternative',
    headline: 'Turn Boring Source Code into High-Fidelity Presentation Graphics',
    subheadline: 'Generate beautiful code cards with neon backdrops, macOS window layouts, and custom font controls offline.',
    introParagraph: 'Sharing naked brackets or plain code segments on social media is less engaging. Showcase your code beautifully. Compile sleek images styled with gradients, custom shadow buffers, macOS window chrome, and professional syntax styles in seconds.',
    benefits: [
      'Elite Vector Rendering: Exports clean PNG graphics optimized for LinkedIn, Twitter, and professional document structures.',
      'Advanced Customization: Choose background sizes, padding constants, retro window templates, and rich themes.',
      'Secure Local Canvas: Syntax processing runs inside your workspace local memory, protecting intellectual property.'
    ],
    howToSteps: [
      'Paste your source code logic in the text engine wrapper.',
      'Pick a syntax color preset and select from a range of high-contrast background themes.',
      'Download the formatted snapshot in crisp PNG format to share immediately.'
    ],
    faqs: [
      {
        question: 'Can I format multiple language syntaxes here?',
        answer: 'Yes! The snapshot engine supports automatic syntax formatting for HTML, CSS, JavaScript, TypeScript, Rust, Python, Go, and more.'
      },
      {
        question: 'Will the exported picture blur on retina screens?',
        answer: 'No. The canvas generates double-density high-DPI outputs so your code lines remain incredibly sharp even on ultra-wide screens.'
      }
    ]
  },
  'case-converter': {
    title: 'Free Case Converter & Text Formatter Online - Convert Cases Offline Instantly',
    headline: 'Instantly format text, transform letter cases, clean whitespace, and count text statistics',
    subheadline: 'A fully local text processing laboratory to convert UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, and more.',
    introParagraph: 'Formatting and editing copy or source files can be tedious. The APEX Case Converter provides standard development options (like JSON-friendly camelCase, snake_case, or kebab-case), corporate formats (Title/Sentence Case), and utility string actions (finding and replacing patterns or line prefixes) completely local in your browser cache.',
    benefits: [
      'Universal Case Formats: Instantly convert text into Sentence case, Title Case, camelCase, PascalCase, snake_case, kebab-case, or Dot notation.',
      'Text Cleaners: Trim whitespace, strip HTML/XML tags, condense double spaces, and delete blank rows with single clicks.',
      'Real-Time Word Counts & Weight: Live metrics of characters, lines, reading speeds, and letter weight arrays.'
    ],
    howToSteps: [
      'Paste your content block or load our development dummy preview text.',
      'Choose your preferred transition layout (such as Camel Case or Title Case) or use our cleaning utility sliders.',
      'Copy the output with a single mouse click or download the processed content as a clean .txt file.'
    ],
    faqs: [
      {
        question: 'Is it safe to paste confident code layers or text columns here?',
        answer: 'Completely. All transcript conversions, regex replacements, and letter checks happen inside your browser memory workspace. Zero text logs are sent online.'
      },
      {
        question: 'What is a Slug Case or Web Slug casing used for?',
        answer: 'Web Slugs normalize accented letters, strip non-alphanumeric details, and link words together with single dashes. This creates SEO-friendly URLs or route paths.'
      }
    ]
  },
  'lorem-generator': {
    title: 'Free Lorem Ipsum & Client Placeholder Generator Online - Offline Mockups',
    headline: 'Instantly Generate Dummy Copy, Structured Lists, and Sized Placeholder Graphics',
    subheadline: 'An offline-capable UI dummy generator supporting custom paragraph counts, random words, sentence counts, HTML mockup schemas, and SVG placeholder sizing.',
    introParagraph: 'Creating design wireframes requires reliable placeholder text and mock graphic placeholders. State-of-the-art APEX Lorem Ipsum Suite generates industry-standard classical latin copy (including Ciceronian paragraphs, words, and bullet items) as well as dynamically sized local inline image templates entirely client-side.',
    benefits: [
      'Versatile Fill Patterns: Instantly build accurate paragraph blocks, continuous word strings, specific sentence quantities, or list matrices.',
      'Sized Placeholder Images: Generate dynamic local placeholders colored with beautiful gradients, custom aspect ratios, or custom resolution markers.',
      'HTML Tag Wrapping: Automatically render mock paragraphs wrapped in pristine <p>, <li>, <ul>, <ol>, or <div> markers to test client code layouts instantly.'
    ],
    howToSteps: [
      'Choose your preferred formatting structure (Paragraphs, List elements, Raw Words, HTML lists, or Sized SVG visual placeholders).',
      'Adjust density constants (such as paragraph depth, list density, or image dimensions/resolutions).',
      'Click copy to clipboard or download the generated mock block with a single click.'
    ],
    faqs: [
      {
        question: 'Does this generator require internet connections to render placeholder images?',
        answer: 'No. All image placeholders are dynamically rendered locally via responsive, lightweight inline SVG graphics. No third-party servers are pinged.'
      },
      {
        question: 'Is the classical Lorem Ipsum text accurate to Cicero\'s original works?',
        answer: 'Yes! The classical passages are carefully extracted and randomized from Marcus Tullius Cicero\'s De Finibus Bonorum et Malorum academic writings, preserving authentic syllable proportions.'
      }
    ]
  }
};

/**
 * Dynamically generates a static "Landing Page" content configuration for ANY tool tab.
 * Helps search engine crawlability by generating detailed, long-tail targeting page schemas.
 */
export function getLandingPageConfig(toolId: ActiveTab): LandingPageConfig {
  const custom = CUSTOM_LANDING_LOGIC[toolId];
  
  // Format fallback text elements in case a custom outline is not explicitly predefined
  const readableToolName = toolId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const title = custom?.title || `${readableToolName} Online Tool Free - High Performance Client Sandbox`;
  const headline = custom?.headline || `Professional Client-Side ${readableToolName}`;
  const subheadline = custom?.subheadline || `Perform secure offline ${readableToolName.toLowerCase()} operations instantly with zero registration requirements.`;
  const introParagraph = custom?.introParagraph || `APEX Processing Labs builds high-fidelity local applications using WebAssembly. This ${readableToolName.toLowerCase()} utility runs with extreme precision on your machine without relying on external network queries, protecting confidential details and files.`;
  
  const benefits = custom?.benefits || [
    'Fully Client-Side Sandbox: Run calculations, conversion steps, and layouts safely in browser cache.',
    'No Sign-up Or Subscription: Access all premium properties completely free with no limits.',
    'Highly Responsive UI: Get instant outcomes on every action with local GPU rendering.'
  ];

  const howToSteps = custom?.howToSteps || [
    `Launch the live ${readableToolName.toLowerCase()} module from our side drawer or main catalog dashboard.`,
    'Drag, drop, or input the target resources directly into the active viewport interface.',
    'Click run. Save your rendered high-DPI assets or data outputs to your local device catalog.'
  ];

  const faqs = custom?.faqs || [
    {
      question: `Is using this ${readableToolName.toLowerCase()} online tool secure?`,
      answer: `Yes, completely. Our client-first system architecture performs all calculations, conversions, and rendering locally using secure WebAssembly structures. Your raw files are never processed or saved outside your workspace.`
    },
    {
      question: `Do I have to pay or register an account for high-resolution exports?`,
      answer: 'No registration or credentials are required. All features within the APEX suite are open-source compatible, fully unlocked, and run 100% free offline.'
    }
  ];

  // Prevent endless self-referencing in related listings
  const filteredRelated = COMMON_RELATED.filter(item => item.tab !== toolId);

  return {
    toolId,
    path: `/${toolId}`,
    title,
    headline,
    subheadline,
    introParagraph,
    benefits,
    howToSteps,
    faqs,
    relatedTools: filteredRelated
  };
}
