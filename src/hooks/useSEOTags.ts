import { useEffect } from 'react';
import { ActiveTab } from '../types';

interface SEOHeaderContent {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  schema: Record<string, any>;
}

const SEO_METADATA: Record<ActiveTab, SEOHeaderContent> = {
  dashboard: {
    title: "Apex Processing Labs | Local WASM Utility Forge",
    description: "Perform enterprise-grade media conversions and complex document compression entirely within your local browser sandbox. Unparalleled speed, absolute privacy, 100% free.",
    keywords: "local wasm processing, client-side converter, apex processing lab, secure browser utilities, file optimizer, offline processing",
    ogTitle: "Apex Processing Labs - High Performance Client WASM Utilities",
    ogDescription: "Compress PDFs, format JSON arrays, and rasterize WebP graphics securely using client-side WebAssembly.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Processing Labs",
      "description": "Perform enterprise-grade media conversions and complex document compression entirely within your local browser sandbox.",
      "applicationCategory": "Utility",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'compress-pdf': {
    title: "Compress PDF to 2MB for Job Application Online Free | Apex PDF",
    description: "Compress and structurally shrink document payload sizes to under 2MB for job application resumes on the web for free. Perfect ATS compliant indexing preservation with full file privacy.",
    keywords: "compress pdf to 2mb for job application online free, compact resume builder, shrink pdf file size free, document compressor online, pdf optimization for jobs, jobs application PDF help",
    ogTitle: "Compress PDF to 2MB for Job Application Online Free | APEX",
    ogDescription: "Apply with confidence. Reduce resume size to 2MB without breaking fonts or ATS matching structures.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Compress PDF to 2MB Online Tool",
      "description": "Compress and structurally shrink document payload sizes to 2MB for job applications online free.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'webp-converter': {
    title: "Convert WebP to JPG Instantly without Registration | Apex Image Converter",
    description: "Convert high-resolution WebP images to crisp JPG or PNG formats instantly with premium layout results. No email registration or sign-ups required. Processing runs 100% offline.",
    keywords: "convert webp to jpg instantly without registration, webp to png converter free, batch rasterize webp, image quality converter, convert webp offline, convert webp instantly",
    ogTitle: "Convert WebP to JPG Instantly without Registration",
    ogDescription: "Instant graphical sandbox converts high-density WebP graphics to PNG or JPG within local cache storage.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "WebP Image Converter",
      "description": "Convert WebP to JPG instantly without registration.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'json-beautifier': {
    title: "Format Unreadable JSON Data Tool | Apex Swiss Parser",
    description: "Seamless online workspace to format unreadable JSON data, debug structural arrays, check code validation and format raw nested structures instantly for developers.",
    keywords: "format unreadable json data tool, nested json beautifier, json structure validator, format json online fee, syntax validator stream",
    ogTitle: "Format Unreadable JSON Data Tool",
    ogDescription: "Instantly clean complex nested array properties into structured readable syntax layouts.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "JSON Parser and Beautifier Engine",
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
  'sitemap-seo': {
    title: "Generate and Inspect Dynamic XML Sitemap Online Free | Apex SEO Hub",
    description: "Export search-engine compliant sitemaps, inspect robots.txt rules, analyze technical page indexes, and audit dynamic priority scores for optimized crawl indexing.",
    keywords: "generate and inspect dynamic XML sitemap online free, robots.txt inspector, technical seo indicators, priority weight matrices, sitemap exporter, free xml sitemap creator",
    ogTitle: "Generate and Inspect Dynamic XML Sitemap Online Free",
    ogDescription: "Technical SEO monitoring workbench. Compile and export perfect robots.txt and XML sitemap models.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Dynamic XML Sitemap Generator & SEO Inspector",
      "description": "Dynamic Sitemap Generators and Robots.txt files to optimize crawls and increase domain rank.",
      "applicationCategory": "SEOApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'sitemap-generator': {
    title: "In-Browser XML Sitemap Generator Online Free | Apex SEO Hub",
    description: "Create fully customizable, search-compliant XML sitemaps. Input your website URL, configure crawler change frequencies and priority scores, and instantly download a valid sitemap.xml file.",
    keywords: "in-browser xml sitemap generator, custom sitemap xml builder, free sitemap online creator, google search console sitemap, custom change frequency sitemap, prioritize website links",
    ogTitle: "In-Browser XML Sitemap Generator Online Free",
    ogDescription: "Build pristine search-engine compliant XML sitemaps with custom frequencies and priorities in seconds.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Custom XML Sitemap Builder & Generator",
      "description": "An interactive, client-side tool to compile, structure, and export valid XML sitemaps for top rankings across Google, Bing, and other search indexes.",
      "applicationCategory": "SEOApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'image-to-pdf': {
    title: "Merge JPG/PNG Images into PDF Online Free | Apex PDF Converter",
    description: "Combine and merge multiple JPG, JPEG, and PNG images into a single optimized PDF document locally. Supports image reordering, page rotations, and security watermarks free.",
    keywords: "merge jpg png images into pdf online free, merge multiple images to single pdf, image to pdf converter, convert jpg to pdf, convert png to pdf offline, optimized image pdf wrapper",
    ogTitle: "Merge JPG/PNG Images into PDF Online Free | APEX Labs",
    ogDescription: "Stitch multiple design files, screenshots, or scans into a single, light, watermarked PDF completely offline.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "JPG/PNG to PDF Converter and Merger",
      "description": "Combine several raster image files into a single, optimized PDF document in real time within your web sandbox.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'join-pdf': {
    title: "Combine PDF Documents and Reorder Pages Free | Apex Joiner",
    description: "Upload multiple existing PDF documents and combine them into a single file with page-by-page drag-and-drop reordering. Supporting custom rotations, deletions, and metadata injection free.",
    keywords: "combine pdf documents and reorder pages free, merge pdf files, drag and drop pdf pages, rotate pdf pages online, duplicate pdf page free, offline pdf joiner tool",
    ogTitle: "Combine PDF Documents and Reorder Pages Free | APEX Labs",
    ogDescription: "High-performance browser PDF joining workstation. Rearrange, rotate, and synthesize documents with absolute data isolation.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "PDF Joiner & Page Reorder Forge",
      "description": "Combine several PDF files into a single optimized document with fine page-level reordering widgets completely client-side.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'ai-writer': {
    title: "Apex Professional AI Writer & Copywriter Tool | Gemini Pro Engine",
    description: "Draft high-fidelity articles, professional business emails, or markdown posts. Modify and refine drafts inline using advanced server-side Gemini AI models.",
    keywords: "ai copywriter, professional email writer, article summarizer, blog post generator, gemini text editing, content writer online free",
    ogTitle: "Apex Professional AI Writer & Copywriter Tool | Gemini",
    ogDescription: "Advanced copywriting workstation. Instantly author, restructure, and fine-tune publications securely.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex AI Copywriting Forge",
      "description": "Author dynamic content documents and modify layouts in real-time utilizing secure Gemini AI algorithms.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'password-generator': {
    title: "Secure Random Password & Passphrase Generator Online Free | Apex Shield",
    description: "Generate highly secure random passwords or multi-word memorable passphrases offline within your browser cache storage. Compute precise thermodynamic entropy metrics and exclude symbols.",
    keywords: "secure random password generator free, memorable passphrase creator, strength meter, offline password compiler, exclusions characters, custom symbol pools",
    ogTitle: "Secure Random Password & Passphrase Generator Online Free",
    ogDescription: "Highly customizable client-side key generator. Verify visual entropy stats and exclusions without network transmissions.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Shield Vault Password Generator",
      "description": "Offline secure random password and memorable passphrase generator with entropy diagnostic metrics.",
      "applicationCategory": "SecurityApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'qr-generator': {
    title: "High-Resolution Custom QR Code Generator Online Free | Apex Utility",
    description: "Convert URLs, plain text, email messages, phone numbers, or Wi-Fi security keys into customizable high-resolution QR codes offline. Adjust error correction levels, shapes, gradients, and custom colors.",
    keywords: "high-resolution qr code generator free online, custom qr code colors, downloadable qr codes, wifi qr login generator, error correction qr code",
    ogTitle: "Custom QR Code Generator Online Free | Apex Processing Labs",
    ogDescription: "Design, customize, and compile secure QR codes locally with real-time vector preview, custom hex palettes, and adjustable error tolerance margins.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex QR Code Generator",
      "description": "Offline secure high-resolution custom vector and raster QR code builder with color palettes and error correction margins.",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'image-vectorizer': {
    title: "Local Image Vectorizer & PNG/JPEG to SVG Converter | Apex Utility",
    description: "Convert PNG, JPEG, and WebP raster images into high-quality scalable SVG vectors offline. Use Moore-Neighbor contour tracing, Delaunay low-poly mesh, halftone dots, or quantized retro pixel art.",
    keywords: "local image vectorizer, png to svg converter online free, convert jpeg to svg locally, raster to vector outline tracer, delaunay polygon generator, low poly halftone",
    ogTitle: "Local Image Vectorizer & Raster to SVG Converter Online",
    ogDescription: "Trace boundaries or create futuristic low-poly and halftone vectors 100% offline within your browser. Full privacy with lossless SVG output downloads.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Responsive Image Vectorizer",
      "description": "Convert weightless raster images into crystal-clear scalable vector graphics (SVG) with custom outline, triangulation, halftone, and pixelated tracing controls.",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'unit-converter': {
    title: "Instant Unit Converter & Metric Solver Online Free | Apex Processing Labs",
    description: "Convert length, weight, volume, and temperature parameters in real-time. Displays full comparison matrices and exports results securely directly to click clipboard.",
    keywords: "metric conversion solver online free, real-time unit converter, weight scale conversion, length dimensions translator, temperature convert offline, cups to ml, kg to lbs converter",
    ogTitle: "Instant Unit Converter & Metric Solver Online Free",
    ogDescription: "Design, compare, and instantly parse metrics in real-time. Absolute privacy via fully client-side calculations.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Responsive Unit Converter",
      "description": "Convert weight, length, volume and temperature variables in real-time, completely offline within your browser.",
      "applicationCategory": "Utility",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'svg-rasterizer': {
    title: "High-Resolution SVG Vector to Raster Image Converter | Apex Utility",
    description: "Render or paste raw SVG XML vectors, modify in real-time, scale up to 8x for high-resolution PNG, JPG, or WebP downloads. Perform conversion offline securely.",
    keywords: "convert svg to png high resolution, raw svg xml compiler, upscale vectors offline, transparent svg rasterizer, vector image converter, webp svg",
    ogTitle: "High-Resolution SVG Vector to Raster Converter | Apex Utility",
    ogDescription: "A secure client-side SVG to high-resolution raster compiler. Scale vectors up to 8x for crisp, crystal-clear PNG, JPG, or WebP files without pixelation.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Custom SVGRasterizer Engine",
      "description": "Convert weightless vectors to crisp upscaled raster assets locally in your browser with absolute security.",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'batch-processor': {
    title: "Multi-File Parallel Batch Image Optimiser | Apex Utility",
    description: "Upload several images to resize, compress, and re-format in parallel. Highly performant offline processing with real-time status and download bundle downloads.",
    keywords: "batch image resize, compress multiple images, convert png to webp batch, high speed offline image compressor, parallel bulk resizing, image optimiser",
    ogTitle: "Multi-File Parallel Batch Image Optimiser | Apex Utility",
    ogDescription: "A secure, client-side, multi-threaded image processor. Optimize whole bulk folders of image assets at once with zero data leakage.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Parallel Batch Processor Engine",
      "description": "Format, scale and compress collections of image assets simultaneously with real-time feedback metrics on isolated thread layers.",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'json-diff': {
    title: "JSON Object Diff Checker & Synced Compare | Apex Utility",
    description: "Compare two JSON schemas side-by-side. Highlight additions, deletions, slight drifts or value updates with offline color-coded syntax checking.",
    keywords: "json compare side-by-side, visual json diff checker, structural diff viewer, highlight json variables, web json comparisons tool",
    ogTitle: "JSON Object Diff Checker & Synced Compare | Apex Utility",
    ogDescription: "A secure, client-side dynamic JSON comparison tool. Match elements, detect deletions, addition modifications instantly with color highlights.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex JSON Diff Engine",
      "description": "Track database schemas or values drift. Discover additions, removals, and structural variations in dual parsed outputs.",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'secure-hash': {
    title: "Secure Cryptographic Hash Generator | MD5, SHA-1, SHA-256, SHA-512 | Apex Vault",
    description: "Calculate and verify MD5, SHA-1, SHA-256, and SHA-512 hashes completely offline in browser memory. Salting, stretching support with checksum verification.",
    keywords: "secure cryptographic hash generator, online hash calculator free, md5 generator offline, sha256 checksum validator, calculate sha512 hash, file integrity checker online",
    ogTitle: "Secure Cryptographic Hash Generator (MD5, SHA-1, SHA-256, SHA-512)",
    ogDescription: "Generate secure cryptographic hashes instantly with full local confidentiality support. Salting, custom iterations, checksum validation check.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Cryptographic Hash Vault",
      "description": "Generate security hashes and checksum check completely offline in browser sandbox.",
      "applicationCategory": "SecurityApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'color-palette': {
    title: "Advanced Color Palette Generator & Image Extractor | Apex Studio",
    description: "Generate harmonious color schemes (analogous, triadic, monochromatic) and extract dominant brand colors from images completely offline.",
    keywords: "color palette generator, brand color extractor, image palette analyzer, offline color schemes, contrast checker accessibility, css variables style generator",
    ogTitle: "Advanced Color Palette Generator & Brand Extractor",
    ogDescription: "Generate aesthetic color palettes, check text contrast accessibility ratios, and compile copyable CSS variables or Tailwind codes instantly.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Aesthetic Color Palette Suite",
      "description": "Generate beautiful color palettes and extract cohesive brand codes 100% offline.",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'digital-signature': {
    title: "Digital Signature Generator & Stylist | Apex Studio",
    description: "Create, format, and download high-quality custom drawn vector or typography signature images for signing documents completely offline.",
    keywords: "digital signature generator, sign document offline, e-signature maker, signature style download, electronic autograph, vector svg signature",
    ogTitle: "Digital Signature Generator & Stylist - Apex Studio",
    ogDescription: "Create gorgeous text or hand-drawn digital signatures, style pen width/colors, and export vector-ready PNGs or SVGs 100% locally.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Digital Signature Studio",
      "description": "Design and download custom signatures securely inside your browser.",
      "applicationCategory": "OfficeApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'seo-optimizer': {
    title: "SEO Content Optimizer & Real-time Readability Analyzer | Apex Suite",
    description: "Analyze your copywriting in real-time. Optimize keyword density, estimate readability with Flesch-Kincaid formula, and compile flawless Google search snippet previews.",
    keywords: "seo content optimizer, readability checker, Flesch-Kincaid score, keyword density analyzer, google search snippet preview, copy optimizer free, real-time seo analyser",
    ogTitle: "SEO Content Optimizer & Real-time Readability Analyzer",
    ogDescription: "Perfect your copywriting. Dynamic keyword analyzer, syllable counter Flesch-Kincaid score indicator, and premium snippet builder previews 100% offline.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex SEO Content Optimizer & Readability Suite",
      "description": "Analyze and audit copywriting. Track focus keyphrases, evaluate readability indexes, and generate Google and social card preview elements.",
      "applicationCategory": "MarketingApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'base64-converter': {
    title: "Base64 Encoder/Decoder & Asset Embedded Compiler | Apex Suite",
    description: "Convert text or files to Base64 instantly. Optimize images to embedded base64 content payloads with offline code exports (HTML, CSS, JS/TS).",
    keywords: "base64 encoder, base64 decoder, image to base64, file to base64, data uri generator, base64 code converter, dev assets compiler, background image base64",
    ogTitle: "Base64 Encoder/Decoder & Embedded Asset Toolkit",
    ogDescription: "Seamless non-blocking base64 asset conversions. Generate responsive inline embeds, raw code scripts, and offline imagery styling data-URIs.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Base64 Asset Compiler Suite",
      "description": "Convert local text elements or graphic binaries to Base64 data with multiple integrated web snippets outputs.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'regex-tester': {
    title: "Regex Validator, Tester & Match Visualizer | Apex Suite",
    description: "Test your regular expressions in real-time. View matched text highlighting, captured groups information, and choose from our library of common patterns.",
    keywords: "regex tester, regular expression validator, regex match highlighter, capture groups viewer, common regex patterns, regular expression editor, regex debugger, pattern matcher",
    ogTitle: "Real-Time Regex Validator & Pattern Tester",
    ogDescription: "A powerful, real-time regular expression tester with interactive match and capture group highlighting and an integrated common regex library.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Regex Validator & Tester",
      "description": "Interactive real-time regular expression pattern validator and group capture diagnostic suite.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'csv-json-converter': {
    title: "CSV to JSON & JSON to CSV Converter | Apex Suite",
    description: "Convert. parse, beautify, and edit structured data between CSV and JSON formats instantly offline. Review parse-group metrics and capture headers.",
    keywords: "csv to json, json to csv, delimited converter, comma separated value to json, convert csv, json to excel, visual data table parser",
    ogTitle: "Interactive CSV ⇄ JSON Converter Lab",
    ogDescription: "Seamless layout transformation engine between arrays, JSON maps, and tabular comma-separated columns with visual editor controls.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex CSV to JSON Data Converter Studio",
      "description": "Real-time robust offline structured data transformations representing CSV and JSON with dynamic grid editor controls.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'image-compressor': {
    title: "Image Compressor Studio | Optimize JPEG, PNG & WebP | Apex Suite",
    description: "Compress JPEG, PNG, and WebP images offline instantly. Fine-tune size, quality, and aspect ratios with comprehensive metrics and side-by-side comparison.",
    keywords: "image compressor, compress png, compress jpeg, webp compressor, resize images, offline image compression, size reduction metrics, aspect ratio lock",
    ogTitle: "Professional Image Compressor Studio | Apex Suite",
    ogDescription: "Reduce image file size instantly with real-time side-by-side high-fidelity comparison and custom compression factors.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Image Compressor Studio",
      "description": "Offline image compression and scaling environment for optimizing JPEG, PNG, and WebP assets.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'quick-image-optimizer': {
    title: "Quick Image Optimizer | Bulk Resize & Compress Images | Apex Suite",
    description: "Resize, compress, and optimize multiple images simultaneously for SEO performance, Core Web Vitals wins, and instant loading speed.",
    keywords: "bulk image optimizer, batch image compressor, seo filename optimizer, multiple image resizing, compress several images, webp bulk optimizer, core web vitals optimization",
    ogTitle: "Bulk SEO Image & Speed Optimizer | Apex Suite",
    ogDescription: "Bulk optimize, resize, and compress multiple images simultaneously with SEO-compliant lowercase filename sanitization.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Quick Image Optimizer",
      "description": "Bulk image resizing and compression with SEO-aware formatting elements suitable for modern content publishers.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'rich-text-stats': {
    title: "Rich Text Statistics & Content Analytics | Apex Core Suite",
    description: "Analyze characters, words, sentences, reading and speaking metrics with Flesch-Kincaid scale index testing. Completely secure and local text analytics dashboard.",
    keywords: "rich text statistics, character counter online, word density analyzer, readability testing, reading speed counter, custom content analytics",
    ogTitle: "Rich Text Statistics & Real-Time Content Analytics",
    ogDescription: "Obtain accurate character counts, readability speed matrices, and spelling densities securely and offline.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Rich Text Statistics",
      "description": "Completely offline and secure rich character, keyword density, and sentence structural analysis workbench.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'audio-trimmer': {
    title: "Audio Trimmer Studio | Lossless Client-Side Audio Splice",
    description: "Visually edit, crop, and convert audio clips locally. 100% private, sandbox browser execution producing downloadable high-fidelity WAV files instantly.",
    keywords: "audio trimmer, convert video audio, trim mp3 offline, local audio crop, crop music file online, audio range selector",
    ogTitle: "Advanced Local Audio Trimmer Studio",
    ogDescription: "Fast, sandboxed, high-resolution visual audio clipping and slicing engine with instant download capabilities.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Audio Trimmer Studio",
      "description": "Completely secure offline client-side audio visualizer and wav extraction tool.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'ai-transcriber': {
    title: "AI Audio Transcriber | Automatic Gemini Captions Generator",
    description: "Upload audio recordings and leverage modern Gemini AI models to generate highly precise time-coded transcripts. Export standard SRT captions or TXT paragraphs instantly.",
    keywords: "ai audio transcriber, audio speech to text, gemini transcription tool, convert speech to srt, automated captions generator, time-coded transcript export, speaker identification",
    ogTitle: "AI Audio Transcriber Studio - Time-Coded Speech to Text",
    ogDescription: "Convert recordings into precise, speaker-labeled textual segments. Export standard subtitles in SRT or formatted TXT paragraphs with ease.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex AI Audio Transcriber Studio",
      "description": "Premium Gemini-powered audio speech-to-text captioning system.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'pdf-analyst': {
    title: "AI Document & PDF Q&A Analyst | Converse with PDF",
    description: "Upload your business documents, enterprise research PDFs, sheets, or texts and engage in real-time conversational audits and summaries with server-side Gemini AI models.",
    keywords: "chat with pdf, ai document query, pdf auditor, pdf summary generator, gemini pdf search, extract tables from pdf",
    ogTitle: "AI Document & PDF Analyst Studio - Apex Suite",
    ogDescription: "Analyse, summarise, and conversationalise PDFs and business documents instantly with Gemini.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex AI Document & PDF Analyst",
      "description": "Secure, full-fidelity AI PDF and document query assistant.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'exif-stripper': {
    title: "Privacy EXIF Metadata Inspector & Stripper | Apex Suite",
    description: "Scan image files to audit concealed metadata records, camera device parameters, and GPS logs, then purge tags immediately using canvas 2D re-rendering to secure your file privacy.",
    keywords: "exif stripper, photo metadata inspector, clean image gps coordinates, exif header remover, camera maker signature wiper, photo data privacy",
    ogTitle: "Privacy EXIF Metadata Inspector & Stripper Studio",
    ogDescription: "Analyse hidden image parameters, GPS coordinates, and purge EXIF tag trails to secure online privacy.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Privacy EXIF Metadata Inspector & Stripper",
      "description": "Offline-secure metadata examiner and permanent EXIF header purge software.",
      "applicationCategory": "PrivacyApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'video-recorder': {
    title: "Screen Recorder & Instant High-Quality GIF Exporter | Apex Suite",
    description: "Record high-definition screen captures and instantly export them into high-quality looping GIFs or WebM video. Superimpose webcam overlay, choose frame rate, quality quantization, and offline dithering controls.",
    keywords: "screen recorder, gif exporter, convert screen capture to gif, webm to gif converter, record screen to gif, loom to gif alternative, custom color palette gif",
    ogTitle: "Screen Recorder & High-Quality GIF Exporter Studio",
    ogDescription: "Record your screen and convert captures instantly into fluid, high-quality looping GIFs or premium WebM presentations 100% offline.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex High-Definition Screen & Webcam Recorder",
      "description": "High-fidelity offline-secure screen & webcam recorder.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'code-snapshot': {
    title: "Premium Code Snapshot Creator & Carbon/Ray.so Alternative | Apex Suite",
    description: "Generate beautiful, shareable code snapshots inside customizable layouts 100% offline. Adjust gradients, paddings, macOS windows, line numbers, fonts, and export to PNG instantly.",
    keywords: "code snapshot generator, beautiful code screenshots, carbon copy online alternative, ray.so desktop client offline, source code screenshot beautifier, gradient backdrop syntax highlighting",
    ogTitle: "Premium Code Snapshot Studio",
    ogDescription: "Turn raw source code into spectacular, presentation-ready vector and canvas shots with custom neon backdrops, mock browser skins, and elite typography.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Code Snapshot Studio",
      "description": "Highly customizable, privacy-focused offline source code screenshot and code-card design client.",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'private-sketchpad': {
    title: "Private Local Sketchpad & Excalidraw-like Diagrammer | Apex Suite",
    description: "Create diagrams, mockups, flowcharts, and hand-drawn sketches 100% locally and privately. High-fidelity shape tools, customized styles, custom backing grids, and high-DPI vector image exports.",
    keywords: "excalidraw alternative, private local sketchpad, vector wireframe builder, hand-drawn layout editor, offline flowchart designer, privacy-first diagram tool",
    ogTitle: "Private Sketchpad & Wireframe Canvas",
    ogDescription: "Design premium sketches, diagrams, checklists, and visual layouts privately. Export seamlessly as SVG or PNG locally with high-fidelity outputs.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Secure Sketchpad",
      "description": "Completely secure, local-first interactive vector diagramming and hand-drawn wireframing studio.",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'case-converter': {
    title: "Free Case Converter & Text Formatter Online Offline | Apex Copy Code",
    description: "Instantly transform word casing styles (UPPERCASE, lowercase, camelCase, snake_case, Title Case, Sentence case), remove blank rows, strip tags, and calculate statistics offline.",
    keywords: "case converter online, free text formatter client-side, camelcase snake case translator, strip HTML tags copy paste tool, character counter text statistics",
    ogTitle: "Apex Free Case Converter & Text Formatter",
    ogDescription: "Secure local-first application to clean and format text, convert letter casing, clean spaces, and output files with complete offline security.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Case Converter & Text Formatter",
      "description": "Enterprise-grade local string transformations, whitespace cleaning, find/replace patterns, and real-time text analysis.",
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'lorem-generator': {
    title: "Free Lorem Ipsum & Client Placeholder Generator Online | Apex Copy Code",
    description: "Instantly generate custom Lorem Ipsum dummy text paragraphs, list clusters, HTML element wraps, and colorful SVG placeholder mockups offline.",
    keywords: "lorem ipsum generator free, click dummy text maker, placeholder image generator offline, mock HTML template paragraphs, randomized word generator",
    ogTitle: "Apex Lorem Ipsum & Placeholder Generator",
    ogDescription: "A powerful local toolbox to build classical lorem ipsum passages, lists, HTML-wrapped snippets, and beautifully colored vector placeholder graphic elements.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Lorem Ipsum & Client Placeholder Generator",
      "description": "Customizable localized dummy text outputs and vector responsive graphic placeholders with complete data privacy.",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'image-cropper': {
    title: "Free Image Cropper, Resizer & Ratio Balancer Online | Apex Processing Labs",
    description: "Crop pictures, lock aspect ratios (16:9, 4:3, 1:1, etc.), scale output pixel dimensions, and fit balanced expansion padding with blurred backgrounds fully offline.",
    keywords: "image cropper, resize images, aspect ratio calculator, photo scale, crop screenshot, offline avatar editor, blurred padding cover, instagram story size",
    ogTitle: "Apex Image Cropper, Resizer & Ratio Balancer",
    ogDescription: "An advanced browser-based sandbox application to crop, resize, compress formats, and expand canvas ratios with absolute security.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Image Cropper & Resizer",
      "description": "High-fidelity offline image crop rectangle modifier, custom pixel scaler, and canvas ratio balancer.",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'date-calculator': {
    title: "Apex Time & Date Calculator | Direct Multi-Format Interval Engine",
    description: "Calculate duration difference between two dates, add/subtract intervals, filter business working days, and analyze precise timezone offsets offline.",
    keywords: "date calculator, time difference, business days counter, workdays calendar, days count, countdown to date, timezone offset converter",
    ogTitle: "Apex Time & Date Calculator Engine",
    ogDescription: "A full-featured professional client-side utility to find intervals, manage business days, and convert time offsets securely.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Apex Time & Date Calculator",
      "description": "Premium duration differences, interval planners, and business date metrics builder.",
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'privacy-policy': {
    title: "Privacy Policy & GDPR/CCPA Compliance | Apex Laboratories",
    description: "Read our comprehensive data security commitments, DoubleClick DART advertising cookie declarations, and opt-out instructions to keep your browser safe.",
    keywords: "privacy policy, adsense compliance, wasm security, doubleclick cookie opt out, GDPR user entitlements, CCPA california data rules",
    ogTitle: "Apex Privacy Policy & Cookie Compliance Audit Shield",
    ogDescription: "Guaranteed client-side browser isolated workloads with 100% data confidentiality and global privacy compliance.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Apex Privacy Policy",
      "description": "Comprehensive data security commitments and advertising cookie settings.",
      "publisher": {
        "@type": "Organization",
        "name": "Apex Utility Labs",
        "url": "https://apexutility.live"
      }
    }
  },
  'terms-of-service': {
    title: "Terms of Service & AS-IS Software Licensing | Apex Suit",
    description: "Read our legally binding client-side software terms, user responsibilities, and absolute disclaimers of liability.",
    keywords: "terms of service, legal code license, disclaimer of warranty, as is software limit, user rules, scraper forbidden",
    ogTitle: "Apex Terms of Service & Legal Licensing Code",
    ogDescription: "Legally binding client rules, disclaimers, and guidelines for developer workstation usage.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Apex Terms of Service",
      "description": "Legally binding software licensing terms and liability releases.",
      "publisher": {
        "@type": "Organization",
        "name": "Apex Utility Labs",
        "url": "https://apexutility.live"
      }
    }
  },
  'about-us': {
    title: "About Apex Laboratories & APEX UTILITY | Reach Out",
    description: "Inspect our absolute offline-first developer mission, and safely transmit message queries to the APEX UTILITY support team.",
    keywords: "about us, apex laboratories creator, APEX UTILITY, offline developer tools, client wasm suite, compliance contact address",
    ogTitle: "About Apex Laboratories & APEX UTILITY compliance workspace",
    ogDescription: "Project compliance backgrounds and secure message logs dashboard for developer workstations.",
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Apex Laboratories",
      "description": "Constructed by APEX UTILITY to deliver zero-friction high performance assets.",
      "publisher": {
        "@type": "Organization",
        "name": "Apex Utility Labs",
        "url": "https://apexutility.live"
      }
    }
  },
  'guides': {
    title: "Apex Guides, Tutorials & Developer Articles | Apex Suit",
    description: "Read step-by-step developer documentation on WASM PDF compression, WebP rasterization, secure encryption entropy, and SEO sitemap indexing blueprints.",
    keywords: "developer guides, wasm pdf compression, webp conversion offline, browser encryption security, sitemap seo configuration, apex utility tutorial",
    ogTitle: "Apex Guides & Practical Tutorials Center",
    ogDescription: "Human-written technical tutorials on document engineering, secure client environments, and organic web indexes.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Apex Developer Guides & Blog",
      "description": "Comprehensive step-by-step developer instructions and knowledge base.",
      "publisher": {
        "@type": "Organization",
        "name": "Apex Utility Labs",
        "url": "https://apexutility.live"
      }
    }
  },
  'content-planner': {
    title: "AI Content Outline & Search Intent Planner | Apex SEO Suite",
    description: "Maximize organic traffic and audit user search intent. Extract high-impact LSI keywords and construct SEO optimal content hierarchies using Gemini AI.",
    keywords: "AI content outline planner, search intent classifier, organic SEO strategy builder, LSI search terms, Gemini content writer, article structure generator",
    ogTitle: "AI Content Outline & Search Intent Planner | APEX SEO",
    ogDescription: "Plan content campaigns scientifically. Discover search intent maps, LSI words, and custom article structures in real-time.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "AI Content Outline and Search Intent Planner",
      "description": "Analyze user intent, retrieve high value semantic keyword targets and draft precise, copywriter-ready article outlines via Gemini AI integration.",
      "applicationCategory": "SEOApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'schema-generator': {
    title: "JSON-LD Rich Schema Generator & AI Architect | Apex SEO Suite",
    description: "Create and validate schema markup patterns including FAQ pages, Article blocks, Local Businesses, and Product Offers or auto-generate schemas via AI.",
    keywords: "JSON-LD schema generator, Schema.org builder, rich snippet tags, Google snippet optimizer, structured data validator, AI microdata parser",
    ogTitle: "JSON-LD Rich Schema Generator & AI Architect",
    ogDescription: "Design, compile, and validate bulletproof structured schema.org markup with our dynamic visual template builder and AI-assisted compiler.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "JSON-LD Rich Schema Generator & AI Architect",
      "description": "Synthesizes or extracts SEO-compliant schema markup using direct input templates or Gemini AI parsing engines.",
      "applicationCategory": "SEOApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'content-gap': {
    title: "SEO Competitor Content-Gap Analyzer | Apex SEO Suite",
    description: "Identify search intents, uncover high-priority missing semantic keywords, analyze head-to-head topical gaps and formulate complete revision playbooks using AI.",
    keywords: "SEO content gap analysis, competitor keyword intelligence, on-page optimization auditor, LSI semantic compiler, Gemini search analyzer, topical map gap finder",
    ogTitle: "SEO Competitor Content-Gap Analyzer | APEX Suite",
    ogDescription: "Audit your content drafts against up to 3 rivals in real-time. Unveil missing keywords and structural head-to-head topical gaps beautifully.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "SEO Competitor Content-Gap Analyzer",
      "description": "Exposes missing keyword opportunities and structural heading gaps between our drafts and high-ranking competitor links.",
      "applicationCategory": "SEOApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  },
  'keyword-cluster': {
    title: "AI Keyword Clustering & Semantic Search Mapping | Apex SEO Suite",
    description: "Cluster raw search phrases into precise semantic authority hubs, classify funnel lifecycle intents, and draft ready-to-write article heading frameworks using AI.",
    keywords: "AI keyword clustering, semantic keyword tool, search intent clustering, topical authority map siloing, SEO sitemap outline architect, Gemini keywords grouping",
    ogTitle: "AI Keyword Clustering & Semantic Search Mapping | APEX Suite",
    ogDescription: "Transform list keywords into structured thematic search clusters, mapping user lifecycle stages and auto-generating articles metadata with Gemini.",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "AI Keyword Clustering & Semantic Mapping Tool",
      "description": "Groups lists of raw keywords into distinct semantic topic clusters, analyzes funnel distributions, and blueprints matching H2 layout trees.",
      "applicationCategory": "SEOApplication",
      "operatingSystem": "All Platforms",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    }
  }
};

export default function useSEOTags(activeTab: ActiveTab) {
  useEffect(() => {
    const meta = SEO_METADATA[activeTab];
    if (!meta) return;

    // 1. Title Update
    document.title = meta.title;

    const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Head Meta Descriptions and Keywords
    setMetaTag('name', 'description', meta.description);
    setMetaTag('name', 'keywords', meta.keywords);

    // 3. OpenGraph Schema Tags
    setMetaTag('property', 'og:title', meta.ogTitle);
    setMetaTag('property', 'og:description', meta.ogDescription);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', 'Apex Processing Labs');

    // 4. Twitter Card Parameters
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', meta.ogTitle);
    setMetaTag('name', 'twitter:description', meta.ogDescription);

    // 5. Dynamic JSON-LD structured schema script block tracking
    const existingScript = document.getElementById('apex-jsonld-schema');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'apex-jsonld-schema';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(meta.schema, null, 2);
    document.head.appendChild(script);

    return () => {
      // Dynamic cleanup if required or let succeeding navigation override naturally
    };
  }, [activeTab]);
}
