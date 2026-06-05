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
