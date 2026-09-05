import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, Sparkles, Copy, Download, Check, AlertTriangle, 
  CheckCircle2, ExternalLink, HelpCircle, Plus, Trash2, 
  Smartphone, Monitor, Eye, FileCode, Layers, Star,
  Calendar, MapPin, Clock, Tag, DollarSign, BookOpen, 
  Building2, Utensils, Award, RefreshCw, ChevronDown, ChevronUp,
  Share2, ShieldCheck, ChevronRight
} from 'lucide-react';
import { addRecentOperation } from '../utils/recentOperations';

export type SchemaType = 
  | 'FAQPage'
  | 'Article'
  | 'Product'
  | 'HowTo'
  | 'LocalBusiness'
  | 'Organization'
  | 'Recipe'
  | 'Event'
  | 'BreadcrumbList';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  property: string;
  message: string;
}

export default function SchemaRichSnippetBuilder() {
  const [activeSchema, setActiveSchema] = useState<SchemaType>('FAQPage');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [outputFormat, setOutputFormat] = useState<'jsonld' | 'microdata'>('jsonld');
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // 1. FAQ STATE
  const [faqs, setFaqs] = useState([
    { question: 'What is Schema.org structured data markup?', answer: 'Schema.org structured data is a standardized vocabulary of tags added to HTML to help search engines understand page content and display rich results.' },
    { question: 'How do rich snippets improve organic search ranking & CTR?', answer: 'Rich snippets enhance your SERP listing with visual elements like star ratings, FAQs, and pricing, typically increasing organic click-through rates by 20% to 35%.' },
    { question: 'Why does Google prefer JSON-LD over Microdata?', answer: 'JSON-LD separates structured data from page presentation, making it easier to maintain, less error-prone, and faster for search engine crawlers to parse.' }
  ]);

  // 2. ARTICLE STATE
  const [article, setArticle] = useState({
    headline: 'Next-Gen Frontend Architecture & Core Web Vitals in 2026',
    description: 'A deep architectural dive into optimizing DOM rendering performance, server-side rendering, and achieving 100/100 Lighthouse performance scores.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200',
    authorName: 'Alex Mercer',
    authorType: 'Person' as 'Person' | 'Organization',
    authorUrl: 'https://example.com/authors/alex-mercer',
    publisherName: 'TechVanguard Engineering',
    publisherLogo: 'https://example.com/logo.png',
    datePublished: '2026-08-01T09:00:00+00:00',
    dateModified: '2026-08-15T14:30:00+00:00',
    mainEntityOfPage: 'https://example.com/blog/frontend-architecture-2026'
  });

  // 3. PRODUCT STATE
  const [product, setProduct] = useState({
    name: 'Quantum Wireless Pro ANC Headphones',
    description: 'Audiophile-grade wireless over-ear noise-cancelling headphones with 45-hour battery life and spatial audio calibration.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
    brand: 'Acoustic Labs',
    sku: 'AL-QW-PRO-BLK',
    mpn: '9845-ANC-2026',
    price: '299.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    ratingValue: '4.8',
    reviewCount: '124',
    bestRating: '5',
    sellerName: 'Acoustic Labs Official Store',
    url: 'https://example.com/products/quantum-wireless-pro'
  });

  // 4. HOWTO STATE
  const [howTo, setHowTo] = useState({
    name: 'How to Calibrate Acoustic Audio Studio Monitors',
    description: 'Learn the exact 4-step acoustic positioning technique to eliminate room standing waves and achieve pristine frequency response.',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200',
    totalTime: 'PT30M',
    estimatedCost: '0 USD',
    supply: ['SPL Sound Meter', 'Monitor Isolation Pads'],
    tools: ['DAW Tone Generator', 'Laser Tape Measure'],
    steps: [
      { name: 'Form Equilateral Triangle', text: 'Position your listening seat and both monitors at equal distance forming a precise 60-degree equilateral triangle.', image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800', url: 'https://example.com/howto/audio-calibration#step1' },
      { name: 'Align Tweeters at Ear Height', text: 'Adjust speaker stand heights so the acoustic center of the high-frequency tweeters sits exactly level with your ear canal.', image: '', url: 'https://example.com/howto/audio-calibration#step2' },
      { name: 'Decouple with High-Density Pads', text: 'Place polyurethane isolation pads underneath monitor bases to prevent bass vibration transfer to the desk surface.', image: '', url: 'https://example.com/howto/audio-calibration#step3' }
    ]
  });

  // 5. LOCAL BUSINESS STATE
  const [localBiz, setLocalBiz] = useState({
    name: 'Artisan Bistro & Wine Bar',
    businessType: 'Restaurant',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
    telephone: '+1-555-849-2041',
    priceRange: '$$$',
    streetAddress: '742 Evergreen Promenade',
    addressLocality: 'San Francisco',
    addressRegion: 'CA',
    postalCode: '94107',
    addressCountry: 'US',
    latitude: '37.7749',
    longitude: '-122.4194',
    url: 'https://example.com/artisan-bistro',
    servesCuisine: 'Modern Californian, French Fusion',
    openingHours: 'Mo-Sa 17:00-23:00',
    ratingValue: '4.9',
    reviewCount: '342'
  });

  // 6. ORGANIZATION STATE
  const [org, setOrg] = useState({
    name: 'Apex Utility Technologies Inc.',
    legalName: 'Apex Utility Technologies Global Corporation',
    url: 'https://example.com',
    logo: 'https://example.com/brand-logo.png',
    description: 'Pioneering privacy-centric client-side developer tooling, cryptography suites, and SEO infrastructure.',
    email: 'contact@example.com',
    telephone: '+1-800-555-0199',
    sameAs: [
      'https://twitter.com/ApexUtility',
      'https://github.com/ApexUtilityLabs',
      'https://linkedin.com/company/apex-utility'
    ]
  });

  // 7. RECIPE STATE
  const [recipe, setRecipe] = useState({
    name: 'Authentic Neapolitan Sourdough Pizza',
    description: 'Crisp, blistered 72-hour cold-fermented sourdough pizza with San Marzano tomatoes and fresh buffalo mozzarella.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200',
    authorName: 'Chef Marco Rossi',
    prepTime: 'PT30M',
    cookTime: 'PT5M',
    totalTime: 'PT35M',
    recipeYield: '4 personal pizzas',
    recipeCategory: 'Main Course',
    recipeCuisine: 'Italian',
    calories: '680 calories',
    ratingValue: '4.95',
    reviewCount: '89',
    ingredients: [
      '500g Tipo 00 Flour',
      '350g Filtered Water (70% hydration)',
      '100g Active Sourdough Starter',
      '12g Sea Salt',
      '200g San Marzano Tomatoes (crushed)',
      '250g Fresh Mozzarella di Bufala'
    ],
    instructions: [
      'Mix flour, water, and sourdough starter into a shaggy dough and rest for 30 minutes autolyse.',
      'Incorporate sea salt with stretch-and-fold techniques across 2 hours, then cold ferment for 48-72 hours in refrigerator.',
      'Shape into dough balls, stretch gently leaving an airy cornicione border, top with tomatoes and cheese.',
      'Bake on a preheated pizza stone or outdoor oven at 900°F (480°C) for 90 seconds until charred.'
    ]
  });

  // 8. EVENT STATE
  const [eventData, setEventData] = useState({
    name: 'Global Frontend & AI Summit 2026',
    description: 'The premier international conference uniting engineers building next-generation web platforms, AI web agents, and distributed applications.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
    startDate: '2026-10-15T09:00:00-07:00',
    endDate: '2026-10-17T18:00:00-07:00',
    eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    locationName: 'Moscone Convention Center',
    streetAddress: '747 Howard St',
    addressLocality: 'San Francisco',
    addressRegion: 'CA',
    postalCode: '94103',
    addressCountry: 'US',
    ticketPrice: '499.00',
    ticketCurrency: 'USD',
    ticketUrl: 'https://example.com/summit2026/tickets',
    organizerName: 'TechVanguard Events'
  });

  // 9. BREADCRUMBLIST STATE
  const [breadcrumbs, setBreadcrumbs] = useState([
    { position: 1, name: 'Home', item: 'https://example.com' },
    { position: 2, name: 'Developer Tools', item: 'https://example.com/tools' },
    { position: 3, name: 'SEO & Structured Data', item: 'https://example.com/tools/seo-structured-data' }
  ]);

  // GENERATE JSON-LD OBJECT
  const jsonLdObject = useMemo(() => {
    switch (activeSchema) {
      case 'FAQPage':
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': faqs.map(f => ({
            '@type': 'Question',
            'name': f.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': f.answer
            }
          }))
        };

      case 'Article':
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': article.headline,
          'description': article.description,
          'image': article.image ? [article.image] : undefined,
          'author': {
            '@type': article.authorType,
            'name': article.authorName,
            'url': article.authorUrl || undefined
          },
          'publisher': {
            '@type': 'Organization',
            'name': article.publisherName,
            'logo': article.publisherLogo ? {
              '@type': 'ImageObject',
              'url': article.publisherLogo
            } : undefined
          },
          'datePublished': article.datePublished,
          'dateModified': article.dateModified || article.datePublished,
          'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': article.mainEntityOfPage
          }
        };

      case 'Product':
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          'name': product.name,
          'image': product.image ? [product.image] : undefined,
          'description': product.description,
          'sku': product.sku,
          'mpn': product.mpn,
          'brand': {
            '@type': 'Brand',
            'name': product.brand
          },
          'aggregateRating': product.ratingValue ? {
            '@type': 'AggregateRating',
            'ratingValue': product.ratingValue,
            'reviewCount': product.reviewCount,
            'bestRating': product.bestRating
          } : undefined,
          'offers': {
            '@type': 'Offer',
            'url': product.url,
            'priceCurrency': product.priceCurrency,
            'price': product.price,
            'itemCondition': product.itemCondition,
            'availability': product.availability,
            'seller': {
              '@type': 'Organization',
              'name': product.sellerName
            }
          }
        };

      case 'HowTo':
        return {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          'name': howTo.name,
          'description': howTo.description,
          'image': howTo.image ? [howTo.image] : undefined,
          'totalTime': howTo.totalTime,
          'supply': howTo.supply.filter(s => s.trim()).map(s => ({
            '@type': 'HowToSupply',
            'name': s
          })),
          'tool': howTo.tools.filter(t => t.trim()).map(t => ({
            '@type': 'HowToTool',
            'name': t
          })),
          'step': howTo.steps.map((st, idx) => ({
            '@type': 'HowToStep',
            'position': idx + 1,
            'name': st.name,
            'text': st.text,
            'image': st.image || undefined,
            'url': st.url || undefined
          }))
        };

      case 'LocalBusiness':
        return {
          '@context': 'https://schema.org',
          '@type': localBiz.businessType || 'LocalBusiness',
          'name': localBiz.name,
          'image': localBiz.image ? [localBiz.image] : undefined,
          'telephone': localBiz.telephone,
          'priceRange': localBiz.priceRange,
          'url': localBiz.url,
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': localBiz.streetAddress,
            'addressLocality': localBiz.addressLocality,
            'addressRegion': localBiz.addressRegion,
            'postalCode': localBiz.postalCode,
            'addressCountry': localBiz.addressCountry
          },
          'geo': (localBiz.latitude && localBiz.longitude) ? {
            '@type': 'GeoCoordinates',
            'latitude': localBiz.latitude,
            'longitude': localBiz.longitude
          } : undefined,
          'openingHoursSpecification': [
            {
              '@type': 'OpeningHoursSpecification',
              'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
              'opens': '17:00',
              'closes': '23:00'
            }
          ],
          'aggregateRating': localBiz.ratingValue ? {
            '@type': 'AggregateRating',
            'ratingValue': localBiz.ratingValue,
            'reviewCount': localBiz.reviewCount
          } : undefined
        };

      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          'name': org.name,
          'legalName': org.legalName,
          'url': org.url,
          'logo': org.logo,
          'description': org.description,
          'email': org.email,
          'telephone': org.telephone,
          'sameAs': org.sameAs.filter(s => s.trim())
        };

      case 'Recipe':
        return {
          '@context': 'https://schema.org',
          '@type': 'Recipe',
          'name': recipe.name,
          'image': recipe.image ? [recipe.image] : undefined,
          'author': {
            '@type': 'Person',
            'name': recipe.authorName
          },
          'description': recipe.description,
          'prepTime': recipe.prepTime,
          'cookTime': recipe.cookTime,
          'totalTime': recipe.totalTime,
          'recipeYield': recipe.recipeYield,
          'recipeCategory': recipe.recipeCategory,
          'recipeCuisine': recipe.recipeCuisine,
          'nutrition': recipe.calories ? {
            '@type': 'NutritionInformation',
            'calories': recipe.calories
          } : undefined,
          'aggregateRating': recipe.ratingValue ? {
            '@type': 'AggregateRating',
            'ratingValue': recipe.ratingValue,
            'reviewCount': recipe.reviewCount
          } : undefined,
          'recipeIngredient': recipe.ingredients.filter(i => i.trim()),
          'recipeInstructions': recipe.instructions.map((ins, idx) => ({
            '@type': 'HowToStep',
            'position': idx + 1,
            'text': ins
          }))
        };

      case 'Event':
        return {
          '@context': 'https://schema.org',
          '@type': 'Event',
          'name': eventData.name,
          'description': eventData.description,
          'image': eventData.image ? [eventData.image] : undefined,
          'startDate': eventData.startDate,
          'endDate': eventData.endDate,
          'eventAttendanceMode': eventData.eventAttendanceMode,
          'eventStatus': eventData.eventStatus,
          'location': {
            '@type': 'Place',
            'name': eventData.locationName,
            'address': {
              '@type': 'PostalAddress',
              'streetAddress': eventData.streetAddress,
              'addressLocality': eventData.addressLocality,
              'addressRegion': eventData.addressRegion,
              'postalCode': eventData.postalCode,
              'addressCountry': eventData.addressCountry
            }
          },
          'offers': {
            '@type': 'Offer',
            'url': eventData.ticketUrl,
            'price': eventData.ticketPrice,
            'priceCurrency': eventData.ticketCurrency,
            'availability': 'https://schema.org/InStock'
          },
          'organizer': {
            '@type': 'Organization',
            'name': eventData.organizerName
          }
        };

      case 'BreadcrumbList':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': breadcrumbs.map(b => ({
            '@type': 'ListItem',
            'position': b.position,
            'name': b.name,
            'item': b.item
          }))
        };

      default:
        return {};
    }
  }, [activeSchema, faqs, article, product, howTo, localBiz, org, recipe, eventData, breadcrumbs]);

  // Clean JSON-LD string formatted with script tags
  const jsonLdString = useMemo(() => {
    return JSON.stringify(jsonLdObject, null, 2);
  }, [jsonLdObject]);

  const scriptTagCode = useMemo(() => {
    return `<script type="application/ld+json">\n${jsonLdString}\n</script>`;
  }, [jsonLdString]);

  // Microdata Format representation
  const microdataCode = useMemo(() => {
    if (activeSchema === 'FAQPage') {
      return `<div itemscope itemtype="https://schema.org/FAQPage">
${faqs.map(f => `  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">${f.question}</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text">${f.answer}</div>
    </div>
  </div>`).join('\n')}
</div>`;
    }
    if (activeSchema === 'Article') {
      return `<article itemscope itemtype="https://schema.org/Article">
  <h1 itemprop="headline">${article.headline}</h1>
  <p itemprop="description">${article.description}</p>
  <img itemprop="image" src="${article.image}" alt="${article.headline}" />
  <span itemprop="author" itemscope itemtype="https://schema.org/${article.authorType}">
    <span itemprop="name">${article.authorName}</span>
  </span>
  <meta itemprop="datePublished" content="${article.datePublished}" />
  <meta itemprop="dateModified" content="${article.dateModified}" />
</article>`;
    }
    return `<!-- JSON-LD is Google's strongly recommended format for ${activeSchema}. Switch to JSON-LD view for maximum compatibility. -->\n${scriptTagCode}`;
  }, [activeSchema, faqs, article, scriptTagCode]);

  // VALIDATION & LINTER ENGINE
  const validationIssues = useMemo<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = [];

    if (activeSchema === 'FAQPage') {
      if (faqs.length === 0) {
        issues.push({ type: 'error', property: 'mainEntity', message: 'At least one FAQ Question & Answer item is required for FAQPage schema.' });
      }
      faqs.forEach((f, idx) => {
        if (!f.question.trim()) issues.push({ type: 'error', property: `FAQ #${idx + 1} Question`, message: 'Question cannot be empty.' });
        if (!f.answer.trim()) issues.push({ type: 'error', property: `FAQ #${idx + 1} Answer`, message: 'Accepted answer text cannot be empty.' });
      });
    } else if (activeSchema === 'Article') {
      if (!article.headline.trim()) issues.push({ type: 'error', property: 'headline', message: 'Article headline is required by Google.' });
      if (!article.image.trim()) issues.push({ type: 'warning', property: 'image', message: 'Images are strongly recommended for Google Discover and top stories.' });
      if (!article.authorName.trim()) issues.push({ type: 'error', property: 'author', message: 'Author name is required for E-E-A-T trust signals.' });
      if (!article.datePublished.trim()) issues.push({ type: 'error', property: 'datePublished', message: 'datePublished (ISO-8601 format) is required.' });
    } else if (activeSchema === 'Product') {
      if (!product.name.trim()) issues.push({ type: 'error', property: 'name', message: 'Product title is required.' });
      if (!product.price.trim() || isNaN(Number(product.price))) issues.push({ type: 'error', property: 'offers.price', message: 'Valid numerical product price is required.' });
      if (!product.image.trim()) issues.push({ type: 'warning', property: 'image', message: 'Product image URL is strongly recommended for Google Shopping rich cards.' });
      if (!product.ratingValue) issues.push({ type: 'info', property: 'aggregateRating', message: 'Add rating value to unlock rich star ratings in Google SERP.' });
    } else if (activeSchema === 'HowTo') {
      if (!howTo.name.trim()) issues.push({ type: 'error', property: 'name', message: 'HowTo title is required.' });
      if (howTo.steps.length < 2) issues.push({ type: 'warning', property: 'step', message: 'Google recommends providing at least 2 structured steps.' });
      if (!howTo.totalTime.startsWith('P')) issues.push({ type: 'warning', property: 'totalTime', message: 'totalTime should use ISO 8601 duration format (e.g., PT30M for 30 mins).' });
    } else if (activeSchema === 'LocalBusiness') {
      if (!localBiz.name.trim()) issues.push({ type: 'error', property: 'name', message: 'Business name is required.' });
      if (!localBiz.streetAddress.trim() || !localBiz.addressLocality.trim()) issues.push({ type: 'error', property: 'address', message: 'Postal address with street and city is required for local pack listings.' });
      if (!localBiz.telephone.trim()) issues.push({ type: 'warning', property: 'telephone', message: 'Telephone number is recommended for direct call actions.' });
    }

    return issues;
  }, [activeSchema, faqs, article, product, howTo, localBiz]);

  const hasErrors = validationIssues.some(i => i.type === 'error');

  // COPY HANDLER
  const handleCopyCode = () => {
    const code = outputFormat === 'jsonld' ? scriptTagCode : microdataCode;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    addRecentOperation(
      `Schema.org JSON-LD (${activeSchema})`,
      'Shield Vault',
      'N/A',
      'N/A',
      'Schema Script Copied',
      '#'
    );
  };

  // DOWNLOAD HANDLER
  const handleDownloadCode = () => {
    const code = outputFormat === 'jsonld' ? scriptTagCode : microdataCode;
    const blob = new Blob([code], { type: 'application/ld+json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `schema_${activeSchema.toLowerCase()}.jsonld`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addRecentOperation(
      `Schema File Export (${activeSchema})`,
      'Shield Vault',
      'N/A',
      'N/A',
      'JSON-LD File Download',
      '#'
    );
  };

  // OPEN GOOGLE RICH RESULTS TEST
  const handleOpenGoogleTester = () => {
    window.open('https://search.google.com/test/rich-results', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 font-sans text-slate-100">

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Schema.org & Rich Snippet Architect
                </h1>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                  Google SERP Optimizer
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Visually construct valid Schema.org JSON-LD structured data, preview live Google Search rich results, and audit schema compliance.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleOpenGoogleTester}
              className="flex items-center space-x-1.5 rounded-xl bg-blue-500/20 px-3.5 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/30 transition border border-blue-500/40"
              title="Open Google Official Rich Results Test"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Google Rich Results Test</span>
            </button>
            <button
              onClick={handleDownloadCode}
              className="flex items-center space-x-1.5 rounded-xl bg-amber-500/20 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition border border-amber-500/40"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .jsonld</span>
            </button>
          </div>
        </div>

        {/* Schema Type Navigation Bar */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-amber-500/20 pt-4">
          {[
            { id: 'FAQPage' as SchemaType, label: 'FAQ Page', icon: HelpCircle },
            { id: 'Article' as SchemaType, label: 'Article / Blog', icon: BookOpen },
            { id: 'Product' as SchemaType, label: 'Product & Pricing', icon: Tag },
            { id: 'HowTo' as SchemaType, label: 'How-To Guide', icon: Award },
            { id: 'LocalBusiness' as SchemaType, label: 'Local Business', icon: MapPin },
            { id: 'Organization' as SchemaType, label: 'Organization', icon: Building2 },
            { id: 'Recipe' as SchemaType, label: 'Food Recipe', icon: Utensils },
            { id: 'Event' as SchemaType, label: 'Live Event', icon: Calendar },
            { id: 'BreadcrumbList' as SchemaType, label: 'Breadcrumb Trail', icon: Layers }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSchema === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSchema(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  isActive 
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20' 
                    : 'bg-zinc-900/90 text-slate-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Grid: Visual Form Builder (Left 6) vs Google Rich Results Simulator & Code Export (Right 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Interactive Form Controls for Active Schema */}
        <div className="lg:col-span-6 space-y-6">

          {/* Form Card Container */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCode className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {activeSchema} Schema Parameters
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                JSON-LD Linked Data
              </span>
            </div>

            {/* 1. FAQ PAGE FORM */}
            {activeSchema === 'FAQPage' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Frequently Asked Questions ({faqs.length})
                  </label>
                  <button
                    onClick={() => setFaqs([...faqs, { question: 'New Question?', answer: 'Detailed helpful response.' }])}
                    className="flex items-center space-x-1 text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="rounded-xl bg-zinc-950/80 p-3.5 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-amber-400">
                        <span>Question #{idx + 1}</span>
                        {faqs.length > 1 && (
                          <button
                            onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                            className="text-rose-400 hover:text-rose-300 flex items-center space-x-0.5"
                            title="Remove Question"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="text-[10px]">Delete</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[idx].question = e.target.value;
                          setFaqs(updated);
                        }}
                        placeholder="e.g., How do I get started with the API?"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[idx].answer = e.target.value;
                          setFaqs(updated);
                        }}
                        placeholder="e.g., To get started, navigate to your settings and generate an API key..."
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. ARTICLE FORM */}
            {activeSchema === 'Article' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Article Headline / Title *</label>
                  <input
                    type="text"
                    value={article.headline}
                    onChange={(e) => setArticle({ ...article, headline: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Description / Summary</label>
                  <textarea
                    rows={2}
                    value={article.description}
                    onChange={(e) => setArticle({ ...article, description: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Author Name *</label>
                    <input
                      type="text"
                      value={article.authorName}
                      onChange={(e) => setArticle({ ...article, authorName: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Author Type</label>
                    <select
                      value={article.authorType}
                      onChange={(e) => setArticle({ ...article, authorType: e.target.value as any })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Person">Person</option>
                      <option value="Organization">Organization</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Publisher Name</label>
                    <input
                      type="text"
                      value={article.publisherName}
                      onChange={(e) => setArticle({ ...article, publisherName: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Published Date (ISO)</label>
                    <input
                      type="text"
                      value={article.datePublished}
                      onChange={(e) => setArticle({ ...article, datePublished: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Image URL (High-Res for Google Discover)</label>
                  <input
                    type="url"
                    value={article.image}
                    onChange={(e) => setArticle({ ...article, image: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 3. PRODUCT FORM */}
            {activeSchema === 'Product' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Product Name *</label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Brand Name</label>
                    <input
                      type="text"
                      value={product.brand}
                      onChange={(e) => setProduct({ ...product, brand: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">SKU / MPN</label>
                    <input
                      type="text"
                      value={product.sku}
                      onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Price *</label>
                    <input
                      type="text"
                      value={product.price}
                      onChange={(e) => setProduct({ ...product, price: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Currency</label>
                    <select
                      value={product.priceCurrency}
                      onChange={(e) => setProduct({ ...product, priceCurrency: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Availability</label>
                    <select
                      value={product.availability}
                      onChange={(e) => setProduct({ ...product, availability: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="https://schema.org/InStock">In Stock</option>
                      <option value="https://schema.org/OutOfStock">Out of Stock</option>
                      <option value="https://schema.org/PreOrder">Pre-Order</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Star Rating (1.0 - 5.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={product.ratingValue}
                      onChange={(e) => setProduct({ ...product, ratingValue: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Review Count</label>
                    <input
                      type="number"
                      min="0"
                      value={product.reviewCount}
                      onChange={(e) => setProduct({ ...product, reviewCount: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Product Image URL</label>
                  <input
                    type="url"
                    value={product.image}
                    onChange={(e) => setProduct({ ...product, image: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 4. HOWTO FORM */}
            {activeSchema === 'HowTo' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Guide Title *</label>
                  <input
                    type="text"
                    value={howTo.name}
                    onChange={(e) => setHowTo({ ...howTo, name: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Total Duration (ISO: PT30M)</label>
                    <input
                      type="text"
                      value={howTo.totalTime}
                      onChange={(e) => setHowTo({ ...howTo, totalTime: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Estimated Cost</label>
                    <input
                      type="text"
                      value={howTo.estimatedCost}
                      onChange={(e) => setHowTo({ ...howTo, estimatedCost: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">How-To Steps ({howTo.steps.length})</label>
                    <button
                      onClick={() => setHowTo({ ...howTo, steps: [...howTo.steps, { name: `Step ${howTo.steps.length + 1}`, text: '', image: '', url: '' }] })}
                      className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition"
                    >
                      + Add Step
                    </button>
                  </div>

                  {howTo.steps.map((st, idx) => (
                    <div key={idx} className="rounded-xl bg-zinc-950/80 p-3 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                        <span>Step #{idx + 1}</span>
                        {howTo.steps.length > 1 && (
                          <button
                            onClick={() => setHowTo({ ...howTo, steps: howTo.steps.filter((_, i) => i !== idx) })}
                            className="text-rose-400 hover:text-rose-300 text-[10px]"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={st.name}
                        onChange={(e) => {
                          const s = [...howTo.steps];
                          s[idx].name = e.target.value;
                          setHowTo({ ...howTo, steps: s });
                        }}
                        placeholder="Step name"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        value={st.text}
                        onChange={(e) => {
                          const s = [...howTo.steps];
                          s[idx].text = e.target.value;
                          setHowTo({ ...howTo, steps: s });
                        }}
                        placeholder="Step instructions"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. LOCAL BUSINESS FORM */}
            {activeSchema === 'LocalBusiness' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Business Name *</label>
                    <input
                      type="text"
                      value={localBiz.name}
                      onChange={(e) => setLocalBiz({ ...localBiz, name: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Business Category</label>
                    <select
                      value={localBiz.businessType}
                      onChange={(e) => setLocalBiz({ ...localBiz, businessType: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="LocalBusiness">General Local Business</option>
                      <option value="Restaurant">Restaurant / Bistro</option>
                      <option value="Store">Retail Store</option>
                      <option value="MedicalBusiness">Medical Clinic</option>
                      <option value="ProfessionalService">Professional Service</option>
                      <option value="AutoRepair">Automotive Repair</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Telephone Number</label>
                    <input
                      type="text"
                      value={localBiz.telephone}
                      onChange={(e) => setLocalBiz({ ...localBiz, telephone: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Price Range (e.g. $$, $$$)</label>
                    <input
                      type="text"
                      value={localBiz.priceRange}
                      onChange={(e) => setLocalBiz({ ...localBiz, priceRange: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Street Address *</label>
                  <input
                    type="text"
                    value={localBiz.streetAddress}
                    onChange={(e) => setLocalBiz({ ...localBiz, streetAddress: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">City *</label>
                    <input
                      type="text"
                      value={localBiz.addressLocality}
                      onChange={(e) => setLocalBiz({ ...localBiz, addressLocality: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">State / Region</label>
                    <input
                      type="text"
                      value={localBiz.addressRegion}
                      onChange={(e) => setLocalBiz({ ...localBiz, addressRegion: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Postal Code</label>
                    <input
                      type="text"
                      value={localBiz.postalCode}
                      onChange={(e) => setLocalBiz({ ...localBiz, postalCode: e.target.value })}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. RECIPE / EVENT / BREADCRUMB QUICK FORMS (Organized & Clean) */}
            {(activeSchema === 'Organization' || activeSchema === 'Recipe' || activeSchema === 'Event' || activeSchema === 'BreadcrumbList') && (
              <div className="space-y-4">
                {activeSchema === 'Organization' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Organization Name *</label>
                      <input
                        type="text"
                        value={org.name}
                        onChange={(e) => setOrg({ ...org, name: e.target.value })}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Official Website URL</label>
                      <input
                        type="url"
                        value={org.url}
                        onChange={(e) => setOrg({ ...org, url: e.target.value })}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Logo Image URL</label>
                      <input
                        type="url"
                        value={org.logo}
                        onChange={(e) => setOrg({ ...org, logo: e.target.value })}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {activeSchema === 'Recipe' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Recipe Name *</label>
                      <input
                        type="text"
                        value={recipe.name}
                        onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">Cook Time (PT5M)</label>
                        <input
                          type="text"
                          value={recipe.cookTime}
                          onChange={(e) => setRecipe({ ...recipe, cookTime: e.target.value })}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">Calories</label>
                        <input
                          type="text"
                          value={recipe.calories}
                          onChange={(e) => setRecipe({ ...recipe, calories: e.target.value })}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSchema === 'Event' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Event Name *</label>
                      <input
                        type="text"
                        value={eventData.name}
                        onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">Start Date (ISO)</label>
                        <input
                          type="text"
                          value={eventData.startDate}
                          onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">Location Name</label>
                        <input
                          type="text"
                          value={eventData.locationName}
                          onChange={(e) => setEventData({ ...eventData, locationName: e.target.value })}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSchema === 'BreadcrumbList' && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-300 block">Breadcrumb Path Nodes</label>
                    {breadcrumbs.map((b, idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                        <span className="text-xs font-bold text-amber-400">#{b.position}</span>
                        <input
                          type="text"
                          value={b.name}
                          onChange={(e) => {
                            const updated = [...breadcrumbs];
                            updated[idx].name = e.target.value;
                            setBreadcrumbs(updated);
                          }}
                          placeholder="Page Name"
                          className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                        />
                        <input
                          type="url"
                          value={b.item}
                          onChange={(e) => {
                            const updated = [...breadcrumbs];
                            updated[idx].item = e.target.value;
                            setBreadcrumbs(updated);
                          }}
                          placeholder="URL"
                          className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Validation Feedback Strip */}
            <div className="rounded-xl bg-zinc-950/90 border border-zinc-800 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center space-x-1.5 text-slate-300">
                  <ShieldCheck className={`h-4 w-4 ${hasErrors ? 'text-rose-400' : 'text-emerald-400'}`} />
                  <span>Google Schema Compliance Linter</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  hasErrors ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {hasErrors ? 'Action Required' : 'Valid Schema.org'}
                </span>
              </div>

              {validationIssues.length === 0 ? (
                <p className="text-[11px] text-emerald-400/90 flex items-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>All required & recommended properties present. Eligible for Google rich results.</span>
                </p>
              ) : (
                <div className="space-y-1 pt-1">
                  {validationIssues.map((v, i) => (
                    <div key={i} className="flex items-start space-x-1.5 text-[11px]">
                      {v.type === 'error' && <AlertTriangle className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />}
                      {v.type === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />}
                      {v.type === 'info' && <HelpCircle className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />}
                      <span className={v.type === 'error' ? 'text-rose-300' : v.type === 'warning' ? 'text-amber-300' : 'text-slate-400'}>
                        <strong>{v.property}:</strong> {v.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Live Google SERP Simulator & Export Studio */}
        <div className="lg:col-span-6 space-y-6">

          {/* Google SERP Visual Simulator Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Live Google Search Result Simulator
                </h3>
              </div>

              {/* Device Toggle */}
              <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded transition ${previewDevice === 'mobile' ? 'bg-zinc-800 text-blue-400' : 'text-slate-500 hover:text-white'}`}
                  title="Google Mobile View"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded transition ${previewDevice === 'desktop' ? 'bg-zinc-800 text-blue-400' : 'text-slate-500 hover:text-white'}`}
                  title="Google Desktop View"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Google Search Result Box Mockup */}
            <div className="rounded-xl border border-zinc-700/80 bg-[#202124] p-4 text-left shadow-inner space-y-2.5 font-sans">

              {/* URL & Breadcrumb Header */}
              <div className="flex items-center space-x-2 text-xs text-[#bdc1c6]">
                <div className="h-5 w-5 rounded-full bg-[#303134] flex items-center justify-center text-[10px] font-bold text-white">
                  G
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#e8eaed] font-medium leading-none">
                    {activeSchema === 'LocalBusiness' ? localBiz.name : activeSchema === 'Article' ? article.publisherName : 'example.com'}
                  </span>
                  <span className="text-[11px] text-[#9aa0a6] leading-tight">
                    https://example.com › {activeSchema.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* SERP Title */}
              <h4 className="text-[#8ab4f8] text-[16px] sm:text-[18px] font-normal hover:underline cursor-pointer leading-snug">
                {activeSchema === 'FAQPage' && 'Frequently Asked Questions & Expert Guide 2026'}
                {activeSchema === 'Article' && article.headline}
                {activeSchema === 'Product' && product.name}
                {activeSchema === 'HowTo' && howTo.name}
                {activeSchema === 'LocalBusiness' && `${localBiz.name} - ${localBiz.businessType} in ${localBiz.addressLocality}`}
                {activeSchema === 'Organization' && `${org.name} - Official Corporate Information`}
                {activeSchema === 'Recipe' && recipe.name}
                {activeSchema === 'Event' && eventData.name}
                {activeSchema === 'BreadcrumbList' && 'Top Developer Operations & Tools Catalog'}
              </h4>

              {/* RICH SNIPPET ENHANCEMENTS BY SCHEMA TYPE */}

              {/* Product: Star Rating & Price */}
              {activeSchema === 'Product' && (
                <div className="flex flex-wrap items-center gap-x-2 text-[12px] text-[#bdc1c6] pt-0.5">
                  <div className="flex items-center text-[#fbbc04]">
                    <Star className="h-3.5 w-3.5 fill-[#fbbc04]" />
                    <span className="ml-1 font-bold text-[#e8eaed]">{product.ratingValue}</span>
                  </div>
                  <span>({product.reviewCount})</span>
                  <span>·</span>
                  <span className="font-semibold text-[#e8eaed]">${product.price} {product.priceCurrency}</span>
                  <span>·</span>
                  <span className="text-[#81c995]">In stock</span>
                  <span>·</span>
                  <span>{product.brand}</span>
                </div>
              )}

              {/* Recipe: Calories, Cooking Time & Stars */}
              {activeSchema === 'Recipe' && (
                <div className="flex flex-wrap items-center gap-x-2 text-[12px] text-[#bdc1c6] pt-0.5">
                  <div className="flex items-center text-[#fbbc04]">
                    <Star className="h-3.5 w-3.5 fill-[#fbbc04]" />
                    <span className="ml-1 font-bold text-[#e8eaed]">{recipe.ratingValue}</span>
                  </div>
                  <span>({recipe.reviewCount})</span>
                  <span>·</span>
                  <span>{recipe.totalTime.replace('PT', '').toLowerCase()} total</span>
                  <span>·</span>
                  <span>{recipe.calories}</span>
                </div>
              )}

              {/* Local Business: Stars, Price Range, Location & Hours */}
              {activeSchema === 'LocalBusiness' && (
                <div className="flex flex-wrap items-center gap-x-2 text-[12px] text-[#bdc1c6] pt-0.5">
                  <div className="flex items-center text-[#fbbc04]">
                    <Star className="h-3.5 w-3.5 fill-[#fbbc04]" />
                    <span className="ml-1 font-bold text-[#e8eaed]">{localBiz.ratingValue}</span>
                  </div>
                  <span>({localBiz.reviewCount})</span>
                  <span>·</span>
                  <span>{localBiz.priceRange}</span>
                  <span>·</span>
                  <span>{localBiz.servesCuisine}</span>
                  <span>·</span>
                  <span className="text-[#81c995]">Open ⋅ Closes 11 PM</span>
                </div>
              )}

              {/* SERP Snippet Description */}
              <p className="text-[13px] text-[#bdc1c6] leading-relaxed line-clamp-2">
                {activeSchema === 'FAQPage' && 'Find instant answers to the most common questions regarding technical architecture, schema implementation, and structured data standards.'}
                {activeSchema === 'Article' && article.description}
                {activeSchema === 'Product' && product.description}
                {activeSchema === 'HowTo' && howTo.description}
                {activeSchema === 'LocalBusiness' && `${localBiz.streetAddress}, ${localBiz.addressLocality}, ${localBiz.addressRegion} ${localBiz.postalCode}. Call ${localBiz.telephone} for reservations.`}
                {activeSchema === 'Organization' && org.description}
                {activeSchema === 'Recipe' && recipe.description}
                {activeSchema === 'Event' && eventData.description}
                {activeSchema === 'BreadcrumbList' && 'Explore the complete hierarchical breadcrumb navigation directory.'}
              </p>

              {/* FAQ Accordion Rich Snippet Expansion in Google SERP */}
              {activeSchema === 'FAQPage' && faqs.length > 0 && (
                <div className="mt-3 border-t border-[#3c4043] pt-2 space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa0a6]">
                    People Also Ask (Rich Accordions)
                  </span>
                  {faqs.slice(0, 3).map((f, idx) => {
                    const isExpanded = expandedFaqIndex === idx;
                    return (
                      <div key={idx} className="border-b border-[#303134] pb-1.5">
                        <button
                          onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                          className="flex w-full items-center justify-between text-left text-[12px] font-medium text-[#8ab4f8] hover:underline"
                        >
                          <span>{f.question}</span>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-[#9aa0a6]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#9aa0a6]" />}
                        </button>
                        {isExpanded && (
                          <p className="mt-1 text-[11px] text-[#bdc1c6] leading-normal pl-1">
                            {f.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* How-To Step Badges */}
              {activeSchema === 'HowTo' && howTo.steps.length > 0 && (
                <div className="mt-2 border-t border-[#3c4043] pt-2 space-y-1">
                  <span className="text-[11px] font-semibold text-[#9aa0a6]">
                    Step-by-Step Preview ({howTo.totalTime.replace('PT', '').toLowerCase()})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {howTo.steps.slice(0, 2).map((st, idx) => (
                      <div key={idx} className="rounded bg-[#303134] p-1.5 text-[11px] text-[#e8eaed]">
                        <span className="font-bold text-[#8ab4f8]">Step {idx + 1}:</span> {st.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Generated Code Export Studio */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setOutputFormat('jsonld')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    outputFormat === 'jsonld' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JSON-LD (Google Preferred)
                </button>
                <button
                  onClick={() => setOutputFormat('microdata')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    outputFormat === 'microdata' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Microdata HTML
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center space-x-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-zinc-950 shadow-md hover:bg-amber-400 transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Script Tag'}</span>
                </button>
              </div>
            </div>

            {/* Code Output Box */}
            <div className="relative">
              <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-amber-300/90 overflow-x-auto max-h-[260px] scrollbar-thin">
                {outputFormat === 'jsonld' ? scriptTagCode : microdataCode}
              </pre>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
