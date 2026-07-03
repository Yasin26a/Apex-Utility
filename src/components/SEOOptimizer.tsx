import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  Sparkles, 
  Search, 
  HelpCircle, 
  Check, 
  Copy, 
  RotateCcw, 
  Share2, 
  Globe, 
  Twitter, 
  Facebook, 
  AlertTriangle, 
  ArrowRight, 
  Sliders, 
  Gauge, 
  BookOpen, 
  Cpu, 
  CheckCircle2,
  Bookmark,
  FileDown
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Helper to escape regex special characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/gi, '\\$&');
}

// English Syllable Counter algorithm
function countSyllablesInWord(word: string): number {
  let cleanedWord = word.toLowerCase().trim();
  cleanedWord = cleanedWord.replace(/[^a-z]/gi, ''); // non-letters removed
  
  if (cleanedWord.length <= 2) return 1;
  
  // Clean basic silent endings
  cleanedWord = cleanedWord.replace(/es$/g, '');
  cleanedWord = cleanedWord.replace(/ed$/g, '');
  
  // Trailing 'e' usually silent unless ending in 'le'
  if (cleanedWord.endsWith('e')) {
    if (cleanedWord.endsWith('le')) {
      // keep 'le' syllable
    } else {
      cleanedWord = cleanedWord.slice(0, -1);
    }
  }
  
  // Count consecutive vowel groups
  const vowelMatches = cleanedWord.match(/[aeiouy]+/g);
  let syllableCount = vowelMatches ? vowelMatches.length : 1;
  
  // Ensure we return at least 1 syllable for non-empty words
  return syllableCount > 0 ? syllableCount : 1;
}

export default function SEOOptimizer() {
  const { t, language } = useLanguage();
  
  // Core content state variables
  const [text, setText] = useState<string>(
    `# Crafting the Ultimate User Experience\n\nIn the modern age, building a successful website requires an intimate understanding of both human behavior and search engine algorithms. By prioritizing professional typography, elegant color palettes, and responsive layouts, you can captivate your target audience immediately.\n\nHistorically, digital planners stuffed articles full of repetitive, low-value phrases. Today, this strategy backfires dramatically because indexing spiders are highly intelligent. They utilize deep machine-learning models to judge whether content provides real utility. Outstanding, high-contrast visual hierarchies coupled with readable copy are paramount to rank effectively. Use precise, active sentences to convey maximum authority.`
  );
  
  const [focusKeyword, setFocusKeyword] = useState<string>('UX design');
  const [targetDensityMin, setTargetDensityMin] = useState<number>(1.5);
  const [targetDensityMax, setTargetDensityMax] = useState<number>(2.5);
  
  const [metaTitle, setMetaTitle] = useState<string>('UX Design and Styling Best Practices | Apex processing Labs');
  const [metaDescription, setMetaDescription] = useState<string>('Discover how to craft gorgeous responsive layouts and premium visual assets. Enhance search engine readability with SEO planning tools.');
  
  const [previewTab, setPreviewTab] = useState<'google' | 'twitter' | 'facebook'>('google');
  const [aiSuggestions, setAiSuggestions] = useState<{ keyword: string; rationale: string }[]>([]);
  
  // URL Slug States
  const [suggestedSlug, setSuggestedSlug] = useState<string>('ux-design-styling-best-practices');
  const [isGeneratingSlug, setIsGeneratingSlug] = useState<boolean>(false);
  const [isSlugManual, setIsSlugManual] = useState<boolean>(false);

  // Auto-generate a clean baseline slug offline whenever the title changes, unless manually modified
  useEffect(() => {
    if (!isSlugManual && metaTitle.trim()) {
      let local = metaTitle.trim().toLowerCase();
      local = local.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const stops = ['and', 'the', 'a', 'or', 'is', 'in', 'with', 'to', 'for', 'on', 'of', 'how-to', 'why', 'what', 'at', 'by', 'an', 'your', 'my'];
      const words = local.split(/[^a-z0-9]+/g).filter(w => w.length > 0 && !stops.includes(w));
      setSuggestedSlug(words.join('-') || 'page-slug');
    }
  }, [metaTitle, isSlugManual]);

  const generateSuggestedSlug = async () => {
    if (!metaTitle.trim()) return;
    setIsGeneratingSlug(true);
    try {
      const response = await fetch('/api/seo/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest_slug',
          title: metaTitle,
          targetKeyword: focusKeyword
        })
      });

      if (!response.ok) {
        throw new Error('Server error occurred inside Gemini.');
      }

      const data = await response.json();
      if (data.text) {
        try {
          const parsed = JSON.parse(data.text);
          if (parsed.slug) {
            setSuggestedSlug(parsed.slug);
            setIsSlugManual(true);
          } else {
            const clean = data.text.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
            setSuggestedSlug(clean);
            setIsSlugManual(true);
          }
        } catch {
          const fallbackSlug = data.text
            .trim()
            .replace(/["'{}]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
          setSuggestedSlug(fallbackSlug);
          setIsSlugManual(true);
        }
      }
    } catch (err) {
      console.error('Error generating slug:', err);
    } finally {
      setIsGeneratingSlug(false);
    }
  };
  
  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiOperationMsg, setAiOperationMsg] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [aiApiKeyMissing, setAiApiKeyMissing] = useState<boolean>(false);
  const [showDensityExplanation, setShowDensityExplanation] = useState<boolean>(false);

  // Core offline metrics analyzer
  const metrics = useMemo(() => {
    // Word list creation
    const words = text
      .replace(/[#*`_\[\]()]/g, ' ') // remove basic markdown syntax
      .split(/\s+/)
      .filter((w) => w.trim().length > 0);
      
    const wordCount = words.length;
    const charCount = text.length;
    
    // Sentence extraction (split by period, exclamation, question mark)
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
      
    const sentenceCount = sentences.length || 1;
    
    // Paragraph extraction
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const paragraphCount = paragraphs.length;

    // Syllable calculation
    let totalSyllables = 0;
    words.forEach((w) => {
      totalSyllables += countSyllablesInWord(w);
    });

    // Flesch Reading Ease Formula:
    // 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
    const averageSentenceLength = wordCount / sentenceCount;
    const averageSyllablesPerWord = totalSyllables / (wordCount || 1);
    
    let readingEaseScore = 100;
    if (wordCount > 0) {
      readingEaseScore = 206.835 - 1.015 * averageSentenceLength - 84.6 * averageSyllablesPerWord;
    }
    readingEaseScore = Math.min(Math.max(Math.round(readingEaseScore * 10) / 10, 0), 100);

    // Flesch-Kincaid Grade Level Formula:
    // 0.39 * (words / sentences) + 11.8 * (syllables / word) - 15.59
    let gradeLevel = 0;
    if (wordCount > 0) {
      gradeLevel = 0.39 * averageSentenceLength + 11.8 * averageSyllablesPerWord - 15.59;
    }
    const roundedGradeLevel = Math.max(Math.round(gradeLevel * 10) / 10, 1);

    // Readability interpretations
    let readabilityCategory = 'Standard';
    let readabilityClr = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    let readabilityProgressClr = 'bg-sky-500';
    if (readingEaseScore >= 90) {
      readabilityCategory = 'Very Easy (5th Grade)';
      readabilityClr = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      readabilityProgressClr = 'bg-emerald-500';
    } else if (readingEaseScore >= 80) {
      readabilityCategory = 'Easy (6th Grade)';
      readabilityClr = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      readabilityProgressClr = 'bg-emerald-500';
    } else if (readingEaseScore >= 70) {
      readabilityCategory = 'Fairly Easy (7th Grade)';
      readabilityClr = 'text-teal-400 bg-teal-500/10 border-teal-500/20';
      readabilityProgressClr = 'bg-teal-500';
    } else if (readingEaseScore >= 60) {
      readabilityCategory = 'Standard (8th-9th Grade)';
      readabilityClr = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      readabilityProgressClr = 'bg-sky-500';
    } else if (readingEaseScore >= 50) {
      readabilityCategory = 'Fairly Difficult (High School)';
      readabilityClr = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      readabilityProgressClr = 'bg-amber-500';
    } else if (readingEaseScore >= 30) {
      readabilityCategory = 'Difficult (College)';
      readabilityClr = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      readabilityProgressClr = 'bg-orange-500';
    } else {
      readabilityCategory = 'Very Academic (Graduate)';
      readabilityClr = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      readabilityProgressClr = 'bg-rose-500';
    }

    // Focus Keyword occurrences
    let keywordCount = 0;
    if (focusKeyword.trim().length > 0) {
      try {
        const escKeyword = escapeRegExp(focusKeyword.trim());
        const regex = new RegExp(`\\b${escKeyword}\\b`, 'gi');
        const matches = text.match(regex);
        keywordCount = matches ? matches.length : 0;
      } catch (err) {
        // Fallback simple search if regex compilation fails due to unique symbols
        let pos = text.toLowerCase().indexOf(focusKeyword.toLowerCase());
        while (pos !== -1) {
          keywordCount++;
          pos = text.toLowerCase().indexOf(focusKeyword.toLowerCase(), pos + focusKeyword.length);
        }
      }
    }

    const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
    const roundedDensity = Math.round(keywordDensity * 100) / 100;

    // Density diagnosis
    let densityStatus = 'Under-optimized';
    let densityClr = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    let densityProgressClr = 'bg-amber-500';
    if (keywordCount === 0) {
      densityStatus = 'Keyword Not Found';
      densityClr = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      densityProgressClr = 'bg-rose-500';
    } else if (roundedDensity < targetDensityMin) {
      densityStatus = 'Under-optimized (Increase occurrences)';
      densityClr = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      densityProgressClr = 'bg-amber-500';
    } else if (roundedDensity > targetDensityMax) {
      densityStatus = 'Keyword Stuffed (Decrease occurrences)';
      densityClr = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      densityProgressClr = 'bg-rose-500';
    } else {
      densityStatus = 'Optimized Perfect Density';
      densityClr = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      densityProgressClr = 'bg-emerald-500';
    }

    // Strategic copy layout check
    const checks: { label: string; pass: boolean; feedback: string }[] = [];
    
    // Check 1: Focus keyword in first paragraph
    const firstPara = paragraphs[0] || '';
    const hasInFirstPara = focusKeyword.trim().length > 0 && firstPara.toLowerCase().includes(focusKeyword.toLowerCase());
    checks.push({
      label: 'Keyword in First Paragraph',
      pass: hasInFirstPara,
      feedback: hasInFirstPara 
        ? 'Great! Your focus keyword is prominent in the opening paragraph.' 
        : 'Recommended: Mention the focus keyword within the first 100 words to hook search crawlers immediately.'
    });

    // Check 2: Single H1 check
    const h1Count = (text.match(/^#\s+.+/gm) || []).length;
    checks.push({
      label: 'Single H1 Heading Structuring',
      pass: h1Count === 1,
      feedback: h1Count === 1 
        ? 'Prisinte structuring: Exactly one main H1 heading (# Header) is active.' 
        : `Structural warning: Found ${h1Count} H1 headings. Standard index protocols require exactly 1 unique H1 heading per document.`
    });

    // Check 3: Focus keyword in H1
    const h1s = text.match(/^#\s+(.+)/m);
    const h1Text = h1s ? h1s[1] : '';
    const keywordInH1 = focusKeyword.trim().length > 0 && h1Text.toLowerCase().includes(focusKeyword.toLowerCase());
    checks.push({
      label: 'Focus Keyword in Title (H1)',
      pass: keywordInH1,
      feedback: keywordInH1
        ? 'Excellent! The page header H1 contains your focus query.'
        : 'Highly Recommended: Try editing your main title (H1) to feature the target search query.'
    });

    // Check 4: Minimal overall volume helper
    checks.push({
      label: 'Word Count Minimum',
      pass: wordCount >= 300,
      feedback: wordCount >= 300 
        ? `Sufficient volume: Your copy is ${wordCount} words long.`
        : 'Length alert: Search bots prioritize depth. Try writing at least 300 words (aim for 1,000+ for high-ranking resource pages).'
    });

    // Check 5: Sentence Length check
    const longSentences = sentences.filter((s) => s.split(/\s+/).length > 25);
    checks.push({
      label: 'Syntactic Readability Balance',
      pass: longSentences.length === 0,
      feedback: longSentences.length === 0
        ? 'Highly readable. No sentences exceed 25 words.'
        : `Found ${longSentences.length} overly long sentences. Shorten complex lists and clauses to aid reader comprehension.`
    });

    // Check 6: Passive voice matching
    // Look for matching elements like: is prepared, was generated, were optimized etc.
    const passiveVoiceRegex = /\b(is|am|are|was|were|be|been|being)\s+([a-z]+ed|built|done|written|optimized|crafted|compiled|made|chosen|stuffed|backfired)\b/gi;
    const passiveVoiceMatches = text.match(passiveVoiceRegex) || [];
    checks.push({
      label: 'Active Voice Allocation',
      pass: passiveVoiceMatches.length <= Math.max(2, sentenceCount * 0.15),
      feedback: passiveVoiceMatches.length <= Math.max(2, sentenceCount * 0.15)
        ? `Clean tone: Active voice matches are strong. (Only ${passiveVoiceMatches.length} passive indicator segments).`
        : `Tonal alert: Analyzed ${passiveVoiceMatches.length} instances of passive grammar construction. (e.g., "${passiveVoiceMatches.slice(0, 2).join('", "')}"). Rephrase to active sentences.`
    });

    const stopWords = new Set([
      'the', 'and', 'with', 'your', 'that', 'from', 'they', 'them', 'this', 'have',
      'this', 'here', 'there', 'what', 'where', 'when', 'some', 'were', 'been', 'about',
      'into', 'which', 'their', 'these', 'could', 'would', 'should', 'more', 'than',
      'will', 'your', 'about', 'most', 'such', 'also', 'because', 'both', 'each', 'very',
      'much', 'than', 'then', 'once', 'over', 'down', 'only', 'than', 'upon', 'into',
      'than', 'just', 'made', 'make', 'many', 'like', 'than', 'even', 'through', 'this',
      'with', 'about', 'some', 'more', 'most'
    ]);

    const baseWords = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !stopWords.has(w));

    const wordFreq: Record<string, number> = {};
    baseWords.forEach(w => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });

    const frequentKeywordsList = Object.entries(wordFreq)
      .map(([word, count]) => ({
        word,
        count,
        density: wordCount > 0 ? (count / wordCount) * 100 : 0
      }))
      .filter(item => item.word !== focusKeyword.toLowerCase())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const paragraphOccurrences = paragraphs.map((p, idx) => {
      const pWords = p.split(/\s+/).filter(w => w.trim().length > 0).length || 1;
      let pCount = 0;
      if (focusKeyword.trim().length > 0) {
        try {
          const escKeyword = escapeRegExp(focusKeyword.trim());
          const regex = new RegExp(`\\b${escKeyword}\\b`, 'gi');
          const matches = p.match(regex);
          pCount = matches ? matches.length : 0;
        } catch (err) {
          let pos = p.toLowerCase().indexOf(focusKeyword.toLowerCase());
          while (pos !== -1) {
            pCount++;
            pos = p.toLowerCase().indexOf(focusKeyword.toLowerCase(), pos + focusKeyword.length);
          }
        }
      }
      return {
        paragraphIndex: idx + 1,
        count: pCount,
        density: (pCount / pWords) * 100
      };
    });

    const paragraphsWithKeyword = paragraphOccurrences.filter(p => p.count > 0).length;
    const distributionScore = paragraphCount > 0 
      ? Math.round((paragraphsWithKeyword / paragraphCount) * 100)
      : 0;

    const densitySuggestions: { id: string; recommendation: string; type: 'success' | 'warning' | 'alert' }[] = [];

    // Check density
    if (keywordCount === 0) {
      densitySuggestions.push({
        id: 'missing',
        recommendation: `Your focus keyword "${focusKeyword}" is completely missing. Add it to your text to establish search relevance.`,
        type: 'alert'
      });
    } else if (roundedDensity < targetDensityMin) {
      const idealCountMin = Math.ceil((targetDensityMin / 100) * wordCount);
      const diff = idealCountMin - keywordCount;
      densitySuggestions.push({
        id: 'under',
        recommendation: `Keyword density (${roundedDensity}%) is below your target minimum of ${targetDensityMin}%. Try adding your focus keyword "${focusKeyword}" about ${diff} more time${diff > 1 ? 's' : ''} in critical sections.`,
        type: 'warning'
      });
    } else if (roundedDensity > targetDensityMax) {
      const idealCountMax = Math.floor((targetDensityMax / 100) * wordCount);
      const diff = keywordCount - idealCountMax;
      densitySuggestions.push({
        id: 'stuffed',
        recommendation: `Keyword density (${roundedDensity}%) is above your target maximum of ${targetDensityMax}%. This might be flagged as keyword stuffing. Remove approximately ${diff} instance${diff > 1 ? 's' : ''} or replace them with synonyms.`,
        type: 'alert'
      });
    } else {
      densitySuggestions.push({
        id: 'perfect',
        recommendation: `Optimized density: ${roundedDensity}% is within your target bounds. The keyword is naturally integrated.`,
        type: 'success'
      });
    }

    // Check distribution
    if (distributionScore < 50 && paragraphCount > 2) {
      densitySuggestions.push({
        id: 'dispersion',
        recommendation: `Poor distribution: The keyword occurs in only ${paragraphsWithKeyword} out of ${paragraphCount} paragraphs. Spread occurrences more evenly through the copy.`,
        type: 'warning'
      });
    } else if (distributionScore >= 70 && paragraphCount > 2) {
      densitySuggestions.push({
        id: 'dispersion-pass',
        recommendation: `Balanced distribution! Your focus keyword is spread evenly across ${paragraphsWithKeyword} of ${paragraphCount} paragraphs.`,
        type: 'success'
      });
    }

    // Check competitor
    const competitor = frequentKeywordsList[0];
    if (competitor && competitor.density > keywordDensity) {
      densitySuggestions.push({
        id: 'competitor',
        recommendation: `The word "${competitor.word}" has a higher density (${competitor.density.toFixed(1)}%) than your focus keyword (${roundedDensity}%). Ensure this does not dilute search relevance.`,
        type: 'warning'
      });
    }

    return {
      wordCount,
      charCount,
      sentenceCount,
      paragraphCount,
      readingEaseScore,
      roundedGradeLevel,
      readabilityCategory,
      readabilityClr,
      readabilityProgressClr,
      keywordCount,
      roundedDensity,
      densityStatus,
      densityClr,
      densityProgressClr,
      checks,
      frequentKeywordsList,
      paragraphOccurrences,
      distributionScore,
      densitySuggestions,
      paragraphsWithKeyword
    };
  }, [text, focusKeyword, targetDensityMin, targetDensityMax]);

  // Handle generic UI copying
  const copyToClipboard = (fieldText: string, id: string) => {
    navigator.clipboard.writeText(fieldText);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Triggers server-side Gemini analysis based on requested action
  const triggerAIAction = async (action: 'rewrite_keyword' | 'improve_readability' | 'autofill_meta' | 'suggest_keywords') => {
    setIsLoading(true);
    setAiApiKeyMissing(false);
    
    if (action === 'rewrite_keyword') {
      setAiOperationMsg('Rearranging copy syntax & seamlessly integrating emphasis parameters...');
    } else if (action === 'improve_readability') {
      setAiOperationMsg('Synthesizing vocabulary sequences for maximized Flesch reading marks...');
    } else if (action === 'autofill_meta') {
      setAiOperationMsg('Compiling click-optimized search title & meta narrative sequences...');
    } else {
      setAiOperationMsg('Extracting high-traffic search queries & semantic strategical notes...');
    }

    try {
      const response = await fetch('/api/seo/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text,
          targetKeyword: focusKeyword,
          targetDensity: (targetDensityMin + targetDensityMax) / 2
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error occurred inside Gemini.');
      }

      const data = await response.json();
      const returnedText = data.text;

      if (!returnedText) {
        throw new Error('Emply response returned from model.');
      }

      // Process outcomes based on action
      if (action === 'rewrite_keyword' || action === 'improve_readability') {
        setText(returnedText);
      } else if (action === 'autofill_meta') {
        try {
          // Parse JSON payload response cleanly
          let cleanDataString = returnedText.trim();
          if (cleanDataString.startsWith('```json')) {
            cleanDataString = cleanDataString.substring(7, cleanDataString.length - 3).trim();
          } else if (cleanDataString.startsWith('```')) {
            cleanDataString = cleanDataString.substring(3, cleanDataString.length - 3).trim();
          }
          const metaPayload = JSON.parse(cleanDataString);
          if (metaPayload.title) setMetaTitle(metaPayload.title);
          if (metaPayload.description) setMetaDescription(metaPayload.description);
        } catch (jsonErr) {
          // If structure parsing failed, use smart text segments splits as fail-safes
          console.warn('AI JSON parsing failure, applying raw fallback split', jsonErr);
          const lines = returnedText.split('\n').filter((l: string) => l.trim().length > 0);
          if (lines[0]) setMetaTitle(lines[0].replace(/^Title:\s*/i, '').replace(/["']/g, ''));
          if (lines[1]) setMetaDescription(lines[1].replace(/^Description:\s*/i, '').replace(/["']/g, ''));
        }
      } else if (action === 'suggest_keywords') {
        try {
          let cleanDataString = returnedText.trim();
          if (cleanDataString.startsWith('```json')) {
            cleanDataString = cleanDataString.substring(7, cleanDataString.length - 3).trim();
          } else if (cleanDataString.startsWith('```')) {
            cleanDataString = cleanDataString.substring(3, cleanDataString.length - 3).trim();
          }
          const keywordsArr = JSON.parse(cleanDataString);
          if (Array.isArray(keywordsArr)) {
            setAiSuggestions(keywordsArr);
          }
        } catch (jsonErr) {
          console.warn('Keywords parsing failure', jsonErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to query optimization assistant:', err);
      if (err.message?.includes('GEMINI_API_KEY')) {
        setAiApiKeyMissing(true);
      } else {
        alert(`Assistant Error: ${err.message || 'Check model parameters or dev keys.'}`);
      }
    } finally {
      setIsLoading(false);
      setAiOperationMsg('');
    }
  };

  const currentMetaTitleLengthStatus = useMemo(() => {
    const len = metaTitle.length;
    if (len === 0) return { label: 'Empty', clr: 'text-rose-400', progressClr: 'bg-rose-500', width: 0 };
    if (len < 45) return { label: 'Too Short (Aim for 50-60)', clr: 'text-amber-400', progressClr: 'bg-amber-500', width: (len / 60) * 100 };
    if (len > 60) return { label: 'Too Long (Truncation risk in search)', clr: 'text-rose-400', progressClr: 'bg-rose-500', width: 100 };
    return { label: 'Perfect Length', clr: 'text-emerald-400', progressClr: 'bg-emerald-500', width: (len / 60) * 100 };
  }, [metaTitle]);

  const currentMetaDescriptionLengthStatus = useMemo(() => {
    const len = metaDescription.length;
    if (len === 0) return { label: 'Empty', clr: 'text-rose-400', progressClr: 'bg-rose-500', width: 0 };
    if (len < 110) return { label: 'Too Short (Aim for 120-160)', clr: 'text-amber-400', progressClr: 'bg-amber-500', width: (len / 160) * 100 };
    if (len > 160) return { label: 'Too Long (Will be cut off on mobile)', clr: 'text-rose-400', progressClr: 'bg-rose-500', width: 100 };
    return { label: 'Perfect Length', clr: 'text-emerald-400', progressClr: 'bg-emerald-500', width: (len / 160) * 100 };
  }, [metaDescription]);

  // Downloadable structured HTML PDF report of all identified on-page optimization issues
  const generatePDFReport = () => {
    try {
      const doc = new jsPDF('p', 'pt', 'letter');
      const pageWidth = 612;
      const pageHeight = 792;
      const margin = 54;
      const maxW = pageWidth - margin * 2; // 504 pt
      
      let pageNum = 1;
      let y = margin;
      
      const drawHeaderAndFooter = () => {
        // Draw Running Header
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129); // Emerald-500
        doc.text("APEX MARKETING STUDIO  |  ON-PAGE SEO AUDIT REPORT", margin, 35);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(115, 115, 115);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, 35, { align: 'right' });
        
        doc.setLineWidth(0.75);
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.line(margin, 42, pageWidth - margin, 42);
        
        // Draw Running Footer
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 35, { align: 'center' });
        doc.text(`Target Keyword: "${focusKeyword}"`, margin, pageHeight - 35);
        doc.text("Confidential & Proprietary", pageWidth - margin, pageHeight - 35, { align: 'right' });
      };
      
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin - 35) {
          doc.addPage();
          pageNum++;
          y = 65; // Reset to page start (leaving space after running header line)
          drawHeaderAndFooter();
        }
      };

      // Draw initial page decoration
      drawHeaderAndFooter();
      y = 70;

      // Report Header Block
      doc.setFillColor(15, 23, 42); // bg slate-900 (deep dark background)
      doc.rect(margin, y, maxW, 55, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("ON-PAGE SEO OPTIMIZATION REPORT", margin + 15, y + 25);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(16, 185, 129); // emerald
      doc.text(`Automated Real-Time Audit Summary`, margin + 15, y + 42);
      
      y += 75;

      // Metadata/Summary Block Box
      checkPageBreak(85);
      doc.setFillColor(248, 250, 252); // grey-50
      doc.rect(margin, y, maxW, 75, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.rect(margin, y, maxW, 75, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text("AUDIT TARGET PARAMETERS", margin + 12, y + 18);

      // Grid stats: Focus keyword, Density targets, Word counts
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Focus Keyphrase:`, margin + 12, y + 36);
      doc.text(`Target Density Bounds:`, margin + 12, y + 48);
      doc.text(`Document Volume:`, margin + 12, y + 60);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`"${focusKeyword || 'None specified'}"`, margin + 125, y + 36);
      doc.text(`${targetDensityMin}% - ${targetDensityMax}%`, margin + 125, y + 48);
      doc.text(`${metrics.wordCount} Words / ${metrics.charCount} Characters`, margin + 125, y + 60);

      // Right column metrics
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Readability Index:`, margin + 290, y + 36);
      doc.text(`Measured Grade level:`, margin + 290, y + 48);
      doc.text(`Keyword Density:`, margin + 290, y + 60);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${metrics.readingEaseScore} (${metrics.readabilityCategory})`, margin + 395, y + 36);
      doc.text(`U.S. Grade ${metrics.roundedGradeLevel}`, margin + 395, y + 48);
      doc.text(`${metrics.roundedDensity}% (${metrics.keywordCount} matches)`, margin + 395, y + 60);

      y += 95;

      // Section 1: Detailed Checklist Audits
      checkPageBreak(50);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("ON-PAGE TECHNICAL CHECKLIST STATUS", margin, y);
      y += 6;
      doc.setLineWidth(1.5);
      doc.setDrawColor(16, 185, 129); // emerald divider
      doc.line(margin, y, margin + 210, y);
      y += 18;

      // Render Each Check item
      metrics.checks.forEach((item) => {
        // Evaluate comment lines wrapping dynamically
        const checkLabel = `${item.label}`;
        const checkFeedback = `${item.feedback}`;
        const feedbackLines = doc.splitTextToSize(checkFeedback, maxW - 75);
        const cellHeight = 28 + feedbackLines.length * 11;
        
        checkPageBreak(cellHeight);
        
        // draw tick or warning box
        doc.setFillColor(item.pass ? 240 : 254, item.pass ? 253 : 242, item.pass ? 250 : 242); // emerald-50 or rose-50 background
        doc.setDrawColor(item.pass ? 167 : 254, item.pass ? 243 : 202, item.pass ? 216 : 202); // emerald-200 or rose-200 brand border
        doc.rect(margin, y, maxW, cellHeight - 6, 'DF');

        // Draw status badge
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        if (item.pass) {
          doc.setFillColor(16, 185, 129); // emerald solid
          doc.rect(margin + 12, y + 10, 36, 13, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text("PASSED", margin + 17, y + 19.5);
        } else {
          doc.setFillColor(239, 68, 68); // rose/red solid
          doc.rect(margin + 12, y + 10, 36, 13, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text("ISSUE", margin + 20, y + 19.5);
        }

        // Title text next to status
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(checkLabel, margin + 58, y + 19);

        // Feedback narrative
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        feedbackLines.forEach((fl: string, flIdx: number) => {
          doc.text(fl, margin + 58, y + 33 + flIdx * 11);
        });

        y += cellHeight;
      });

      y += 15;

      // Section 2: Density and Distribution Audit Recommendations
      checkPageBreak(50);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("DENSITY & DISTRIBUTION AUDIT", margin, y);
      y += 6;
      doc.setLineWidth(1.5);
      doc.setDrawColor(16, 185, 129);
      doc.line(margin, y, margin + 185, y);
      y += 18;

      // Write recommendations 
      metrics.densitySuggestions.forEach((suggestion) => {
        const wrapList = doc.splitTextToSize(suggestion.recommendation, maxW - 20);
        const ruleHeight = wrapList.length * 11 + 14;
        checkPageBreak(ruleHeight);

        // Fill background based on severity
        if (suggestion.type === 'success') {
          doc.setFillColor(240, 253, 250); // Teal 50
          doc.setDrawColor(204, 251, 241);
        } else if (suggestion.type === 'warning') {
          doc.setFillColor(254, 253, 237); // Amber 50
          doc.setDrawColor(254, 243, 199);
        } else {
          doc.setFillColor(254, 242, 242); // Rose 50
          doc.setDrawColor(254, 226, 226);
        }
        doc.rect(margin, y, maxW, ruleHeight - 4, 'DF');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        if (suggestion.type === 'success') {
          doc.setTextColor(13, 148, 136); // Teal-600
          doc.text("[SUGGESTION PASSED]", margin + 10, y + 13);
        } else if (suggestion.type === 'warning') {
          doc.setTextColor(217, 119, 6); // Amber-600
          doc.text("[DIAGNOSTIC WARNING]", margin + 10, y + 13);
        } else {
          doc.setTextColor(220, 38, 38); // Red-600
          doc.text("[OPTIMIZATION ALERT]", margin + 10, y + 13);
        }

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        wrapList.forEach((line: string, lineIdx: number) => {
          doc.text(line, margin + 10, y + 24 + lineIdx * 11);
        });

        y += ruleHeight;
      });

      y += 15;

      // Section 3: Metadata audit summaries
      checkPageBreak(50);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("METADATA PREVIEW ANALYSIS", margin, y);
      y += 6;
      doc.setLineWidth(1.5);
      doc.setDrawColor(16, 185, 129);
      doc.line(margin, y, margin + 175, y);
      y += 18;

      // Evaluated SEO Title row
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text("Proposed SEO Title Preview (Title Tag):", margin, y);
      y += 13;
      
      const wrapTitle = doc.splitTextToSize(metaTitle || "No Title entered", maxW - 20);
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(5, 150, 105); // emerald green indication
      wrapTitle.forEach((line: string) => {
        doc.text(line, margin + 10, y);
        y += 11;
      });
      y += 4;
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Length: ${metaTitle.length} characters | Analysis: ${currentMetaTitleLengthStatus.label}`, margin, y);
      y += 18;

      // Evaluated SEO Description row
      checkPageBreak(65);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text("Proposed Meta Description Preview:", margin, y);
      y += 13;

      const wrapDesc = doc.splitTextToSize(metaDescription || "No Description entered", maxW - 20);
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      wrapDesc.forEach((line: string) => {
        doc.text(line, margin + 10, y);
        y += 11;
      });
      y += 4;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Length: ${metaDescription.length} characters | Analysis: ${currentMetaDescriptionLengthStatus.label}`, margin, y);
      y += 24;

      // Section 4: Secondary distribution of topics inside copy
      checkPageBreak(50);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("SECONDARY SEMANTIC TOPICS & DENSITY", margin, y);
      y += 6;
      doc.setLineWidth(1.5);
      doc.setDrawColor(16, 185, 129);
      doc.line(margin, y, margin + 250, y);
      y += 15;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Top secondary terms discovered in your copy (excluding stop words and target keyword):", margin, y);
      y += 15;

      // Frequency items loop table
      doc.setFillColor(241, 245, 249); // Header slate-100
      doc.rect(margin, y, maxW, 18, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("RANK & SEMANTIC TERM", margin + 10, y + 12);
      doc.text("OCCURRENCE COUNT", margin + 220, y + 12);
      doc.text("MEASURED DENSITY", margin + 380, y + 12);
      y += 18;

      metrics.frequentKeywordsList.forEach((item, idx) => {
        checkPageBreak(18);
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252); // Alt rows gray-50
        doc.rect(margin, y, maxW, 18, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(1);
        doc.line(margin, y + 18, margin + maxW, y + 18);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`#${idx + 1}  ${item.word}`, margin + 10, y + 12);
        doc.text(`${item.count} times`, margin + 220, y + 12);
        doc.text(`${item.density.toFixed(2)}%`, margin + 380, y + 12);
        y += 18;
      });

      // Saved Document download invocation
      doc.save(`seo_audit_${focusKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'document'}.pdf`);
    } catch (err: any) {
      console.error("PDF generation failure error", err);
      alert(`Could not compile audit PDF document: ${err.message || err}`);
    }
  };

  return (
    <div id="seo-optimizer-dashboard" className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-brand-border/30">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-lg shadow-emerald-500/5">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-400 tracking-widest block uppercase">Apex Marketing Studio</span>
              <h1 className="text-3xl font-sans font-medium tracking-tight text-white mb-1">{t.navigation.seoOptimizer}</h1>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            {t.navigation.seoOptimizerDesc}
          </p>
        </div>
        
        {/* Actions Button Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            id="btn-download-pdf-report"
            onClick={generatePDFReport}
            className="flex items-center gap-2 px-4 py-2 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-xs text-emerald-400 hover:text-white transition duration-200 font-mono tracking-wider shadow-lg shadow-emerald-500/5 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 animate-bounce" />
            DOWNLOAD AUDIT REPORT (PDF)
          </button>

          {/* Reset / Standard defaults */}
          <button 
            id="btn-reset-seo"
            onClick={() => {
              setText(`# Crafting the Ultimate User Experience\n\nIn the modern age, building a successful website requires an intimate understanding of both human behavior and search engine algorithms. By prioritizing professional typography, elegant color palettes, and responsive layouts, you can captivate your target audience immediately.\n\nHistorically, digital planners stuffed articles full of repetitive, low-value phrases. Today, this strategy backfires dramatically because indexing spiders are highly intelligent. They utilize deep machine-learning models to judge whether content provides real utility. Outstanding, high-contrast visual hierarchies coupled with readable copy are paramount to rank effectively. Use precise, active sentences to convey maximum authority.`);
              setFocusKeyword('UX design');
              setMetaTitle('UX Design and Styling Best Practices | Apex processing Labs');
              setMetaDescription('Discover how to craft gorgeous responsive layouts and premium visual assets. Enhance search engine readability with SEO planning tools.');
              setAiSuggestions([]);
              setAiApiKeyMissing(false);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-brand-border/40 hover:border-brand-border/80 bg-brand-surface/40 hover:bg-brand-surface/80 rounded-xl text-xs text-gray-400 hover:text-white transition duration-200 font-mono tracking-wider cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {(() => {
              const m: Record<string, string> = {
                en: 'RESTORE TEMPLATE',
                es: 'RESTAURAR PLANTILLA',
                fr: 'RESTAURER LE MODÈLE',
                de: 'VORLAGE WIEDERHERSTELLEN',
                pt: 'RESTAURAR MODELO'
              };
              return m[language] || m.en;
            })()}
          </button>
        </div>
      </div>

      {/* AI Key Missing Safety Banner */}
      {aiApiKeyMissing && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border border-rose-500/30 bg-rose-500/5 rounded-xl text-rose-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              <strong>GEMINI_API_KEY Required:</strong> This AI feature is handled server-side. To enable intelligent rewrites and auto-meta tagging, please configure key parameters in <strong>Settings (Secrets menu)</strong>.
            </p>
          </div>
          <button 
            onClick={() => setAiApiKeyMissing(false)}
            className="text-xs underline hover:text-white font-mono uppercase tracking-wider"
          >
            DISMISS
          </button>
        </motion.div>
      )}

      {/* Main Structural Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Input Editor & Focus parameters (7 Cols) */}
        <div id="col-editor-pane" className="xl:col-span-7 space-y-6 animate-fadeIn">
          <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Focus keyword header settings */}
            <div className="p-4 sm:p-5 border-b border-brand-border/30 bg-brand-surface/20 space-y-4">
              <h2 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Target Keywords Configuration
              </h2>
              
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="input-focus-kw" className="text-xs font-mono text-gray-400 block mb-1.5 uppercase">Focus Keyphrase</label>
                  <div className="relative">
                    <input 
                      id="input-focus-kw"
                      type="text"
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="e.g. UX design"
                      className="w-full bg-[#0a0b0e] border border-brand-border/50 focus:border-emerald-500/50 rounded-xl px-4 py-3 md:py-2.5 text-base md:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40 pl-10 min-h-[44px] md:min-h-[38px] transition-all"
                    />
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-[14px] md:top-3.5" />
                  </div>
                </div>
                
                <div className="w-full lg:w-[240px] shrink-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-mono text-gray-400 uppercase">Target Density Bounds</label>
                    <button 
                      onClick={() => setShowDensityExplanation(!showDensityExplanation)}
                      className="text-gray-500 hover:text-emerald-400 p-1"
                      title="Learn about Keyword Density"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {/* Stacked visually and optimized for great tap indexes */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">Min %</span>
                      <input 
                        id="num-density-min"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={targetDensityMin}
                        onChange={(e) => setTargetDensityMin(parseFloat(e.target.value) || 0.1)}
                        className="w-full bg-[#0a0b0e] border border-brand-border/50 focus:border-emerald-500/50 rounded-xl px-3 py-3 md:py-2.5 text-center text-base md:text-sm text-white focus:outline-none min-h-[44px] md:min-h-[38px] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">Max %</span>
                      <input 
                        id="num-density-max"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={targetDensityMax}
                        onChange={(e) => setTargetDensityMax(parseFloat(e.target.value) || 10)}
                        className="w-full bg-[#0a0b0e] border border-brand-border/50 focus:border-emerald-500/50 rounded-xl px-3 py-3 md:py-2.5 text-center text-base md:text-sm text-white focus:outline-none min-h-[44px] md:min-h-[38px] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showDensityExplanation && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 bg-brand-surface/40 border border-brand-border/10 rounded-xl text-xs text-gray-400 space-y-1.5 overflow-hidden"
                  >
                    <p className="font-medium text-emerald-400">What is Keyword Density?</p>
                    <p>It measures how often a query is found compared to overall text. Natural range sits between **1.5% and 2.5%**. Higher looks spammy, and lower fails semantic search triggers.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Markdown editor frame */}
            <div className="relative">
              <label htmlFor="tx-seo-editor" className="sr-only">SEO Copy Editor</label>
              <textarea 
                id="tx-seo-editor"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter or paste your markdown copywriting source code here..."
                rows={16}
                className="w-full bg-transparent p-4 sm:p-6 text-base md:text-sm text-gray-300 focus:outline-none focus:ring-0 leading-relaxed font-mono resize-y border-0 min-h-[420px]"
              />
              
              {/* Dynamic loading HUD overlay */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#08090d]/90 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-20"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-20 h-20 border-t-2 border-emerald-500/40 rounded-full animate-spin"></div>
                      <div className="absolute w-14 h-14 border-r-2 border-emerald-400/80 rounded-full animate-spin [animation-duration:1.2s]"></div>
                      <Cpu className="w-6 h-6 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-center space-y-1.5 px-6 max-w-sm">
                      <p className="text-sm font-medium text-white tracking-wide">Refining via Gemini AI</p>
                      <p className="text-xs text-gray-400 font-mono leading-relaxed">{aiOperationMsg}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Editor footer metrics summary info line */}
            <div className="p-4 bg-brand-surface/30 border-t border-brand-border/30 grid grid-cols-4 gap-2 text-center text-xs font-mono divide-x divide-brand-border/20">
              <div>
                <span className="text-gray-500 block uppercase scale-90">Words</span>
                <span className="text-sm text-white font-medium">{metrics.wordCount}</span>
              </div>
              <div>
                <span className="text-gray-500 block uppercase scale-90">Characters</span>
                <span className="text-sm text-white font-medium">{metrics.charCount}</span>
              </div>
              <div>
                <span className="text-gray-500 block uppercase scale-90">Sentences</span>
                <span className="text-sm text-white font-medium">{metrics.sentenceCount}</span>
              </div>
              <div>
                <span className="text-gray-500 block uppercase scale-90">Paragraphs</span>
                <span className="text-sm text-white font-medium">{metrics.paragraphCount}</span>
              </div>
            </div>
          </div>

          {/* AI Assistance Enhancement Drawer Toolbar */}
          <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              Gemini Pro SEO Copilot
            </h3>
            
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3.5">
              <button 
                id="btn-ai-rewrite-kw"
                onClick={() => triggerAIAction('rewrite_keyword')}
                disabled={isLoading}
                className="flex items-center justify-between p-4 md:p-3 border border-brand-border/60 hover:border-emerald-500/40 bg-brand-surface/40 hover:bg-emerald-500/[0.03] rounded-xl text-left group transition duration-205 min-h-[50px] cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-sm md:text-xs font-medium text-white group-hover:text-emerald-400 transition">Keyword Optimization</span>
                  <span className="text-[11px] text-gray-500 block leading-tight">Integrates "{focusKeyword}" at healthy densities</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all shrink-0 ml-2" />
              </button>

              <button 
                id="btn-ai-readability"
                onClick={() => triggerAIAction('improve_readability')}
                disabled={isLoading}
                className="flex items-center justify-between p-4 md:p-3 border border-brand-border/60 hover:border-emerald-500/40 bg-brand-surface/40 hover:bg-emerald-500/[0.03] rounded-xl text-left group transition duration-205 min-h-[50px] cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-sm md:text-xs font-medium text-white group-hover:text-emerald-400 transition">Readability Boost</span>
                  <span className="text-[11px] text-gray-500 block leading-tight">Simplifies phrasing & metrics naturally</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all shrink-0 ml-2" />
              </button>

              <button 
                id="btn-ai-autofill-meta"
                onClick={() => triggerAIAction('autofill_meta')}
                disabled={isLoading}
                className="flex items-center justify-between p-4 md:p-3 border border-brand-border/60 hover:border-emerald-500/40 bg-brand-surface/40 hover:bg-emerald-500/[0.03] rounded-xl text-left group transition duration-205 min-h-[50px] cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-sm md:text-xs font-medium text-white group-hover:text-emerald-400 transition">Draft Metadata Snippets</span>
                  <span className="text-[11px] text-gray-500 block leading-tight">Generates Title & Meta Description via AI</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all shrink-0 ml-2" />
              </button>

              <button 
                id="btn-ai-keyword-ideas"
                onClick={() => triggerAIAction('suggest_keywords')}
                disabled={isLoading}
                className="flex items-center justify-between p-4 md:p-3 border border-brand-border/60 hover:border-emerald-500/40 bg-brand-surface/40 hover:bg-emerald-500/[0.03] rounded-xl text-left group transition duration-205 min-h-[50px] cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-sm md:text-xs font-medium text-white group-hover:text-emerald-400 transition">Extract Search Topics</span>
                  <span className="text-[11px] text-gray-500 block leading-tight">Extracts 5 key themes with strategies</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all shrink-0 ml-2" />
              </button>
            </div>
            
            {/* Suggested keywords array results */}
            <AnimatePresence>
              {aiSuggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 border border-emerald-500/20 bg-emerald-500/[0.01] rounded-xl space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-emerald-400">Semantic Keyword Analysis Results</span>
                    <button 
                      onClick={() => setAiSuggestions([])}
                      className="text-[10px] uppercase font-mono text-gray-500 hover:text-white"
                    >
                      Clear suggestions
                    </button>
                  </div>
                  <div className="space-y-2">
                    {aiSuggestions.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setFocusKeyword(item.keyword)}
                        className="p-2.5 bg-brand-surface/50 border border-brand-border/30 rounded-lg hover:border-emerald-500/30 cursor-pointer group flex items-start justify-between gap-3 transition"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono text-white group-hover:text-emerald-400 font-bold transition">#{idx + 1} {item.keyword}</span>
                          <span className="text-[11px] text-gray-400 block leading-normal">{item.rationale}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono uppercase shrink-0 pt-0.5 group-hover:text-white transition">Quick Focus</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Real-time Analytics Scoreboards (5 Cols) */}
        <div id="col-analytics-pane" className="xl:col-span-5 space-y-6">
          
          {/* Readability & Density Cards Grid Stacked Vertically */}
          <div className="flex flex-col gap-6">
            
            {/* Flesch-Kincaid index metric cards */}
            <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center gap-2">
                <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  SEO Copy Readability
                </h3>
                <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 shrink-0 ${metrics.readabilityClr}`}>
                  {metrics.readabilityCategory}
                </span>
              </div>
              
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl font-sans font-medium text-white">{metrics.readingEaseScore}</span>
                <span className="text-xs text-gray-500 font-mono">/ 100 Ease Index</span>
              </div>

              {/* Progress visual bar */}
              <div className="space-y-1.5">
                <div className="h-2 bg-[#090a0d] border border-brand-border/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.readingEaseScore}%` }}
                    className={`h-full ${metrics.readabilityProgressClr}`}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-gray-500">
                  <span>Difficult (0)</span>
                  <span>Standard (60)</span>
                  <span>Easy (100)</span>
                </div>
              </div>

              {/* Grade Level Diagnostic details */}
              <div className="p-3.5 bg-brand-surface/40 hover:bg-brand-surface/70 border border-brand-border/50 rounded-xl flex items-center justify-between text-xs leading-none transition duration-150 min-h-[44px]">
                <span className="text-gray-400 font-mono uppercase">Calculated Grade Level</span>
                <span className="text-white font-mono font-medium">U.S. Grade {metrics.roundedGradeLevel}</span>
              </div>
            </div>

            {/* Keyword Density index metric cards */}
            <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center gap-2">
                <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  Keyword Density Gauge
                </h3>
                <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 shrink-0 ${metrics.densityClr}`}>
                  {metrics.roundedDensity}% Focus
                </span>
              </div>

              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl font-sans font-medium text-white">{metrics.keywordCount}</span>
                <span className="text-xs text-gray-500 font-mono">occurrences of "{focusKeyword || '...'}"</span>
              </div>

              {/* Slider representation highlighting target bounds */}
              <div className="space-y-1.5">
                <div className="relative h-2 bg-[#090a0d] border border-brand-border/30 rounded-full">
                  
                  {/* Ideal Range marker box overlay */}
                  <div 
                    className="absolute top-0 h-full bg-emerald-500/20 border-x border-emerald-500/40"
                    style={{ 
                      left: `${targetDensityMin * 10}%`, 
                      width: `${(targetDensityMax - targetDensityMin) * 10}%` 
                    }}
                  />
                  
                  {/* Current Density indicator dot */}
                  <motion.div 
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-brand-surface rounded-full shadow-lg"
                    animate={{ left: `${Math.min(metrics.roundedDensity * 10, 100)}%` }}
                    transition={{ type: 'spring', damping: 15 }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-gray-500">
                  <span>0%</span>
                  <span className="text-emerald-500/90 font-medium">Ideal Target Bounds ({targetDensityMin.toFixed(1)}% - {targetDensityMax.toFixed(1)}%)</span>
                  <span>10%</span>
                </div>
              </div>

              <div className="p-3 bg-brand-surface/40 border border-brand-border/50 rounded-xl text-xs text-gray-400 italic">
                Status check: {metrics.densityStatus}
              </div>

              {/* Enhanced Content & Keyword Density Relevance Analyzer */}
              <div className="space-y-4 pt-3 border-t border-brand-border/20">
                
                {/* 1. Keyword Dispersion map */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Keyword Dispersion Map</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{metrics.distributionScore}% Distribution</span>
                  </div>
                  
                  {metrics.paragraphCount > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                      {metrics.paragraphOccurrences.map((p, pIdx) => (
                        <div 
                          key={pIdx}
                          className={`p-3 sm:p-2.5 rounded-xl border text-center font-mono transition-all duration-150 flex flex-col justify-center items-center min-h-[48px] ${
                            p.count > 0 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-500/5' 
                              : 'bg-zinc-950/40 border-brand-border/10 text-zinc-500'
                          }`}
                        >
                          <span className="text-[10px] block font-bold">P{p.paragraphIndex}</span>
                          <span className={`text-[9px] block leading-none mt-1 font-bold ${p.count > 0 ? 'text-emerald-400' : 'text-zinc-650'}`}>{p.count}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-zinc-950/20 border border-dashed border-brand-border/10 rounded-xl">
                      <span className="text-xs text-zinc-650 font-mono">No paragraphs detected.</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 leading-none">
                    <span>Coverage: {metrics.paragraphsWithKeyword} of {metrics.paragraphCount} paragraphs</span>
                    <span>Goal: Spread evenly</span>
                  </div>
                </div>

                {/* 2. Brand new supporting LSI metrics */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">LSI Term Density & Competition</span>
                    <span className="text-[9px] font-mono text-zinc-500">Excluding stop-words</span>
                  </div>

                  <div className="space-y-2">
                    {metrics.frequentKeywordsList.length > 0 ? (
                      metrics.frequentKeywordsList.map((item, fIdx) => {
                        const isDiluter = item.density > metrics.roundedDensity;
                        return (
                          <div 
                            key={fIdx} 
                            className="p-2.5 rounded-xl bg-[#08090b] border border-brand-border/20 flex items-center justify-between transition-all duration-150 hover:border-brand-border/40 min-h-[44px]"
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-mono text-zinc-200 block font-medium">#{fIdx + 1} {item.word}</span>
                              <span className="text-[10px] text-zinc-500 font-mono block uppercase">{item.count} occurrences</span>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-mono font-extrabold block ${isDiluter ? 'text-amber-400 font-extrabold' : 'text-zinc-400'}`}>
                                {item.density.toFixed(1)}%
                              </span>
                              <span className="text-[8px] font-mono text-zinc-500 block">DENSITY</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 bg-zinc-950/20 border border-brand-border/10 rounded-xl">
                        <span className="text-xs text-zinc-500 font-mono">Write copy above to parse keyword suggestions...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Actionable Relevance & Density suggestions */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Organic Relevance Advice</span>
                  
                  <div className="space-y-2">
                    {metrics.densitySuggestions.map((sug, sIdx) => {
                      let tagClr = 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5';
                      let labelSymbol = '✓';
                      
                      if (sug.type === 'alert') {
                        tagClr = 'border-rose-500/20 text-rose-400 bg-rose-500/5';
                        labelSymbol = '⚠';
                      } else if (sug.type === 'warning') {
                        tagClr = 'border-amber-500/20 text-amber-400 bg-amber-500/5';
                        labelSymbol = '!';
                      }

                      return (
                        <div 
                          key={sIdx} 
                          className={`p-3 border rounded-xl flex items-start gap-2.5 transition-all duration-150 leading-relaxed text-left text-xs ${tagClr}`}
                        >
                          <span className="font-mono text-xs font-bold leading-none select-none px-1 pt-0.5">{labelSymbol}</span>
                          <span className="leading-snug text-zinc-300">{sug.recommendation}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Social Snippets & Search Engine Previews (SERPs) */}
          <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-400" />
              Real-time Metadata Previews
            </h3>

            {/* Custom Inputs for Metadata */}
            <div className="space-y-4 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="input-meta-title" className="text-xs font-mono text-gray-400 uppercase">SEO Title</label>
                  <span className={`text-[10px] font-mono ${currentMetaTitleLengthStatus.clr}`}>
                    {metaTitle.length} chars | {currentMetaTitleLengthStatus.label}
                  </span>
                </div>
                <input 
                  id="input-meta-title"
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Draft an index title tag..."
                  className="w-full bg-[#0a0b0e] border border-brand-border/50 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 md:py-2.5 text-base md:text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40 min-h-[44px] md:min-h-[38px] transition-all"
                />
                <div className="h-1 bg-[#090a0d] rounded-full overflow-hidden mt-2.5 bg-brand-surface">
                  <div className={`h-full ${currentMetaTitleLengthStatus.progressClr}`} style={{ width: `${currentMetaTitleLengthStatus.width}%` }} />
                </div>
              </div>

              {/* AI-Powered Suggested URL Slug */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="input-suggested-slug" className="text-xs font-mono text-gray-400 uppercase">Suggested URL Slug</label>
                    <span className="bg-[#10b981]/10 text-[#34d399] text-[9px] px-1.5 py-0.5 rounded-full font-mono border border-[#10b981]/20 uppercase tracking-wider font-extrabold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" /> AI Powered
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    {suggestedSlug.length} chars
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs select-none">/</span>
                    <input 
                      id="input-suggested-slug"
                      type="text"
                      value={suggestedSlug}
                      onChange={(e) => {
                        const cleanVal = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9-_]/g, '');
                        setSuggestedSlug(cleanVal);
                        setIsSlugManual(true);
                      }}
                      placeholder="generating-optimized-slug..."
                      className="w-full bg-[#0a0b0e] border border-brand-border/50 focus:border-emerald-500/50 rounded-xl pl-6 pr-3.5 py-3 md:py-2.5 text-base md:text-sm text-emerald-400 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/40 min-h-[44px] md:min-h-[38px] transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateSuggestedSlug}
                    disabled={isGeneratingSlug || !metaTitle.trim()}
                    className="bg-[#111217] hover:bg-[#181920] border border-brand-border/50 hover:border-emerald-500/30 text-zinc-300 hover:text-emerald-400 px-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs font-mono font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Optimize slug with Gemini AI"
                  >
                    {isGeneratingSlug ? (
                      <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="hidden sm:inline">AI Optimize</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(suggestedSlug);
                      setCopiedField('slug');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="bg-[#111217] hover:bg-[#181920] border border-brand-border/50 text-zinc-300 hover:text-emerald-400 p-2.5 sm:px-3.5 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                    title="Copy Slug"
                  >
                    {copiedField === 'slug' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono mt-1.5 leading-relaxed">
                  Hyphenated, keyword-optimized path. Perfect for search indexing crawlers.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="input-meta-desc" className="text-xs font-mono text-gray-400 uppercase">Meta Description</label>
                  <span className={`text-[10px] font-mono ${currentMetaDescriptionLengthStatus.clr}`}>
                    {metaDescription.length} chars | {currentMetaDescriptionLengthStatus.label}
                  </span>
                </div>
                <textarea 
                  id="input-meta-desc"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Draft meta description for better SEO index conversions..."
                  rows={3}
                  className="w-full bg-[#0a0b0e] border border-brand-border/50 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 md:py-2.5 text-base md:text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 min-h-[80px] transition-all"
                />
                <div className="h-1 bg-[#090a0d] rounded-full overflow-hidden mt-2.5 bg-brand-surface">
                  <div className={`h-full ${currentMetaDescriptionLengthStatus.progressClr}`} style={{ width: `${currentMetaDescriptionLengthStatus.width}%` }} />
                </div>
              </div>
            </div>

            {/* Selector bar for Google, Twitter Card, Facebook */}
            <div className="flex flex-col sm:flex-row border-b border-brand-border/30 pt-2 gap-1 sm:gap-0">
              <button 
                id="tab-prev-google"
                onClick={() => setPreviewTab('google')}
                className={`flex-1 py-3 text-center text-xs font-mono tracking-wider sm:border-b-2 border-r sm:border-r-0 border-brand-border/10 sm:border-transparent flex items-center justify-center gap-2.5 uppercase transition-all min-h-[44px] cursor-pointer rounded-t-lg sm:rounded-none ${
                  previewTab === 'google' 
                    ? 'sm:border-emerald-500 text-white font-medium bg-emerald-500/10 sm:bg-emerald-500/[0.02] border border-emerald-500/20 sm:border-0' 
                    : 'text-gray-400 hover:text-gray-250 hover:bg-zinc-950/20'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Google SERP
              </button>
              <button 
                id="tab-prev-twitter"
                onClick={() => setPreviewTab('twitter')}
                className={`flex-1 py-3 text-center text-xs font-mono tracking-wider sm:border-b-2 border-r sm:border-r-0 border-brand-border/10 sm:border-transparent flex items-center justify-center gap-2.5 uppercase transition-all min-h-[44px] cursor-pointer rounded-t-lg sm:rounded-none ${
                  previewTab === 'twitter' 
                    ? 'sm:border-emerald-500 text-white font-medium bg-emerald-500/10 sm:bg-emerald-500/[0.02] border border-emerald-500/20 sm:border-0' 
                    : 'text-gray-400 hover:text-gray-250 hover:bg-zinc-950/20'
                }`}
              >
                <Twitter className="w-3.5 h-3.5" />
                Twitter card
              </button>
              <button 
                id="tab-prev-facebook"
                onClick={() => setPreviewTab('facebook')}
                className={`flex-1 py-3 text-center text-xs font-mono tracking-wider sm:border-b-2 sm:border-transparent flex items-center justify-center gap-2.5 uppercase transition-all min-h-[44px] cursor-pointer rounded-t-lg sm:rounded-none ${
                  previewTab === 'facebook' 
                    ? 'sm:border-emerald-500 text-white font-medium bg-emerald-500/10 sm:bg-emerald-500/[0.02] border border-emerald-500/20 sm:border-0' 
                    : 'text-gray-400 hover:text-gray-250 hover:bg-zinc-950/20'
                }`}
              >
                <Facebook className="w-3.5 h-3.5" />
                Facebook Share
              </button>
            </div>

            {/* Previews Frame */}
            <div className="p-4 bg-[#08090b] border border-brand-border/20 rounded-xl">
              <AnimatePresence mode="wait">
                {previewTab === 'google' && (
                  <motion.div 
                    key="google"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded-full bg-zinc-800 text-[10px] text-gray-400 flex items-center justify-center font-mono">A</div>
                      <span className="text-gray-400 font-sans">https://apexutility.live &gt; post</span>
                    </div>
                    <div>
                      <h4 className="text-blue-500 hover:underline text-lg font-medium cursor-pointer break-words leading-snug">
                        {metaTitle || 'Please enter an SEO title...'}
                      </h4>
                    </div>
                    <p className="text-sm text-zinc-400 leading-normal break-words">
                      {metaDescription || 'Please enter an SEO meta description...'}
                    </p>
                  </motion.div>
                )}

                {previewTab === 'twitter' && (
                  <motion.div 
                    key="twitter"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border border-zinc-800 rounded-xl overflow-hidden bg-[#15181c]"
                  >
                    {/* Fake post graphic placeholder card banner */}
                    <div className="aspect-[1.91/1] bg-gradient-to-r from-emerald-950 to-zinc-900 border-b border-zinc-800 flex flex-col justify-center items-center p-6 text-center relative select-none">
                      <Bookmark className="w-6 h-6 text-emerald-400 absolute top-4 left-4 opacity-55" />
                      <div className="text-xs font-mono text-emerald-400/90 tracking-widest uppercase mb-1">Apex Publishing</div>
                      <div className="text-base text-white/95 font-sans font-bold leading-tight max-w-sm line-clamp-2">{metaTitle || 'Aesthetic Resource Landing Page'}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-3">https://apexutility.live | 100% Secure</div>
                    </div>
                    
                    <div className="p-3 text-sm space-y-1">
                      <span className="text-xs text-zinc-500 font-mono">apexutility.live</span>
                      <h4 className="text-white font-medium line-clamp-1 leading-none">{metaTitle || 'Visual Resource Post'}</h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-normal">{metaDescription || 'Aesthetic article landing resource notes.'}</p>
                    </div>
                  </motion.div>
                )}

                {previewTab === 'facebook' && (
                  <motion.div 
                    key="facebook"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border border-zinc-800 bg-[#242526] overflow-hidden"
                  >
                    {/* Fake facebook image banner card */}
                    <div className="aspect-[1.91/1] bg-gradient-to-r from-zinc-900 to-indigo-950 border-b border-zinc-800 flex flex-col justify-center items-center p-6 text-center relative select-none">
                      <div className="text-xs font-mono text-indigo-400/90 tracking-widest uppercase mb-1">Interactive Framework Labs</div>
                      <div className="text-base text-white/95 font-sans font-extrabold leading-tight max-w-sm line-clamp-2">{metaTitle || 'High Performance Utilities'}</div>
                    </div>

                    <div className="p-3 bg-zinc-900 border-t border-zinc-800 space-y-0.5">
                      <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider block">APEXLABS.IO</span>
                      <h4 className="text-white text-sm font-medium line-clamp-1 leading-snug">{metaTitle}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{metaDescription}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Copy All Meta Data action button toolbar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button 
                id="btn-copy-meta-title"
                onClick={() => copyToClipboard(metaTitle, 'title')}
                className="flex-1 py-3 px-4 border border-brand-border/40 hover:border-brand-border/80 bg-brand-surface/40 hover:bg-brand-surface/80 rounded-xl text-sm md:text-xs font-mono text-gray-300 hover:text-white flex items-center justify-center gap-2 transition min-h-[44px] cursor-pointer"
              >
                {copiedField === 'title' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    Copied Title
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Title
                  </>
                )}
              </button>
              
              <button 
                id="btn-copy-meta-desc"
                onClick={() => copyToClipboard(metaDescription, 'description')}
                className="flex-1 py-3 px-4 border border-brand-border/40 hover:border-brand-border/80 bg-brand-surface/40 hover:bg-brand-surface/80 rounded-xl text-sm md:text-xs font-mono text-gray-300 hover:text-white flex items-center justify-center gap-2 transition min-h-[44px] cursor-pointer"
              >
                {copiedField === 'description' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    Copied Desc
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Desc
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List of structural checklist requirements (Audit Card) */}
          <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              SEO Alignment Rules Check
            </h3>
            
            <div className="space-y-3">
              {metrics.checks.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3.5 bg-brand-surface/20 border border-brand-border/20 rounded-xl hover:bg-brand-surface/40 transition duration-100 min-h-[48px]"
                >
                  <div className="pt-0.5 shrink-0">
                    {item.pass ? (
                      <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className={`text-xs font-mono font-medium block leading-none ${item.pass ? 'text-gray-300' : 'text-rose-400'}`}>
                      {item.label}
                    </span>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      {item.feedback}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
