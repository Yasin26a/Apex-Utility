import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  Sparkles, 
  Info,
  Type,
  BookOpen,
  MessageSquare,
  BarChart3,
  Globe,
  RefreshCw,
  Gauge,
  CaseSensitive,
  Sparkle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Simple but effective English Syllable Counter
function countSyllablesInWord(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

// Full text syllables breakdown
function estimateSyllables(text: string): number {
  const words = text.toLowerCase().match(/[a-z]+/g);
  if (!words) return 0;
  return words.reduce((acc, word) => acc + countSyllablesInWord(word), 0);
}

// Sample text templates for different languages
const TEMPLATES: Record<string, string> = {
  en: `Apex Operations is a premium full-stack suite delivering high-performance WASM compilers and advanced offline analytics tools. Built directly for modern workflows, it guarantees 100% data privacy since all computation is isolated within the sandboxed client environment.

This is an analytical paragraph designed to test word density, average sentence structure, and the Flesch-Kincaid readability score. Our software relies on optimized rendering loops and localized calculations to deliver immediate response metrics to developers. Enjoy the lightning-fast performance of client-side operations!`,
  es: `Apex Operations es una suite premium complementaria que ofrece compiladores WASM de alto rendimiento y herramientas de análisis avanzadas sin conexión. Creado directamente para flujos de trabajo modernos, garantiza el 100% de la privacidad de los datos, ya que todos los cálculos se aíslan dentro del entorno local de su navegador.

Este es un párrafo analítico diseñado para probar la densidad de palabras, la estructura promedio de las oraciones y el puntaje de legibilidad de Flesch-Kincaid. Disfrute del rendimiento ultrarrápido de las operaciones locales.`,
  fr: `Apex Operations est une suite complète premium offrant des compilateurs WASM de haute performance et des outils d'analyse hors ligne avancés. Conçu directement pour les flux de travail modernes, il garantit la confidentialité totale des données, car tous les calculs sont isolés dans l'environnement local de votre navigateur.

Ce paragraphe analytique est conçu pour tester la densité des mots, la structure des phrases et le score de lisibilité de Flesch-Kincaid. Bénéficiez d'une rapidité d'exécution exceptionnelle grâce aux calculs locaux.`,
  de: `Apex Operations ist eine erstklassige Full-Stack-Suite, die leistungsstarke WASM-Compiler und fortschrittliche Offline-Analysetools bietet. Es wurde direkt für moderne Arbeitsabläufe entwickelt und garantiert 100 % Datenschutz, da alle Berechnungen im lokalen Browser-Sandbox-Modus isoliert ausgeführt werden.

Dieser analytische Absatz dient zum Testen der Wortdichte, der durchschnittlichen Satzstruktur und des Flesch-Kincaid-Lesbarkeitsindexes. Erleben Sie die blitzschnelle Ausführung aller lokalen Operationen!`,
  pt: `O Apex Operations é um conjunto premium completo que oferece compiladores WASM de alto desempenho e ferramentas de análise avançadas offline. Desenvolvido diretamente para fluxos de trabalho modernos, garante 100% de privacidade dos dados, pois todo o cálculo é isolado no navegador local.

Este é um parágrafo analítico projetado para validar a densidade de palavras, a estrutura das frases e a pontuação de legibilidade de Flesch-Kincaid. Aproveite o desempenho incrivelmente rápido das operações 100% locais!`
};

export default function RichTextStatistics() {
  const { t, language } = useLanguage();
  const [text, setText] = useState<string>(TEMPLATES[language] || TEMPLATES.en);
  const [copied, setCopied] = useState(false);

  // Analytical Calculations
  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        charactersWithSpaces: 0,
        charactersWithoutSpaces: 0,
        words: 0,
        sentences: 0,
        paragraphs: 0,
        avgWordLength: 0.0,
        readingTimeMin: 0,
        readingTimeSec: 0,
        speakingTimeMin: 0,
        speakingTimeSec: 0,
        fleschEase: 100,
        syllables: 0,
        percentages: {
          letters: 0,
          numbers: 0,
          spaces: 0,
          others: 0
        },
        wordDensity: [] as { word: string; count: number; percentage: number }[],
        uniqueWords: 0
      };
    }

    // Characters
    const charactersWithSpaces = text.length;
    const charactersWithoutSpaces = text.replace(/\s/g, '').length;

    // Words
    const wordList = text.toLowerCase().match(/[a-zA-Z0-9áéíóúüñäößâêîôûçàèù]+'?[a-zA-Z0-9áéíóúüñäößâêîôûçàèù]*/g) || [];
    const words = wordList.length;

    // Sentences
    const sentencesList = text.split(/[.!?]+(?:\s+|\n+|$)/).filter(s => s.trim().length > 0);
    const sentences = sentencesList.length || 1;

    // Paragraphs
    const paragraphsList = text.split(/\n+/).filter(p => p.trim().length > 0);
    const paragraphs = paragraphsList.length || 1;

    // Average word length
    const totalLetters = wordList.reduce((acc, curr) => acc + curr.length, 0);
    const avgWordLength = words > 0 ? parseFloat((totalLetters / words).toFixed(1)) : 0;

    // Reading & Speaking Time
    // Reading average speed: 200 words per minute
    const readingTimeSecTotal = Math.round((words / 200) * 60);
    const readingTimeMin = Math.floor(readingTimeSecTotal / 60);
    const readingTimeSec = readingTimeSecTotal % 60;

    // Speaking average speed: 130 words per minute
    const speakingTimeSecTotal = Math.round((words / 130) * 60);
    const speakingTimeMin = Math.floor(speakingTimeSecTotal / 60);
    const speakingTimeSec = speakingTimeSecTotal % 60;

    // Syllables
    const totalSyllables = estimateSyllables(text);

    // Flesch Reading Ease Formula:
    // 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
    let fleschEase = 100;
    if (words > 0 && sentences > 0) {
      fleschEase = parseFloat((206.835 - 1.015 * (words / sentences) - 84.6 * (totalSyllables / words)).toFixed(1));
      if (fleschEase > 100) fleschEase = 100;
      if (fleschEase < 0) fleschEase = 0;
    }

    // Text Composition Percentages
    let letterCount = 0;
    let numberCount = 0;
    let spaceCount = 0;
    let otherCount = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/[a-zA-Záéíóúüñäößâêîôûçàèù]/i.test(char)) {
        letterCount++;
      } else if (/[0-9]/.test(char)) {
        numberCount++;
      } else if (/\s/.test(char)) {
        spaceCount++;
      } else {
        otherCount++;
      }
    }

    const totalChars = text.length || 1;
    const percentages = {
      letters: Math.round((letterCount / totalChars) * 100),
      numbers: Math.round((numberCount / totalChars) * 100),
      spaces: Math.round((spaceCount / totalChars) * 105), // weight adjuster
      others: Math.round((otherCount / totalChars) * 100)
    };
    // Normalize spaces to avoid going above 100
    const sum = percentages.letters + percentages.numbers + Math.round((spaceCount / totalChars) * 100) + percentages.others;
    percentages.spaces = Math.max(0, 100 - (percentages.letters + percentages.numbers + percentages.others));

    // Keyword Density (Filter short words / stop words lightly)
    const freqMap: Record<string, number> = {};
    const stopWords = new Set(['the', 'and', 'a', 'of', 'to', 'in', 'is', 'it', 'for', 'on', 'with', 'as', 'at', 'by', 'an', 'be', 'this', 'that', 'y', 'el', 'la', 'los', 'de', 'en', 'un', 'una', 'es', 'con', 'et', 'le', 'la', 'un', 'une', 'dans', 'pour', 'est', 'und', 'der', 'die', 'das', 'ist', 'im', 'fuer', 'mit', 'o', 'e', 'do', 'da', 'em', 'um', 'uma', 'para']);
    
    wordList.forEach(w => {
      const cleanedWord = w.toLowerCase();
      if (cleanedWord.length > 2 && !stopWords.has(cleanedWord)) {
        freqMap[cleanedWord] = (freqMap[cleanedWord] || 0) + 1;
      }
    });

    const uniqueWords = Object.keys(freqMap).length;
    const wordDensity = Object.entries(freqMap)
      .map(([word, count]) => ({
        word,
        count,
        percentage: parseFloat(((count / words) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      charactersWithSpaces,
      charactersWithoutSpaces,
      words,
      sentences,
      paragraphs,
      avgWordLength,
      readingTimeMin,
      readingTimeSec,
      speakingTimeMin,
      speakingTimeSec,
      fleschEase,
      syllables: totalSyllables,
      percentages,
      wordDensity,
      uniqueWords
    };
  }, [text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
  };

  const handleResetTemplate = () => {
    setText(TEMPLATES[language] || TEMPLATES.en);
  };

  // Text Case Transformations
  const transformText = (mode: 'upper' | 'lower' | 'sentence' | 'title') => {
    if (!text.trim()) return;
    if (mode === 'upper') {
      setText(text.toUpperCase());
    } else if (mode === 'lower') {
      setText(text.toLowerCase());
    } else if (mode === 'sentence') {
      const result = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, boundary, letter) => {
        return boundary + letter.toUpperCase();
      });
      setText(result);
    } else if (mode === 'title') {
      const result = text.toLowerCase().replace(/\b([a-z])/g, (letter) => {
        return letter.toUpperCase();
      });
      setText(result);
    }
  };

  // Localization utilities label checks
  const labels = {
    en: {
      title: 'Rich Text Statistics',
      subtitle: 'Real-Time Content Analytics Engine',
      statsSection: 'Text Structure Matrix',
      words: 'Word Count',
      charsWith: 'Chars (with space)',
      charsWithout: 'Chars (no space)',
      sentences: 'Sentence Count',
      paragraphs: 'Paragraph Count',
      avgWordLen: 'Avg. Word Length',
      readingTime: 'Reading Time',
      speakingTime: 'Speaking Time',
      readability: 'Readability Analysis',
      readabilityDesc: 'Flesch Reading Ease level based on word lengths and syllables mapping.',
      composition: 'Character Allocation',
      letters: 'Letters',
      numbers: 'Numbers',
      spaces: 'Spaces & Breaks',
      special: 'Symbols',
      densityTitle: 'Keyword Density Matrix',
      densityWords: 'Word',
      densityCount: 'Count',
      densityPercent: 'Density',
      uniqueWords: 'Unique Words',
      actions: 'Aesthetics & Transforms',
      copy: 'Copy Workspace',
      clear: 'Clear Pad',
      sample: 'Load Template',
      placeholder: 'Type or paste your editorial text blocks here to invoke immediate telemetry calculations...',
      upper: 'ALL CAPS',
      lower: 'lower case',
      sentence: 'Sentence case',
      titleCase: 'Title Case',
      wordsLabel: 'words',
      minutesLabel: 'min',
      secondsLabel: 'sec'
    },
    es: {
      title: 'Estadísticas de Texto',
      subtitle: 'Motor de Análisis de Contenido en Tiempo Real',
      statsSection: 'Matriz de Estructura de Texto',
      words: 'Palabras',
      charsWith: 'Caracteres (con espacio)',
      charsWithout: 'Caracteres (sin espacio)',
      sentences: 'Oraciones',
      paragraphs: 'Párrafos',
      avgWordLen: 'Longitud de Palabra Promedio',
      readingTime: 'Tiempo de Lectura',
      speakingTime: 'Tiempo de Voz',
      readability: 'Análisis de Legibilidad',
      readabilityDesc: 'Nivel del índice de facilidad de lectura Flesch basado en sílabas y oraciones.',
      composition: 'Asignación de Caracteres',
      letters: 'Letras',
      numbers: 'Números',
      spaces: 'Espacios',
      special: 'Símbolos',
      densityTitle: 'Matriz de Densidad de Palabras',
      densityWords: 'Palabra',
      densityCount: 'Frecuencia',
      densityPercent: 'Densidad',
      uniqueWords: 'Palabras Únicas',
      actions: 'Estética y Transformación',
      copy: 'Copiar Bloque',
      clear: 'Limpiar Todo',
      sample: 'Cargar Plantilla',
      placeholder: 'Escriba o pegue sus bloques de texto aquí para realizar cálculos inmediatos...',
      upper: 'MAYÚSCULAS',
      lower: 'minúsculas',
      sentence: 'Caso de oración',
      titleCase: 'Título',
      wordsLabel: 'palabras',
      minutesLabel: 'min',
      secondsLabel: 'seg'
    },
    fr: {
      title: 'Statistiques de Texte',
      subtitle: 'Moteur d\'Analyse de Contenu en Temps Réel',
      statsSection: 'Structure Globale du Texte',
      words: 'Nombre de Mots',
      charsWith: 'Caractères (avec espaces)',
      charsWithout: 'Caractères (sans espace)',
      sentences: 'Phrases',
      paragraphs: 'Paragraphes',
      avgWordLen: 'Longueur Moyenne',
      readingTime: 'Temps de Lecture',
      speakingTime: 'Temps de Parole',
      readability: 'Analyse de Lisibilité',
      readabilityDesc: 'Score de Facilité de Lecture Flesch calculé à l\'aide de structures syllabiques.',
      composition: 'Répartition des Caractères',
      letters: 'Lettres',
      numbers: 'Chiffres',
      spaces: 'Espaces',
      special: 'Symboles',
      densityTitle: 'Matrice de Densité des Mots',
      densityWords: 'Mot',
      densityCount: 'Fréquence',
      densityPercent: 'Densité',
      uniqueWords: 'Mots Uniques',
      actions: 'Aesthetics & Transformations',
      copy: 'Copier le Texte',
      clear: 'Effacer',
      sample: 'Charger le Modèle',
      placeholder: 'Saisissez ou collez votre texte ici pour calculer instantanément les statistiques...',
      upper: 'MAJUSCULES',
      lower: 'minuscules',
      sentence: 'Phrase standard',
      titleCase: 'Titre',
      wordsLabel: 'mots',
      minutesLabel: 'min',
      secondsLabel: 'sec'
    },
    de: {
      title: 'Textstatistiken',
      subtitle: 'Inhaltsanalyse in Echtzeit',
      statsSection: 'Textstruktur-Metriken',
      words: 'Wortanzahl',
      charsWith: 'Zeichen (mit Leerzeichen)',
      charsWithout: 'Zeichen (ohne Leerzeichen)',
      sentences: 'Satzanzahl',
      paragraphs: 'Absatzanzahl',
      avgWordLen: 'Ø Wortlänge',
      readingTime: 'Lesezeit',
      speakingTime: 'Sprechzeit',
      readability: 'Lesbarkeitsanalyse',
      readabilityDesc: 'Flesch-Lesbarkeitsindex gemessen anhand von Satzlänge und Silbenanzahl.',
      composition: 'Zeichen-Verteilung',
      letters: 'Buchstaben',
      numbers: 'Zahlen',
      spaces: 'Leerzeichen',
      special: 'Symbole',
      densityTitle: 'Schlüsselwort-Dichte-Matrix',
      densityWords: 'Wort',
      densityCount: 'Häufigkeit',
      densityPercent: 'Dichte',
      uniqueWords: 'Einzigartige Wörter',
      actions: 'Ästhetik & Transformationen',
      copy: 'Text Kopieren',
      clear: 'Bereich Leeren',
      sample: 'Vorlage Laden',
      placeholder: 'Geben Sie Ihren Text hier ein oder fügen Sie ihn ein, um sofortige Statistiken auszugeben...',
      upper: 'GROSSBUCHSTABEN',
      lower: 'kleinbuchstaben',
      sentence: 'Satzanfang groß',
      titleCase: 'Titel-Schreibweise',
      wordsLabel: 'Wörter',
      minutesLabel: 'Min',
      secondsLabel: 'Sek'
    },
    pt: {
      title: 'Estatísticas de Texto',
      subtitle: 'Motor de Análise de Conteúdo em Tempo Real',
      statsSection: 'Estrutura Completa de Texto',
      words: 'Contagem de Palavras',
      charsWith: 'Caracteres (com espaço)',
      charsWithout: 'Caracteres (sem espaço)',
      sentences: 'Contagem de Frases',
      paragraphs: 'Contagem de Parágrafos',
      avgWordLen: 'Comprimento Médio',
      readingTime: 'Tempo de Leitura',
      speakingTime: 'Tempo de Pronúncia',
      readability: 'Análise de Legibilidade',
      readabilityDesc: 'Índice de facilidade de leitura Flesch ajustado para sílabas inglesas e estruturas locais.',
      composition: 'Distribuição dos Caracteres',
      letters: 'Letras',
      numbers: 'Números',
      spaces: 'Espaços',
      special: 'Símbolos',
      densityTitle: 'Matriz de Densidade de Palavras',
      densityWords: 'Palavra',
      densityCount: 'Frequência',
      densityPercent: 'Densidade',
      uniqueWords: 'Palavras Únicas',
      actions: 'Estética e Transformações',
      copy: 'Copiar Painel',
      clear: 'Limpar Bloco',
      sample: 'Carregar Modelo',
      placeholder: 'Comece a digitar ou cole seus blocos de texto aqui para ver estatísticas instantâneas...',
      upper: 'MAIÚSCULAS',
      lower: 'minúsculas',
      sentence: 'Estilo frase',
      titleCase: 'Estilo Título',
      wordsLabel: 'palavras',
      minutesLabel: 'min',
      secondsLabel: 'seg'
    }
  };

  const l = labels[language] || labels.en;

  // Readability feedback category
  const getReadabilityCategory = (score: number) => {
    if (score >= 90) return { label: 'Very Easy (School Level 5th Grade)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 80) return { label: 'Easy (School Level 6th Grade)', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' };
    if (score >= 70) return { label: 'Fairly Easy (School Level 7th Grade)', color: 'text-brand bg-brand/10 border-brand/20' };
    if (score >= 60) return { label: 'Standard / Plain English (8th-9th Grade)', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    if (score >= 50) return { label: 'Fairly Difficult (High School Student)', color: 'text-amber-500 bg-amber-500/10 border-amber-500/35' };
    if (score >= 30) return { label: 'Difficult (College level & Academic)', color: 'text-orange-500 bg-orange-500/10 border-orange-500/35' };
    return { label: 'Very Confusing (Professional/Scientific Essay)', color: 'text-rose-500 bg-rose-500/10 border-rose-500/35' };
  };

  const readabilityObj = getReadabilityCategory(stats.fleschEase);

  return (
    <div id="rich-text-stats-workspace" className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-brand-border/30">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl text-brand shadow-lg shadow-brand/5">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-brand tracking-widest block uppercase">Apex Core Tools</span>
              <h1 className="text-3xl font-sans font-medium tracking-tight text-white mb-1">{l.title}</h1>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            {l.subtitle} &middot; {t.navigation.richTextStatsDesc}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleResetTemplate}
            className="flex items-center gap-2 px-3.5 py-2 border border-brand-border/40 hover:border-brand-border/80 bg-brand-surface/40 hover:bg-brand-surface/80 rounded-xl text-xs text-gray-300 hover:text-white transition duration-200 font-mono tracking-wider cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand" />
            {l.sample}
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-2 px-3.5 py-2 border border-zinc-800 hover:border-red-900/50 bg-zinc-950/40 hover:bg-red-500/5 rounded-xl text-xs text-gray-400 hover:text-red-400 transition duration-200 font-mono tracking-wider cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {l.clear}
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Left Side: Input Textarea & Format Utilities (Col span 7) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl relative">
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 bg-[#0c0d12] hover:bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-[11px]"
                title="Copy contents"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.common.success : l.copy}</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-brand" />
              <span>Workspace Input Buffer</span>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={l.placeholder}
              className="w-full h-[320px] md:h-[380px] bg-[#030305] border border-zinc-900/80 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-brand/40 font-sans leading-relaxed resize-none transition-colors"
            />

            {/* Transformer Toolbar inside standard container */}
            <div className="mt-4 pt-4 border-t border-zinc-900/80 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => transformText('upper')}
                  disabled={!text}
                  className="px-2.5 py-1.5 bg-[#0a0a0d] hover:bg-zinc-900/80 disabled:opacity-40 border border-zinc-900 rounded text-[10px] font-mono font-bold text-zinc-300 uppercase transition-all cursor-pointer"
                >
                  {l.upper}
                </button>
                <button
                  type="button"
                  onClick={() => transformText('lower')}
                  disabled={!text}
                  className="px-2.5 py-1.5 bg-[#0a0a0d] hover:bg-zinc-900/80 disabled:opacity-40 border border-zinc-900 rounded text-[10px] font-mono font-bold text-zinc-300 transition-all cursor-pointer"
                >
                  {l.lower}
                </button>
                <button
                  type="button"
                  onClick={() => transformText('sentence')}
                  disabled={!text}
                  className="px-2.5 py-1.5 bg-[#0a0a0d] hover:bg-zinc-900/80 disabled:opacity-40 border border-zinc-900 rounded text-[10px] font-mono font-bold text-zinc-300 transition-all cursor-pointer"
                >
                  {l.sentence}
                </button>
                <button
                  type="button"
                  onClick={() => transformText('title')}
                  disabled={!text}
                  className="px-2.5 py-1.5 bg-[#0a0a0d] hover:bg-zinc-900/80 disabled:opacity-40 border border-zinc-900 rounded text-[10px] font-mono font-bold text-zinc-300 transition-all cursor-pointer"
                >
                  {l.titleCase}
                </button>
              </div>

              {/* Word indicator bottom bar */}
              <div className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                <Sparkle className="w-3 h-3 text-brand" />
                <span>{stats.words} {l.wordsLabel}</span>
              </div>
            </div>
          </div>

          {/* Composition Analytics */}
          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-brand" />
              <span>{l.composition}</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              {/* Letters */}
              <div className="p-3 bg-[#0a0b0d] border border-zinc-900 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 block uppercase">{l.letters}</span>
                <div className="flex items-baseline justify-between transition-all">
                  <span className="text-lg font-bold text-white font-mono">{stats.percentages.letters}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${stats.percentages.letters}%` }} />
                </div>
              </div>

              {/* Numbers */}
              <div className="p-3 bg-[#0a0b0d] border border-zinc-900 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 block uppercase">{l.numbers}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-white font-mono">{stats.percentages.numbers}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${stats.percentages.numbers}%` }} />
                </div>
              </div>

              {/* Spaces */}
              <div className="p-3 bg-[#0a0b0d] border border-zinc-900 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 block uppercase">{l.spaces}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-white font-mono">{stats.percentages.spaces}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${stats.percentages.spaces}%` }} />
                </div>
              </div>

              {/* Special Characters */}
              <div className="p-3 bg-[#0a0b0d] border border-zinc-900 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 block uppercase">{l.special}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-white font-mono">{stats.percentages.others}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${stats.percentages.others}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Metrics Dashboard (Col span 5) */}
        <div className="xl:col-span-5 space-y-6">

          {/* Bento Grid Metrics Header / Dashboard Info */}
          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
              <Gauge className="w-4.5 h-4.5 text-brand" />
              <span>{l.statsSection}</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Words count */}
              <div className="p-4 bg-[#0a0b0f] border border-zinc-900 rounded-xl text-center space-y-1 relative group hover:border-brand/35 transition-colors">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">{l.words}</span>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">{stats.words}</div>
                <div className="text-[9px] font-mono text-zinc-600 block uppercase">{stats.uniqueWords} {l.uniqueWords}</div>
              </div>

              {/* Characters With spaces */}
              <div className="p-4 bg-[#0a0b0f] border border-zinc-900 rounded-xl text-center space-y-1 hover:border-cyan-500/30 transition-colors">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">{l.charsWith}</span>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">{stats.charactersWithSpaces}</div>
                <div className="text-[9px] font-mono text-zinc-500 block uppercase">[{stats.syllables} Syllables]</div>
              </div>

              {/* Characters Without Spaces */}
              <div className="p-4 bg-[#0a0b0f] border border-zinc-900 rounded-xl text-center space-y-1 hover:border-zinc-800 transition-colors">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">{l.charsWithout}</span>
                <div className="text-2xl font-bold font-mono text-zinc-300 tracking-tight">{stats.charactersWithoutSpaces}</div>
                <div className="text-[9px] font-mono text-zinc-650 block uppercase">Spaces: {stats.charactersWithSpaces - stats.charactersWithoutSpaces}</div>
              </div>

              {/* Sentences */}
              <div className="p-4 bg-[#0a0b0f] border border-zinc-900 rounded-xl text-center space-y-1 hover:border-zinc-800 transition-colors">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">{l.sentences}</span>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">{stats.sentences}</div>
                <div className="text-[9px] font-mono text-zinc-500 block uppercase">Ø {l.avgWordLen}: {stats.avgWordLength}</div>
              </div>

              {/* Reading Speed Estimation */}
              <div className="p-4 bg-brand/5 border border-brand/10 hover:border-brand/20 rounded-xl text-center space-y-1 transition-colors">
                <span className="text-[10px] font-mono text-brand font-bold uppercase flex items-center justify-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>{l.readingTime}</span>
                </span>
                <div className="text-xl font-bold font-mono text-white tracking-tight">
                  {stats.readingTimeMin} {l.minutesLabel} {stats.readingTimeSec} {l.secondsLabel}
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase block">Calculated @ 200 WPM</span>
              </div>

              {/* Speaking Time estimation */}
              <div className="p-4 bg-cyan-950/20 border border-cyan-900/30 hover:border-cyan-800/40 rounded-xl text-center space-y-1 transition-colors">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center justify-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{l.speakingTime}</span>
                </span>
                <div className="text-xl font-bold font-mono text-white tracking-tight">
                  {stats.speakingTimeMin} {l.minutesLabel} {stats.speakingTimeSec} {l.secondsLabel}
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase block">Calculated @ 130 WPM</span>
              </div>
            </div>
          </div>

          {/* Readability Dashboard Gauge */}
          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
              <Sparkles className="w-4.5 h-4.5 text-brand" />
              <span>{l.readability}</span>
            </h3>

            <div className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                {l.readabilityDesc}
              </p>

              <div className="flex items-center gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-900">
                <div className="w-16 h-16 rounded-full border-2 border-brand/35 flex items-center justify-center flex-shrink-0 bg-brand/5 shadow-inner">
                  <span className="text-xl font-bold text-white font-mono">{stats.fleschEase}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-brand uppercase block font-bold tracking-widest mb-1">Flesch Reading Ease</span>
                  <div className={`px-2.5 py-1 rounded text-xs font-semibold inline-block border ${readabilityObj.color}`}>
                    {readabilityObj.label}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Keyword Density Inspector */}
          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <CaseSensitive className="w-4.5 h-4.5 text-brand" />
                <span>{l.densityTitle} (Length &gt; 2)</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">{stats.wordDensity.length} {l.uniqueWords}</span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {stats.wordDensity.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 italic">
                  Type longer words to generate density analytics list.
                </div>
              ) : (
                stats.wordDensity.map((item, index) => (
                  <div key={item.word} className="flex items-center justify-between gap-4 text-xs font-mono bg-zinc-950 p-2 border border-zinc-900/60 rounded-xl hover:border-brand/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-650 w-4 inline-block font-bold">#{index + 1}</span>
                      <span className="text-zinc-200 font-bold">{item.word}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">{item.count} pts</span>
                      <div className="w-16 bg-zinc-900 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, item.percentage * 10)}%` }} />
                      </div>
                      <span className="text-brand/90 font-bold w-10 text-right">{item.percentage}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
