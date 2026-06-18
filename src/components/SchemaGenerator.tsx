import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  Copy, 
  Check, 
  Download, 
  Braces, 
  Trash2, 
  AlertCircle, 
  Code,
  FileText,
  MapPin,
  Briefcase,
  Utensils,
  ShoppingBag,
  ExternalLink,
  Layers
} from 'lucide-react';

interface SchemaTypeConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  defaultData: Record<string, any>;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'array';
    placeholder?: string;
    options?: string[];
    hint?: string;
  }>;
}

const SCHEMA_TYPES: SchemaTypeConfig[] = [
  {
    id: 'Article',
    name: 'Article',
    icon: FileText,
    description: 'Perfect for news articles, blog posts, editorials, or tech journals.',
    defaultData: {
      headline: 'The Ultimate Guide to TypeScript Backends',
      authorName: 'Yasin Alam',
      authorType: 'Person',
      publisherName: 'Apex Tech Publication',
      publisherLogo: 'https://apexutility.live/logo.png',
      datePublished: '2026-06-18',
      dateModified: '2026-06-18',
      description: 'A comprehensive visual exploration into scaling and securing your TypeScript server-side applications.',
      image: 'https://apexutility.live/assets/typescript-guide.jpg'
    },
    fields: [
      { name: 'headline', label: 'Article Headline', type: 'text', placeholder: 'Enter headline title' },
      { name: 'description', label: 'Brief Description', type: 'textarea', placeholder: 'Short summary of the article' },
      { name: 'authorName', label: 'Author Name', type: 'text', placeholder: 'e.g. Jane Doe' },
      { name: 'authorType', label: 'Author Type', type: 'select', options: ['Person', 'Organization'] },
      { name: 'publisherName', label: 'Publisher Name', type: 'text', placeholder: 'e.g. TechCorp Solutions' },
      { name: 'publisherLogo', label: 'Publisher Logo URL', type: 'text', placeholder: 'https://example.com/logo.png' },
      { name: 'datePublished', label: 'Publish Date', type: 'date' },
      { name: 'dateModified', label: 'Modification Date', type: 'date' },
      { name: 'image', label: 'Featured Image URL', type: 'text', placeholder: 'https://example.com/cover.jpg' }
    ]
  },
  {
    id: 'FAQPage',
    name: 'FAQ Accordions',
    icon: HelpCircle,
    description: 'Increases search result real-estate with rich FAQ accordion expandable menus.',
    defaultData: {
      questions: [
        { q: 'Is this dynamic JSON-LD tool free?', a: 'Yes, our suite provides fully customizable, Google-compliant schema markups entirely free and offline-ready.' },
        { q: 'Where do I paste the compiled schema code?', a: 'You should insert this JSON-LD script block directly inside the <head> or <body> tags of your HTML document.' }
      ]
    },
    fields: [
      { name: 'questions', label: 'FAQ Items List', type: 'array' }
    ]
  },
  {
    id: 'Product',
    name: 'Product & Offer',
    icon: ShoppingBag,
    description: 'Enables search carousel badges, price listings, availability tags, and review ratings.',
    defaultData: {
      name: 'Apex SEO Utility Kit Pro',
      image: 'https://apexutility.live/assets/pro-kit.png',
      description: 'The ultimate professional grade toolsuite for modern technical optimization and batch parsing.',
      brand: 'Apex Suit',
      sku: 'APX-SEO-99',
      price: '49.99',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      ratingValue: '4.9',
      reviewCount: 382
    },
    fields: [
      { name: 'name', label: 'Product Name', type: 'text', placeholder: 'e.g. Wireless Noise-Cancelling Headphones' },
      { name: 'description', label: 'Product Description', type: 'textarea', placeholder: 'Premium specs, features and values' },
      { name: 'brand', label: 'Brand Name', type: 'text', placeholder: 'e.g. Apex' },
      { name: 'sku', label: 'SKU Code', type: 'text', placeholder: 'e.g. APX-99-PRO' },
      { name: 'price', label: 'Offer Price', type: 'number', placeholder: 'e.g. 49.99' },
      { name: 'priceCurrency', label: 'Currency ISO', type: 'text', placeholder: 'USD' },
      { name: 'availability', label: 'Availability', type: 'select', options: ['https://schema.org/InStock', 'https://schema.org/OutOfStock', 'https://schema.org/PreOrder'] },
      { name: 'ratingValue', label: 'Rating (1-5)', type: 'number', placeholder: '4.8' },
      { name: 'reviewCount', label: 'Total Reviews Count', type: 'number', placeholder: '120' }
    ]
  },
  {
    id: 'LocalBusiness',
    name: 'Local Business',
    icon: MapPin,
    description: 'Triggers local pack maps, telephone shortcuts, street addresses, and opening hours.',
    defaultData: {
      name: 'Apex Coding Studio',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94107',
      streetAddress: '555 Mission Street, Suite 400',
      telephone: '+1-415-555-0199',
      priceRange: '$$$',
      latitude: '37.7884',
      longitude: '-122.3998',
      image: 'https://apexutility.live/assets/hq-building.jpg'
    },
    fields: [
      { name: 'name', label: 'Business Name', type: 'text', placeholder: 'e.g. Downtown Dental Care' },
      { name: 'streetAddress', label: 'Street Address', type: 'text' },
      { name: 'addressLocality', label: 'City', type: 'text' },
      { name: 'addressRegion', label: 'State / Region Code', type: 'text', placeholder: 'e.g. NY' },
      { name: 'postalCode', label: 'Zip / Postal Code', type: 'text' },
      { name: 'telephone', label: 'Business Phone Number', type: 'text', placeholder: '+1-555-555-5555' },
      { name: 'priceRange', label: 'Price Accent', type: 'select', options: ['$', '$$', '$$$', '$$$$'] },
      { name: 'latitude', label: 'Latitude Degree', type: 'number', placeholder: '37.7749' },
      { name: 'longitude', label: 'Longitude Degree', type: 'number', placeholder: '-122.4194' },
      { name: 'image', label: 'Office Image URL', type: 'text', placeholder: 'https://example.com/facade.jpg' }
    ]
  },
  {
    id: 'JobPosting',
    name: 'Job Posting',
    icon: Briefcase,
    description: 'Increases exposure on Google Jobs search feed by packaging title, salary, and requirements.',
    defaultData: {
      title: 'Senior TypeScript & SEO Engineer',
      description: 'Demonstrated experience configuring cloud rendering services, managing structured LSI clusters, and mastering modern React micro-apps.',
      hiringOrganization: 'Apex Software Co.',
      jobLocation: 'Austin, TX (Hybrid)',
      salaryMin: '120000',
      salaryMax: '165000',
      salaryCurrency: 'USD',
      workHours: 'Full-time'
    },
    fields: [
      { name: 'title', label: 'Job Title', type: 'text', placeholder: 'e.g. Principal React Architect' },
      { name: 'description', label: 'Job Description Details', type: 'textarea', placeholder: 'Roles, requirements, responsibilities and stack details' },
      { name: 'hiringOrganization', label: 'Hiring Company', type: 'text', placeholder: 'Apex Suit' },
      { name: 'jobLocation', label: 'Hiring State/City', type: 'text', placeholder: 'San Francisco, CA' },
      { name: 'salaryMin', label: 'Minimum Range Annual', type: 'number', placeholder: '90000' },
      { name: 'salaryMax', label: 'Maximum Range Annual', type: 'number', placeholder: '140000' },
      { name: 'salaryCurrency', label: 'Salary Currency ISO', type: 'text', placeholder: 'USD' },
      { name: 'workHours', label: 'Employment Unit', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'] }
    ]
  },
  {
    id: 'Recipe',
    name: 'Recipe Snippet',
    icon: Utensils,
    description: 'Gives food listings elegant visuals, cooking minutes, ingredients lists, and calories metrics.',
    defaultData: {
      name: 'High-Performance Coding Granola Bar',
      author: 'Chef Yasin',
      cookTime: 'PT15M',
      prepTime: 'PT10M',
      description: 'A nutrient-dense organic coding snack packed with omega-3 fatty acids, slow-carb oats, and organic cacao bits to boost focus cycles.',
      recipeYield: '12 bars',
      calories: '180 kcal',
      ingredients: 'Organic Rolled Oats, Raw Honey, Chia Seeds, Crushed Almonds, Cacao Nibs',
      instructions: '1. Toast oats and almonds mildly. 2. Bind together with raw honey and seeds. 3. Firmly press into tray and set.'
    },
    fields: [
      { name: 'name', label: 'Recipe Name', type: 'text', placeholder: 'e.g. Classic Sourdough Bread' },
      { name: 'description', label: 'Recipe Description Summary', type: 'textarea' },
      { name: 'author', label: 'Chef/Author', type: 'text' },
      { name: 'prepTime', label: 'Prep Time (ISO-8601 Duration)', type: 'text', placeholder: 'PT10M' },
      { name: 'cookTime', label: 'Cook Time (ISO-8601 Duration)', type: 'text', placeholder: 'PT25M' },
      { name: 'recipeYield', label: 'Yield Amount', type: 'text', placeholder: '4 servings' },
      { name: 'calories', label: 'Calories Count', type: 'text', placeholder: '240 kcal' },
      { name: 'ingredients', label: 'Ingredients (Comma-Separated)', type: 'textarea', placeholder: 'Flour, Water, Yeast...' },
      { name: 'instructions', label: 'Preparation Steps (Comma-Separated/Numbered)', type: 'textarea', placeholder: '1. Mix ingredients. 2. Knead...' }
    ]
  }
];

const PRESET_AI_PROMPTS = [
  {
    title: "SaaS Product with Free Trial",
    text: "Apex Toolsuite Pro offers a comprehensive set of 40+ dynamic local web utilities. Brand: Apex Suit. Price list starts at 0 USD for community tiers, and 19 USD monthly for premium licenses. The kit ranks 4.96 stars with 2,400 user reviews. SKU code APX-TOL-2026. In stock online."
  },
  {
    title: "Technical Blog Post Review",
    text: "An article titled 'Leveraging WebAssembly for client-side PDF compression'. Published on 2026-06-12 by Senior Software Architect Jane Doe. Managed by Apex publishing house. The narrative covers PDF compression algorithms, web browser capabilities, and the rust toolchain."
  },
  {
    title: "Enterprise Software Job Posting",
    text: "Hiring: Senior Devops Architect at Apex Cloud Solutions, located onsite in Seattle, Washington. The salary ranges from 145k to 195k USD yearly. Looking for experts in Docker, Kubernetes, microservice orchestration, and edge security."
  }
];

export default function SchemaGenerator() {
  const [activeMode, setActiveMode] = useState<'visual' | 'ai'>('visual');
  const [selectedType, setSelectedType] = useState<string>('Article');
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // State for AI extract / generate
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSchemaType, setAiAiSchemaType] = useState('Product');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ schemaJson: string; explanation: string } | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize form data on type change
  useEffect(() => {
    const config = SCHEMA_TYPES.find(t => t.id === selectedType);
    if (config) {
      setFormData(JSON.parse(JSON.stringify(config.defaultData)));
    }
  }, [selectedType]);

  const handleFieldChange = (key: string, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  // Add/remove support for FAQ lists array dynamic items
  const handleFaqValChange = (idx: number, field: 'q' | 'a', value: string) => {
    const list = [...(formData.questions || [])];
    if (list[idx]) {
      list[idx][field] = value;
      handleFieldChange('questions', list);
    }
  };

  const addFaqItem = () => {
    const list = [...(formData.questions || [])];
    list.push({ q: '', a: '' });
    handleFieldChange('questions', list);
  };

  const removeFaqItem = (idx: number) => {
    const list = [...(formData.questions || [])];
    list.splice(idx, 1);
    handleFieldChange('questions', list);
  };

  // Compile manual Visual template properties to strict standard compliant JSON-LD Script
  const getCompiledJsonLd = (): string => {
    try {
      if (selectedType === 'FAQPage') {
        const faqs = (formData.questions || []).map((item: any) => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a
          }
        }));
        return JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs
        }, null, 2);
      }

      // Default fields compile dynamically
      const res: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": selectedType
      };

      const config = SCHEMA_TYPES.find(t => t.id === selectedType);
      if (config) {
        config.fields.forEach(f => {
          const val = formData[f.name];
          if (val !== undefined && val !== '') {
            if (f.name === 'ingredients' && typeof val === 'string') {
              res[f.name] = val.split(',').map(s => s.trim()).filter(Boolean);
            } else if (f.name === 'instructions' && typeof val === 'string') {
              res['recipeInstructions'] = val.split(/[0-9]+\.\s*/).map(s => s.trim()).filter(Boolean).map(step => ({
                "@type": "HowToStep",
                "text": step
              }));
            } else if (f.name === 'authorName') {
              res['author'] = {
                "@type": formData['authorType'] || 'Person',
                "name": val
              };
            } else if (f.name === 'publisherName') {
              res['publisher'] = {
                "@type": "Organization",
                "name": val,
                "logo": formData['publisherLogo'] ? {
                  "@type": "ImageObject",
                  "url": formData['publisherLogo']
                } : undefined
              };
            } else if (f.name === 'price' || f.name === 'priceCurrency' || f.name === 'availability') {
              if (!res['offers']) {
                res['offers'] = { "@type": "Offer" };
              }
              if (f.name === 'price') res['offers']['price'] = parseFloat(val) || val;
              if (f.name === 'priceCurrency') res['offers']['priceCurrency'] = val;
              if (f.name === 'availability') res['offers']['availability'] = val;
            } else if (f.name === 'ratingValue' || f.name === 'reviewCount') {
              if (!res['aggregateRating']) {
                res['aggregateRating'] = { "@type": "AggregateRating" };
              }
              if (f.name === 'ratingValue') res['aggregateRating']['ratingValue'] = val;
              if (f.name === 'reviewCount') res['aggregateRating']['reviewCount'] = val;
            } else if (f.name === 'streetAddress' || f.name === 'addressLocality' || f.name === 'addressRegion' || f.name === 'postalCode') {
              if (!res['address']) {
                res['address'] = { "@type": "PostalAddress" };
              }
              res['address'][f.name] = val;
            } else if (f.name === 'latitude' || f.name === 'longitude') {
              if (!res['geo']) {
                res['geo'] = { "@type": "GeoCoordinates" };
              }
              res['geo'][f.name] = val;
            } else if (f.name === 'salaryMin' || f.name === 'salaryMax' || f.name === 'salaryCurrency') {
              if (!res['estimatedSalary']) {
                res['estimatedSalary'] = {
                  "@type": "MonetaryAmount",
                  "currency": formData['salaryCurrency'] || 'USD',
                  "value": {
                    "@type": "QuantitativeValue",
                    "minValue": formData['salaryMin'],
                    "maxValue": formData['salaryMax'],
                    "unitText": "YEAR"
                  }
                };
              }
            } else if (['authorType', 'publisherLogo', 'salaryMin', 'salaryMax', 'salaryCurrency'].includes(f.name)) {
              // Handled by composite structures above
            } else {
              res[f.name] = val;
            }
          }
        });
      }

      return JSON.stringify(res, null, 2);
    } catch (e: any) {
      return `// Error compiling Schema: ${e.message}`;
    }
  };

  const handleAICompilation = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    setValidationError(null);
    setAiResult(null);

    try {
      const response = await fetch('/api/schema-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaType: aiSchemaType,
          textPrompt: aiPrompt.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP code ${response.status}`);
      }

      const result = await response.json();
      setAiResult({
        schemaJson: result.schemaJson,
        explanation: result.explanation
      });
    } catch (e: any) {
      console.error(e);
      setValidationError(e.message || 'Error occurred generating schema with AI layer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (txt: string, filename: string) => {
    const blob = new Blob([txt], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7" id="jsonld-rich-schema-generator">
      {/* Overview instructions & mode selector */}
      <div className="bg-[#0f0f15] border border-slate-800 rounded-2xl p-5 sm:p-7 relative overflow-hidden backdrop-blur-md shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Braces className="w-5 h-5 text-rose-400" />
              <span>JSON-LD Rich Schema Generator</span>
            </h3>
            <p className="text-xs text-slate-400">Generate Google-compliant structured schema code blocks to upgrade click-through rates (CRT).</p>
          </div>

          <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl max-w-xs shrink-0">
            <button
              onClick={() => setActiveMode('visual')}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeMode === 'visual' 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visual Builder
            </button>
            <button
              onClick={() => setActiveMode('ai')}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeMode === 'ai' 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔮 AI Extractor
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeMode === 'visual' ? (
          <motion.div
            key="visual-mode"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Visual Builder left panel */}
            <div className="bg-[#0e0e13] border border-slate-850 rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Select Schema Template Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {SCHEMA_TYPES.map(type => {
                    const Icon = type.icon;
                    const active = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
                          active 
                            ? 'border-rose-500 bg-rose-500/5 text-white shadow-[0_0_12px_rgba(244,63,94,0.15)]' 
                            : 'border-slate-800 bg-slate-950 hover:bg-slate-900/40 text-slate-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-rose-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold tracking-tight block truncate">{type.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Inputs form */}
              <div className="border-t border-slate-850 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Configure Fields</h4>
                  <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">
                    Schema: {selectedType}
                  </span>
                </div>

                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedType === 'FAQPage' ? (
                    <div className="space-y-4">
                      <p className="text-[11px] text-slate-400 italic">Enter questions and answers below. These package into Google-compliant FAQ schema tags.</p>
                      
                      {(formData.questions || []).map((faq: any, idx: number) => (
                        <div key={idx} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3.5 space-y-3 relative">
                          <button
                            type="button"
                            onClick={() => removeFaqItem(idx)}
                            className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Remove Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-rose-500 uppercase font-bold">Q{idx + 1} Question:</span>
                            <input
                              type="text"
                              value={faq.q}
                              onChange={(e) => handleFaqValChange(idx, 'q', e.target.value)}
                              placeholder="e.g. Is support included?"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-lg text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-rose-550 uppercase font-bold">Q{idx + 1} Answer:</span>
                            <textarea
                              rows={2}
                              value={faq.a}
                              onChange={(e) => handleFaqValChange(idx, 'a', e.target.value)}
                              placeholder="Describe the answer comprehensively..."
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-lg text-xs text-white resize-none"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addFaqItem}
                        className="w-full py-2.5 border border-dashed border-slate-800 hover:border-slate-650 bg-slate-955 text-[11px] font-mono text-slate-350 hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
                      >
                        + Add Additional FAQ Pair
                      </button>
                    </div>
                  ) : (
                    SCHEMA_TYPES.find(t => t.id === selectedType)?.fields.map((f) => (
                      <div key={f.name} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-semibold text-slate-200">
                            {f.label}
                          </label>
                          {f.hint && <span className="text-[10px] text-slate-500 font-mono">{f.hint}</span>}
                        </div>

                        {f.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={formData[f.name] || ''}
                            onChange={(e) => handleFieldChange(f.name, e.target.value)}
                            placeholder={f.placeholder}
                            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-xs text-white resize-none outline-none transition-colors"
                          />
                        ) : f.type === 'select' ? (
                          <select
                            value={formData[f.name] || ''}
                            onChange={(e) => handleFieldChange(f.name, e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-xs text-slate-300 outline-none transition-colors"
                          >
                            {(f.options || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type}
                            value={formData[f.name] || ''}
                            onChange={(e) => handleFieldChange(f.name, e.target.value)}
                            placeholder={f.placeholder}
                            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none transition-colors"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Visual Schema Output preview right panel */}
            <div className="space-y-5 flex flex-col">
              <div className="bg-[#0c0c11] border border-slate-850 rounded-2xl p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Code className="w-4.5 h-4.5 text-rose-400" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Pruned JSON-LD Block</h4>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(getCompiledJsonLd())}
                        className="p-1 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold font-mono">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="font-mono">Copy Code</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDownload(getCompiledJsonLd(), `schema_${selectedType.toLowerCase()}.json`)}
                        className="p-1 px-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-xs text-rose-450 text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="font-mono">Download</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl flex-1 relative font-mono text-xs overflow-auto max-h-[360px] min-h-[250px] shadow-inner text-emerald-450 text-emerald-450 selection:bg-rose-500/20 text-emerald-400">
                    <pre className="whitespace-pre">{getCompiledJsonLd()}</pre>
                  </div>
                </div>

                {/* Validation and Rich helper */}
                <div className="mt-5 border-t border-slate-850 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                    <h5 className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <span>Validated Syntax</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">Strict JSON formatting. Fits Google crawler compliance automatically.</p>
                  </div>

                  <a
                    href="https://search.google.com/test/rich-results"
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="p-3 bg-slate-950/40 border border-slate-900 hover:border-slate-800 rounded-xl space-y-1 block transition-all group group-hover:border-rose-500/30"
                  >
                    <h5 className="font-bold text-rose-400 flex items-center gap-1.5 group-hover:text-rose-350">
                      <span>Test Rich Snippet</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </h5>
                    <p className="text-[11px] text-slate-400">Test this generated JSON-LD payload in the official Google Rich Results tool.</p>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ai-extractor-mode"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* AI compilation workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input side */}
              <div className="bg-[#0e0e13] border border-slate-850 rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-400" />
                  <div>
                    <h4 className="font-bold text-white text-sm">AI Unstructured Content Compiler</h4>
                    <p className="text-[11px] text-slate-400">Paste your raw text, draft copy or corporate notes, and let Gemini construct schema objects.</p>
                  </div>
                </div>

                {/* Preset selectors to play with */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Insert Preset Samples:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AI_PROMPTS.map((pre, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setAiPrompt(pre.text);
                        }}
                        className="px-2.5 py-1 text-[11px] bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-lg transition-all cursor-pointer"
                      >
                        {pre.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Target Rich Schema type
                  </label>
                  <select
                    value={aiSchemaType}
                    onChange={(e) => setAiAiSchemaType(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-slate-300 text-xs outline-none transition-colors"
                  >
                    <option value="Product">Product &amp; Offer Schema</option>
                    <option value="Article">Article &amp; Blog Story Microdata</option>
                    <option value="FAQPage">Sitemap FAQ Accordions List</option>
                    <option value="LocalBusiness">Local Business Location &amp; Hours</option>
                    <option value="JobPosting">Industry Job Posting details</option>
                    <option value="Recipe">Cooking Recipe Snippet tags</option>
                    <option value="Organization">Corporate Organization Details</option>
                    <option value="SoftwareApplication">Mobile or Web Software Specs</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Source text or Draft Content
                  </label>
                  <textarea
                    rows={8}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Paste a product details page, email copy, listing specifications, or type instructions to generate custom nested microdata formats..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-xs text-white resize-none outline-none transition-all placeholder:text-slate-650"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleAICompilation}
                    disabled={loading || !aiPrompt.trim()}
                    className="px-5 py-3 bg-rose-600 hover:bg-rose-550 hover:bg-rose-500 disabled:bg-slate-900 disabled:text-slate-650 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.20)] flex items-center gap-2 cursor-pointer disabled:pointer-events-none"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>AI Restructuring...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                        <span>Compile Rich Schema</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI output result */}
              <div className="space-y-5 flex flex-col justify-between">
                {validationError && (
                  <div className="bg-rose-950/25 border border-rose-800/60 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-450 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-300">AI Parsing Error</h5>
                      <p className="text-xs text-slate-300 mt-1">{validationError}</p>
                    </div>
                  </div>
                )}

                {aiResult ? (
                  <div className="bg-[#0c0c11] border border-slate-850 rounded-2xl p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded text-rose-400 font-bold uppercase">
                          JSON-LD Microdata Output
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(aiResult.schemaJson)}
                            className="p-1 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-mono">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="font-mono">Copy Code</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDownload(aiResult.schemaJson, `ai_schema_${aiSchemaType}.json`)}
                            className="p-1 px-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-xs text-rose-450 text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="font-mono">Download JSON</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl flex-1 relative font-mono text-xs overflow-auto max-h-[300px] min-h-[220px] shadow-inner text-emerald-400">
                        <pre className="whitespace-pre">{aiResult.schemaJson}</pre>
                      </div>

                      <div className="space-y-2 bg-[#12121a] p-4 border border-slate-850 rounded-xl">
                        <h5 className="font-mono font-bold text-[10px] text-slate-450 text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>AI Alignment &amp; Recommendation</span>
                        </h5>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiResult.explanation}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0c0c11]/80 border border-slate-850/70 rounded-2xl p-8 flex-1 flex flex-col items-center justify-center text-center space-y-3.5">
                    {loading ? (
                      <div className="space-y-4">
                        <div className="relative w-12 h-12 mx-auto">
                          <div className="absolute inset-0 border-3 border-rose-500/10 rounded-full" />
                          <div className="absolute inset-0 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-xs text-rose-400 font-mono animate-pulse uppercase tracking-widest">Compiling unstructured parameters...</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl text-slate-650 text-slate-500">
                          <Braces className="w-8 h-8" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                          <h4 className="text-sm font-semibold text-slate-350">Awaiting AI Schema Directives</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">Choose target microdata structures, insert preset samples or manual instructions, then compile your schema block using Google-trained modeling.</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
