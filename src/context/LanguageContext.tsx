import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'pt';

export interface Translations {
  navigation: {
    dashboard: string;
    dashboardDesc: string;
    compressPdf: string;
    compressPdfDesc: string;
    joinPdf: string;
    joinPdfDesc: string;
    imageToPdf: string;
    imageToPdfDesc: string;
    webpConverter: string;
    webpConverterDesc: string;
    jsonBeautifier: string;
    jsonBeautifierDesc: string;
    sitemapSeo: string;
    sitemapSeoDesc: string;
    aiWriter: string;
    aiWriterDesc: string;
    passwordGenerator: string;
    passwordGeneratorDesc: string;
    qrGenerator: string;
    qrGeneratorDesc: string;
    imageVectorizer: string;
    imageVectorizerDesc: string;
    codeSnapshot: string;
    codeSnapshotDesc: string;
    privateSketchpad: string;
    privateSketchpadDesc: string;
    unitConverter: string;
    unitConverterDesc: string;
    svgRasterizer: string;
    svgRasterizerDesc: string;
    batchProcessor: string;
    batchProcessorDesc: string;
    jsonDiff: string;
    jsonDiffDesc: string;
    secureHash: string;
    secureHashDesc: string;
    colorPalette: string;
    colorPaletteDesc: string;
    digitalSignature: string;
    digitalSignatureDesc: string;
    seoOptimizer: string;
    seoOptimizerDesc: string;
    base64Converter: string;
    base64ConverterDesc: string;
    regexTester: string;
    regexTesterDesc: string;
    csvJsonConverter: string;
    csvJsonConverterDesc: string;
    imageCompressor: string;
    imageCompressorDesc: string;
    richTextStats: string;
    richTextStatsDesc: string;
    audioTrimmer: string;
    audioTrimmerDesc: string;
    aiTranscriber: string;
    aiTranscriberDesc: string;
    pdfAnalyst: string;
    pdfAnalystDesc: string;
    exifStripper: string;
    exifStripperDesc: string;
    videoRecorder: string;
    videoRecorderDesc: string;
    caseConverter: string;
    caseConverterDesc: string;
    loremGenerator: string;
    loremGeneratorDesc: string;
    imageCropper: string;
    imageCropperDesc: string;
    dateCalculator: string;
    dateCalculatorDesc: string;
  };
  settings: {
    title: string;
    presets: string;
    systemTheme: string;
    language: string;
    selectLanguage: string;
    english: string;
    spanish: string;
    french: string;
    german: string;
    portuguese: string;
  };
  dashboard: {
    welcome: string;
    subtitle: string;
    latency: string;
    memory: string;
    systemClean: string;
    fileLimit: string;
    activeSessions: string;
    activityStatus: string;
    toolsTitle: string;
    launchTool: string;
  };
  common: {
    searchPlaceholder: string;
    themeLabel: string;
    save: string;
    copy: string;
    download: string;
    error: string;
    success: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    navigation: {
      dashboard: 'Control Deck',
      dashboardDesc: 'Apex Operations Hub',
      compressPdf: 'PDF Forge',
      compressPdfDesc: 'Optimization Engine',
      joinPdf: 'PDF Joiner',
      joinPdfDesc: 'Page Reordering',
      imageToPdf: 'Image to PDF',
      imageToPdfDesc: 'Merge & Convert',
      webpConverter: 'Media Lab',
      webpConverterDesc: 'Instant Converter',
      jsonBeautifier: 'JSON Core',
      jsonBeautifierDesc: 'Data Beautifier',
      sitemapSeo: 'SEO Crawler',
      sitemapSeoDesc: 'Sitemap Analyzer',
      aiWriter: 'AI Writer',
      aiWriterDesc: 'AI Copywriter Engine',
      passwordGenerator: 'Shield Vault',
      passwordGeneratorDesc: 'Secure Password Generator',
      qrGenerator: 'QR & Barcode Studio',
      qrGeneratorDesc: 'Advanced Code & Signal Builder',
      imageVectorizer: 'Image Vectorizer',
      imageVectorizerDesc: 'Convert PNG/JPG to scalable SVG',
      codeSnapshot: 'Code Snap Canvas',
      codeSnapshotDesc: 'Beautify & snapshot code layouts',
      privateSketchpad: 'Sketchpad / Diagram',
      privateSketchpadDesc: 'Local secure diagramming canvas',
      unitConverter: 'Unit Converter',
      unitConverterDesc: 'Secure Metric Solver & Converter',
      svgRasterizer: 'SVG Rasterizer',
      svgRasterizerDesc: 'Convert SVG Vectors to High-Res Images',
      batchProcessor: 'Batch Processor',
      batchProcessorDesc: 'Resize & Compress Multiple Files Instantly',
      jsonDiff: 'JSON Diff Checker',
      jsonDiffDesc: 'Compare Two JSON Objects Side-By-Side',
      secureHash: 'Hash Vault',
      secureHashDesc: 'Generate secure cryptographic MD5, SHA-1, SHA-256, and SHA-512 hashes',
      colorPalette: 'Color Palette',
      colorPaletteDesc: 'Generate harmonious color schemes and extract brand colors from any image',
      digitalSignature: 'Digital Signature',
      digitalSignatureDesc: 'Create, preview and download custom drawn or text signatures',
      seoOptimizer: 'SEO Content Optimizer',
      seoOptimizerDesc: 'Analyze text keyword density, readability, and meta-descriptions in real-time',
      base64Converter: 'Base64 Encoder/Decoder',
      base64ConverterDesc: 'Convert files, images, or texts to secure Base64 data with code exports',
      regexTester: 'Regex Validator & Tester',
      regexTesterDesc: 'Validate and debug regular expressions with real-time highlighting and group details',
      csvJsonConverter: 'CSV ⇄ JSON Converter',
      csvJsonConverterDesc: 'Convert files or text between CSV and JSON formats with live editing previews',
      imageCompressor: 'Image Compressor',
      imageCompressorDesc: 'Compress and resize JPEG, PNG, and WebP images with size reduction metrics',
      richTextStats: 'Rich Text Statistics',
      richTextStatsDesc: 'Detail character, word, sentence, and readability metrics for custom text inputs in real-time',
      audioTrimmer: 'Audio Trimmer',
      audioTrimmerDesc: 'Upload, visualize, preview, and trim audio clips securely with local WAV rendering',
      aiTranscriber: 'AI Audio Transcriber',
      aiTranscriberDesc: 'Upload files and leverage Gemini AI to transcribe speech into time-coded SRT or TXT paragraphs',
      pdfAnalyst: 'AI PDF & Document Q&A',
      pdfAnalystDesc: 'Upload papers, sheets, or PDF files and converse with them using specialized AI models securely',
      exifStripper: 'EXIF Metadata Inspector',
      exifStripperDesc: 'Analyze hidden EXIF headers, GPS track logs, and strip binary metadata to secure image privacy',
      videoRecorder: 'Screen Recorder & GIF Exporter',
      videoRecorderDesc: 'Record screen feeds, microphone voice overlay, and export instantly to High-Quality looping GIFs or WebM',
      caseConverter: 'Case Converter & Formatter',
      caseConverterDesc: 'Format text styles, convert letter cases, clean whitespace, and count text stats in real-time',
      loremGenerator: 'Lorem Ipsum & Placeholder Generator',
      loremGeneratorDesc: 'Generate customizable placeholder text paragraphs, list elements, sentences, HTML mockups, or image placeholder elements offline',
      imageCropper: 'Image Cropper, Resizer & Ratio Balancer',
      imageCropperDesc: 'Crop, adjust aspect ratios (16:9, 4:3, 1:1, etc.), resize custom pixels, and balance canvas resolutions offline',
      dateCalculator: 'Time & Date Calculator',
      dateCalculatorDesc: 'Calculate differences between dates, add or subtract time intervals, count business days, and convert timezones offline',
    },
    settings: {
      title: 'System Aesthetics',
      presets: 'PRESETS v2',
      systemTheme: 'Auto System Preference',
      language: 'Interface Language',
      selectLanguage: 'Select Language',
      english: 'English (US)',
      spanish: 'Español (ES)',
      french: 'Français (FR)',
      german: 'Deutsch (DE)',
      portuguese: 'Português (PT)',
    },
    dashboard: {
      welcome: 'APEX COMMAND ACCESS',
      subtitle: 'System Control Terminal for Professional Document Forge and Media Operations',
      latency: 'SYSTEM LATENCY',
      memory: 'HEAP ALLOCATION',
      systemClean: 'UTILITY CORE',
      fileLimit: 'PAYLOAD BUFFER',
      activeSessions: 'SECURE ENVELOPE',
      activityStatus: 'CORE ENGINE',
      toolsTitle: 'OPERATIONAL HARDWARE SUITE',
      launchTool: 'BOOT DIRECTIVE',
    },
    common: {
      searchPlaceholder: 'SEARCH APEX...',
      themeLabel: 'Theme',
      save: 'Save',
      copy: 'Copy',
      download: 'Download',
      error: 'Error',
      success: 'Success',
    }
  },
  es: {
    navigation: {
      dashboard: 'Panel de Control',
      dashboardDesc: 'Centro de Operaciones',
      compressPdf: 'Forja PDF',
      compressPdfDesc: 'Motor de Optimización',
      joinPdf: 'Joiner PDF',
      joinPdfDesc: 'Reordenación de Páginas',
      imageToPdf: 'Imagen a PDF',
      imageToPdfDesc: 'Combinar y Convertir',
      webpConverter: 'Laboratorio Media',
      webpConverterDesc: 'Conversor de Imagen',
      jsonBeautifier: 'Núcleo JSON',
      jsonBeautifierDesc: 'Embellecedor de Datos',
      sitemapSeo: 'Rastreador SEO',
      sitemapSeoDesc: 'Analizador de Mapas',
      aiWriter: 'Escritor IA',
      aiWriterDesc: 'Redactor de Documentos',
      passwordGenerator: 'Bóveda de Claves',
      passwordGeneratorDesc: 'Generador Claves Seguras',
      qrGenerator: 'Generador QR',
      qrGeneratorDesc: 'Compilador de Códigos QR',
      imageVectorizer: 'Vectorizador de Imágenes',
      imageVectorizerDesc: 'Convertir PNG/JPG a SVG escalable',
      codeSnapshot: 'Captura de Código',
      codeSnapshotDesc: 'Embellecer y capturar esquemas de código',
      privateSketchpad: 'Pizarra de Diagramas',
      privateSketchpadDesc: 'Lienzo seguro de diagramación local',
      unitConverter: 'Convertidor de Unidades',
      unitConverterDesc: 'Conversor Métrico y Científico Seguro',
      svgRasterizer: 'Rasterizador SVG',
      svgRasterizerDesc: 'Fusión de Vector SVG a Imagen de Alta Res',
      batchProcessor: 'Procesador por Lotes',
      batchProcessorDesc: 'Optimizar Múltiples Archivos en Paralelo',
      jsonDiff: 'Comparador JSON',
      jsonDiffDesc: 'Comparar dos objetos JSON lado a lado',
      secureHash: 'Bóveda de Hashes',
      secureHashDesc: 'Generar hashes criptográficos seguros MD5, SHA-1, SHA-256 y SHA-512',
      colorPalette: 'Paleta de Colores',
      colorPaletteDesc: 'Generar esquemas de colores armoniosos y extraer colores de marcas de imágenes',
      digitalSignature: 'Firma Digital',
      digitalSignatureDesc: 'Crear, previsualizar y descargar firmas dibujadas o tipográficas',
      seoOptimizer: 'Optimizador de Contenido SEO',
      seoOptimizerDesc: 'Analizar densidad de palabras clave, legibilidad y meta descripciones en tiempo real',
      base64Converter: 'Codificador/Decodificador Base64',
      base64ConverterDesc: 'Convierta archivos, imágenes o textos a Base64 con exportación de código',
      regexTester: 'Validador y Probador Regex',
      regexTesterDesc: 'Pruebe y depure patrones de expresiones regulares y grupos de captura en tempo real',
      csvJsonConverter: 'Conversor CSV ⇄ JSON',
      csvJsonConverterDesc: 'Convierta archivos o texto entre CSV y JSON con vista previa y descarga',
      imageCompressor: 'Compresor de Imágenes',
      imageCompressorDesc: 'Comprima y redimensione imágenes JPEG, PNG y WebP con métricas de reducción',
      richTextStats: 'Estadísticas de Texto',
      richTextStatsDesc: 'Analice métricas detalladas de caracteres, palabras, oraciones y legibilidad en tiempo real',
      audioTrimmer: 'Recortador de Audio',
      audioTrimmerDesc: 'Suba, visualice, escuche y recorte fragmentos de audio de forma segura con renderizado local WAV',
      aiTranscriber: 'Transcriptor de Audio IA',
      aiTranscriberDesc: 'Suba archivos y use la IA de Gemini para transcribir voz a párrafos SRT o TXT estructurados',
      pdfAnalyst: 'Chat con PDF y Doctos IA',
      pdfAnalystDesc: 'Suba archivos PDF o documentos y converse con ellos usando modelos de IA avanzados',
      exifStripper: 'Inspector y Eliminador EXIF',
      exifStripperDesc: 'Analice cabeceras EXIF ocultas, registros GPS y borre metadatos para proteger la privacidad',
      videoRecorder: 'Grabadora de Pantalla y Cámara',
      videoRecorderDesc: 'Grabe pantallas, entradas de micrófono y superponga señales de cámara web en alta definición',
      caseConverter: 'Conversor de Mayúsculas',
      caseConverterDesc: 'Formatee estilos de texto, convierta mayúsculas/minúsculas, limpie espacios y cuente estadísticas de texto',
      loremGenerator: 'Generador de Lorem Ipsum',
      loremGeneratorDesc: 'Genere texto de relleno de lorem ipsum personalizable, listas, oraciones, mockups de HTML o imágenes comodín fuera de línea',
      imageCropper: 'Recortador y Redimensionador de Imágenes',
      imageCropperDesc: 'Recorte imágenes, ajuste relaciones de aspecto, cambie el tamaño de entrada de píxeles y equilibre su resolución localmente',
      dateCalculator: 'Calculadora de Tiempo y Fecha',
      dateCalculatorDesc: 'Calcule diferencias entre fechas, sume o reste intervalos, cuente días laborables y convierta zonas horarias sin conexión',
    },
    settings: {
      title: 'Estética del Sistema',
      presets: 'AJUSTES v2',
      systemTheme: 'Preferencia del Sistema',
      language: 'Idioma de Interfaz',
      selectLanguage: 'Seleccionar idioma',
      english: 'English (US)',
      spanish: 'Español (ES)',
      french: 'Français (FR)',
      german: 'Deutsch (DE)',
      portuguese: 'Português (PT)',
    },
    dashboard: {
      welcome: 'ACCESO DE COMANDO APEX',
      subtitle: 'Terminal de Control del Sistema para Forjado Profesional de Documentos y Operaciones de Medios',
      latency: 'LATENCIA DEL SISTEMA',
      memory: 'ASIGNACIÓN DE MEMORIA',
      systemClean: 'NÚCLEO DE UTILIDAD',
      fileLimit: 'BUFFER DE CARGA',
      activeSessions: 'SOBRE SEGURO',
      activityStatus: 'MOTOR PRINCIPAL',
      toolsTitle: 'SUITE DE HARDWARE OPERATIVO',
      launchTool: 'DIRECTIVA DE ARRANQUE',
    },
    common: {
      searchPlaceholder: 'BUSCAR APEX...',
      themeLabel: 'Tema',
      save: 'Guardar',
      copy: 'Copiar',
      download: 'Descargar',
      error: 'Error',
      success: 'Éxito',
    }
  },
  fr: {
    navigation: {
      dashboard: 'Poste de Contrôle',
      dashboardDesc: 'Hub des Opérations',
      compressPdf: 'Forge PDF',
      compressPdfDesc: 'Moteur d\'Optimisation',
      joinPdf: 'Assembleur PDF',
      joinPdfDesc: 'Réorganisation de Pages',
      imageToPdf: 'Image en PDF',
      imageToPdfDesc: 'Fusionner et Convertir',
      webpConverter: 'Labo Média',
      webpConverterDesc: 'Convertisseur Image',
      jsonBeautifier: 'Noyau JSON',
      jsonBeautifierDesc: 'Mise en forme des données',
      sitemapSeo: 'Robot SEO',
      sitemapSeoDesc: 'Analyseur de Plans',
      aiWriter: 'Rédacteur IA',
      aiWriterDesc: 'Création de Documents',
      passwordGenerator: 'Coffre-fort',
      passwordGeneratorDesc: 'Générateur Mots de Passe',
      qrGenerator: 'Générateur QR',
      qrGeneratorDesc: 'Compilateur de Codes QR',
      imageVectorizer: 'Vectoriseur d\'Image',
      imageVectorizerDesc: 'Convertir PNG/JPG en SVG vectoriel',
      codeSnapshot: 'Snap de Code',
      codeSnapshotDesc: 'Créer de superbes captures de code',
      privateSketchpad: 'Tableau de Croquis',
      privateSketchpadDesc: 'Canevas de diagramme local et sécurisé',
      unitConverter: 'Convertisseur d\'Unités',
      unitConverterDesc: 'Convertisseur Métrique Ultra Rapide',
      svgRasterizer: 'Rastériseur SVG',
      svgRasterizerDesc: 'Convertir les Vecteurs SVG en Images HD',
      batchProcessor: 'Processeur en Lot',
      batchProcessorDesc: 'Optimiser Plusieurs Fichiers en Parallèle',
      jsonDiff: 'Comparateur JSON',
      jsonDiffDesc: 'Comparer deux objets JSON côte à côte',
      secureHash: 'Coffre de Hachage',
      secureHashDesc: 'Générer des hachages cryptographiques sécurisés MD5, SHA-1, SHA-256 et SHA-512',
      colorPalette: 'Palette de Couleurs',
      colorPaletteDesc: 'Générer des schémas de couleurs harmonieux et extraire les couleurs d\'images',
      digitalSignature: 'Signature Numérique',
      digitalSignatureDesc: 'Créer, prévisualiser et télécharger des signatures dessinées ou textuelles',
      seoOptimizer: 'Optimiseur de Contenu SEO',
      seoOptimizerDesc: 'Analyser la densité des mots-clés, la lisibilité et les méta-descriptions en temps réel',
      base64Converter: 'Encodeur/Décodeur Base64',
      base64ConverterDesc: 'Convertir fichiers, images ou textes en Base64 avec exportations de code',
      regexTester: 'Testeur et Valideur Regex',
      regexTesterDesc: 'Expérimentez et valisez vos expressions régulières et groupes de capture en temps réel',
      csvJsonConverter: 'Convertisseur CSV ⇄ JSON',
      csvJsonConverterDesc: 'Convertir des fichiers ou du texte entre CSV et JSON avec prévisualisation en direct',
      imageCompressor: 'Compresseur d\'Images',
      imageCompressorDesc: 'Compressez et redimensionnez des images JPEG, PNG et WebP avec des statistiques de réduction',
      richTextStats: 'Statistiques de Texte',
      richTextStatsDesc: 'Analysez en temps réel des statistiques détaillées de caractères, mots, phrases et lisibilité',
      audioTrimmer: 'Coupeur Audio',
      audioTrimmerDesc: 'Téléchargez, visualisez, écoutez et découpez des fichiers audio localement au format WAV',
      aiTranscriber: 'Transcripteur Audio IA',
      aiTranscriberDesc: 'Téléchargez des fichiers et utilisez l\'IA Gemini pour transcrire en paragraphes SRT ou TXT minutés',
      pdfAnalyst: 'Chattez avec vos PDF IA',
      pdfAnalystDesc: 'Téléchargez des fichiers PDF et discutez avec eux en temps réel grâce à l\'IA de Gemini',
      exifStripper: 'Inspecteur & Nettoyeur EXIF',
      exifStripperDesc: 'Inspectez les données EXIF masquées, les traces GPS et supprimez les métadatas pour sécuriser vos images',
      videoRecorder: 'Enregistreur Écran & WebCam',
      videoRecorderDesc: 'Enregistrez votre écran, capturez le flux microphone et incrustez la webcam en haute définition',
      caseConverter: 'Convertisseur de Cas & Texte',
      caseConverterDesc: 'Structurez les styles de texte, modifiez la casse, nettoyez les espaces et analysez en temps réel',
      loremGenerator: 'Générateur de Lorem Ipsum',
      loremGeneratorDesc: 'Générer du texte de remplissage lorem ipsum personnalisable, listes, phrases, maquettes HTML ou images fictives hors ligne',
      imageCropper: 'Outil de Recadrage & Redimensionnement',
      imageCropperDesc: 'Recadrez des photos, ajustez les rapports d\'aspect, redimensionnez par pixels et équilibrez localement la résolution',
      dateCalculator: 'Calculateur de Date & Heure',
      dateCalculatorDesc: 'Calculez la différence entre dates, ajoutez ou soustrayez des intervalles, comptez les jours ouvrables et convertissez les fuseaux horaires',
    },
    settings: {
      title: 'Esthétique du Système',
      presets: 'PRÉRÉGLAGES v2',
      systemTheme: 'Préférence Système',
      language: 'Langue de l\'interface',
      selectLanguage: 'Choisir la langue',
      english: 'English (US)',
      spanish: 'Español (ES)',
      french: 'Français (FR)',
      german: 'Deutsch (DE)',
      portuguese: 'Português (PT)',
    },
    dashboard: {
      welcome: 'ACCÈS COMMANDEMENT APEX',
      subtitle: 'Terminal de Contrôle Système pour la Forge Professionnelle de Documents et Opérations Médias',
      latency: 'LATENCE SYSTÈME',
      memory: 'ALLOCATION DE MÉMOIRE',
      systemClean: 'NOYAU UTILITAIRE',
      fileLimit: 'TAMPON DE CHARGE',
      activeSessions: 'ENVELOPPE SÉCURISÉE',
      activityStatus: 'MOTEUR CENTRAL',
      toolsTitle: 'SUITE OPÉRATIONNELLE MATÉRIELLE',
      launchTool: 'DIRECTIVE D\'INITIALISATION',
    },
    common: {
      searchPlaceholder: 'RECHERCHER APEX...',
      themeLabel: 'Thème',
      save: 'Enregistrer',
      copy: 'Copier',
      download: 'Télécharger',
      error: 'Erreur',
      success: 'Succès',
    }
  },
  de: {
    navigation: {
      dashboard: 'Kontrollzentrum',
      dashboardDesc: 'Betriebszentrum',
      compressPdf: 'PDF-Schmiede',
      compressPdfDesc: 'Optimierungs-Engine',
      joinPdf: 'PDF-Joiner',
      joinPdfDesc: 'Seiten neu anordnen',
      imageToPdf: 'Bild in PDF',
      imageToPdfDesc: 'Zusammenführen & Konvertieren',
      webpConverter: 'Medien-Lab',
      webpConverterDesc: 'Bildkonverter',
      jsonBeautifier: 'JSON-Kern',
      jsonBeautifierDesc: 'Datenverfeinerer',
      sitemapSeo: 'SEO-Crawler',
      sitemapSeoDesc: 'Sitemap-Analysator',
      aiWriter: 'KI-Schreiber',
      aiWriterDesc: 'Dokumenten-Schreiber',
      passwordGenerator: 'Schlüsseltresor',
      passwordGeneratorDesc: 'Sicherer Passwortgenerator',
      qrGenerator: 'QR-Signal-Generator',
      qrGeneratorDesc: 'Sicherer QR-Code-Compiler',
      imageVectorizer: 'Bild-Vektorisierer',
      imageVectorizerDesc: 'Konvertieren Sie PNG/JPG in skalierbare SVGs',
      codeSnapshot: 'Code-Snapshot',
      codeSnapshotDesc: 'Schöne Code-Bilder erstellen',
      privateSketchpad: 'Skizzenblock & Diagramme',
      privateSketchpadDesc: 'Lokale, sichere Zeichenfläche',
      unitConverter: 'Einheiten-Konverter',
      unitConverterDesc: 'Präziser metrischer Einheitenrechner',
      svgRasterizer: 'SVG-Rasterisierer',
      svgRasterizerDesc: 'SVG-Vektoren in hochauflösende Bilder umwandeln',
      batchProcessor: 'Stapel-Verarbeiter',
      batchProcessorDesc: 'Mehrere Dateien gleichzeitig verändern und komprimieren',
      jsonDiff: 'JSON-Vergleicher',
      jsonDiffDesc: 'Zwei JSON-Objekte nebeneinander vergleichen',
      secureHash: 'Hash-Tresor',
      secureHashDesc: 'Erzeugen Sie sichere kryptografische MD5-, SHA-1-, SHA-256- und SHA-512-Hashes',
      colorPalette: 'Farbpalette',
      colorPaletteDesc: 'Generieren Sie harmonische Farbschemata und extrahieren Sie Markenfarben aus Bildern',
      digitalSignature: 'Digitale Signatur',
      digitalSignatureDesc: 'Erstellen, Vorschauen und Herunterladen von gezeichneten oder getippten Signaturen',
      seoOptimizer: 'SEO-Content-Optimierer',
      seoOptimizerDesc: 'Analysieren Sie Keyword-Dichte, Lesbarkeit und Meta-Beschreibungen in Echtzeit',
      base64Converter: 'Base64-Kodierer/Dekodierer',
      base64ConverterDesc: 'Dateien, Bilder oder Texte in Base64 umwandeln mit Code-Exporten',
      regexTester: 'Regex-Tester & Validador',
      regexTesterDesc: 'Reguläre Ausdrücke in Echtzeit testen, anpassen und Capture-Gruppen analysieren',
      csvJsonConverter: 'CSV ⇄ JSON Konverter',
      csvJsonConverterDesc: 'Konvertieren Sie CSV- und JSON-Dateien oder Texte mit Live-Vorschau',
      imageCompressor: 'Bildkomprimierer',
      imageCompressorDesc: 'Komprimieren und verkleinern Sie JPEG-, PNG- und WebP-Bilder mit Reduktionsstatistiken',
      richTextStats: 'Textstatistiken',
      richTextStatsDesc: 'Analysieren Sie Zeichen-, Wort-, Satz- und Lesbarkeitsmetriken für Texteingaben in Echtzeit',
      audioTrimmer: 'Audio-Trimmer',
      audioTrimmerDesc: 'Laden Sie Audiodateien hoch, visualisieren Sie sie, hören Sie sie an und schneiden Sie sie lokal als WAV',
      aiTranscriber: 'KI-Audio-Sprechtext',
      aiTranscriberDesc: 'Laden Sie Dateien hoch und nutzen Sie Gemini, um Sprache in zeitcodierte SRT- oder TXT-Blöcke zu transkribieren',
      pdfAnalyst: 'KI PDF & Dokument Q&A',
      pdfAnalystDesc: 'Laden Sie PDF-Dateien und Dokumente hoch und und führen Sie intelligente Dialoge mit ihnen',
      exifStripper: 'EXIF Metadaten Inspektor',
      exifStripperDesc: 'Analysieren Sie versteckte EXIF Header, GPS-Spuren und entfernen Sie binäre Metadaten für maximalen Datenschutz',
      videoRecorder: 'Bildschirm & Webcam Recorder',
      videoRecorderDesc: 'Bildschirme aufnehmen, Mikrofon-Eingänge erfassen und Webcam-Streams in hoher Auflösung überlagern',
      caseConverter: 'Schreibweise-Konverter',
      caseConverterDesc: 'Textformate anpassen, Groß-/Kleinschreibung konvertieren, überflüssige Leerzeichen säubern und Statistiken messen',
      loremGenerator: 'Lorem Ipsum Generator',
      loremGeneratorDesc: 'Generieren Sie anpassbare Lorem Ipsum Platzhaltertexte, Listen, Sätze, HTML-Mockups oder Bild-Platzhalter offline',
      imageCropper: 'Bildzuschneider & Skalierer',
      imageCropperDesc: 'Bilder zuschneiden, Seitenverhältnisse anpassen, Pixelgrößen ändern und Canvas-Auflösungen vollständig offline optimieren',
      dateCalculator: 'Zeit- & Datumsrechner',
      dateCalculatorDesc: 'Berechnen Sie Differenzen zwischen Daten, addieren/subtrahieren Sie Intervalle, zählen Sie Werktage und konvertieren Sie Zeitzonen offline',
    },
    settings: {
      title: 'System-Ästhetik',
      presets: 'VOREINSTELLUNGEN v2',
      systemTheme: 'System-Präferenz',
      language: 'Schnittstellensprache',
      selectLanguage: 'Sprache auswählen',
      english: 'English (US)',
      spanish: 'Español (ES)',
      french: 'Français (FR)',
      german: 'Deutsch (DE)',
      portuguese: 'Português (PT)',
    },
    dashboard: {
      welcome: 'APEX-BEFEHLSZUGRIFF',
      subtitle: 'System-Kontrollterminal für professionelle Dokumentschmiede und Medien-Operationen',
      latency: 'SYSTEMVERZÖGERUNG',
      memory: 'SPEICHERZUTEILUNG',
      systemClean: 'REINIGUNGSGERÄT',
      fileLimit: 'NUTZLAST-BUFFER',
      activeSessions: 'SICHERE BRIEFHÜLLE',
      activityStatus: 'KERN-ENGINE',
      toolsTitle: 'HARDWARE-BETRIEBS-SUITE',
      launchTool: 'INITIALISIERUNGSANWEISUNG',
    },
    common: {
      searchPlaceholder: 'APEX SUCHEN...',
      themeLabel: 'Thema',
      save: 'Speichern',
      copy: 'Kopieren',
      download: 'Herunterladen',
      error: 'Fehler',
      success: 'Erfolgreich',
    }
  },
  pt: {
    navigation: {
      dashboard: 'Painel de Controle',
      dashboardDesc: 'Central de Operações',
      compressPdf: 'Forja PDF',
      compressPdfDesc: 'Motor de Otimização',
      joinPdf: 'Unificador PDF',
      joinPdfDesc: 'Reordenar Páginas',
      imageToPdf: 'Imagem para PDF',
      imageToPdfDesc: 'Mesclar e Converter',
      webpConverter: 'Laboratório de Mídia',
      webpConverterDesc: 'Conversor Imagem',
      jsonBeautifier: 'Núcleo JSON',
      jsonBeautifierDesc: 'Formatador de Dados',
      sitemapSeo: 'Rastreador SEO',
      sitemapSeoDesc: 'Analisador de Sitemap',
      aiWriter: 'Escritor IA',
      aiWriterDesc: 'Motor de Redação',
      passwordGenerator: 'Cofre de Senhas',
      passwordGeneratorDesc: 'Gerador de Senhas Seguras',
      qrGenerator: 'Gerador de QR',
      qrGeneratorDesc: 'Compilador de Códigos QR',
      imageVectorizer: 'Vetorizador de Imagem',
      imageVectorizerDesc: 'Converter PNG/JPG para SVG escalável',
      codeSnapshot: 'Captura de Código',
      codeSnapshotDesc: 'Beautify e capturar layouts de código',
      privateSketchpad: 'Esboço & Diagramas',
      privateSketchpadDesc: 'Célula de diagramação local segura',
      unitConverter: 'Conversor de Unidades',
      unitConverterDesc: 'Mestre de Conversão Métrica',
      svgRasterizer: 'Rasterizador SVG',
      svgRasterizerDesc: 'Converter Vetores SVG para Imagens HD',
      batchProcessor: 'Processador de Lote',
      batchProcessorDesc: 'Transformar Várias Imagens em Paralelo',
      jsonDiff: 'Comparador JSON',
      jsonDiffDesc: 'Comparar dois objetos JSON lado a lado',
      secureHash: 'Cofre de Hashes',
      secureHashDesc: 'Gerar hashes criptográficos seguros MD5, SHA-1, SHA-256 e SHA-512',
      colorPalette: 'Paleta de Cores',
      colorPaletteDesc: 'Gerar esquemas de cores harmoniosas e extrair cores de marcas a partir de imagens',
      digitalSignature: 'Assinatura Digital',
      digitalSignatureDesc: 'Criar, visualizar e baixar assinaturas desenhadas ou de texto',
      seoOptimizer: 'Otimizador de Conteúdo SEO',
      seoOptimizerDesc: 'Analise densidade de palavras-chave, legibilidade e meta-descrições em tempo real',
      base64Converter: 'Codificador/Decodificador Base64',
      base64ConverterDesc: 'Converta arquivos, imagens ou textos em Base64 com exportação de código',
      regexTester: 'Validador e Testador Regex',
      regexTesterDesc: 'Valide e depure expressões regulares com realce em tempo real e grupos de captura',
      csvJsonConverter: 'Conversor CSV ⇄ JSON',
      csvJsonConverterDesc: 'Converta arquivos ou textos entre CSV e JSON com visualizações interativas',
      imageCompressor: 'Compressor de Imagens',
      imageCompressorDesc: 'Comprima e redimensione imagens JPEG, PNG e WebP com métricas de redução',
      richTextStats: 'Estatísticas de Texto',
      richTextStatsDesc: 'Analise métricas detalhadas de caracteres, palavras, frases e legibilidade em tempo real',
      audioTrimmer: 'Cortador de Áudio',
      audioTrimmerDesc: 'Carregue, visualize, ouça e corte arquivos de áudio localmente e baixe como WAV',
      aiTranscriber: 'Transcrito de Áudio IA',
      aiTranscriberDesc: 'Faça upload de arquivos e use a IA do Gemini para transcrever fala em formatos SRT ou TXT com tempos marcados',
      pdfAnalyst: 'Conversar com PDF IA',
      pdfAnalystDesc: 'Faça upload de PDFs ou documentos e faça perguntas inteligentes para analisar o conteúdo em tempo real',
      exifStripper: 'Inspector e Removedor de EXIF',
      exifStripperDesc: 'Analise metadados EXIF ocultos, coordenadas GPS e limpe assinaturas para proteger sua privacidade',
      videoRecorder: 'Gravador de Tela e Câmera',
      videoRecorderDesc: 'Grave transmissões de tela de desktop, áudios de microfone e sobreponha streams de webcam em HD',
      caseConverter: 'Conversor de Maiúsculas/Minúsculas',
      caseConverterDesc: 'Formate estilos de texto, alterne caixa de letras, limpe espaços redundantes e meça métricas de texto',
      loremGenerator: 'Gerador de Lorem Ipsum',
      loremGeneratorDesc: 'Gere textos de preenchimento lorem ipsum customizáveis, listas, frases, layouts HTML ou imagens mockups offline',
      imageCropper: 'Cortador e Redimensionador de Imagens',
      imageCropperDesc: 'Corte imagens, ajuste proporções de tela, mude dimensões de pixels e equilibre resoluções localmente',
      dateCalculator: 'Calculadora de Data e Hora',
      dateCalculatorDesc: 'Calcule a diferença entre datas, adicione ou subtraia períodos, conte dias úteis e converta fusos horários offline',
    },
    settings: {
      title: 'Estética do Sistema',
      presets: 'AJUSTES v2',
      systemTheme: 'Preferência do Sistema',
      language: 'Idioma da Interface',
      selectLanguage: 'Selecionar idioma',
      english: 'English (US)',
      spanish: 'Español (ES)',
      french: 'Français (FR)',
      german: 'Deutsch (DE)',
      portuguese: 'Português (PT)',
    },
    dashboard: {
      welcome: 'ACESSO DE COMANDO APEX',
      subtitle: 'Terminal de Controle do Sistema para Forja Profissional de Documentos e Operações de Mídia',
      latency: 'LATÊNCIA DO SISTEMA',
      memory: 'ALOCAÇÃO DE MEMÓRIA',
      systemClean: 'NÚCLEO UTILITÁRIO',
      fileLimit: 'BUFFER DE CARGA',
      activeSessions: 'ENVELOPE SEGURO',
      activityStatus: 'MOTOR PRINCIPAL',
      toolsTitle: 'CONJUNTO DE HARDWARE DE OPERAÇÕES',
      launchTool: 'DIRETRIZ DE INICIALIZAÇÃO',
    },
    common: {
      searchPlaceholder: 'BUSCAR APEX...',
      themeLabel: 'Tema',
      save: 'Salvar',
      copy: 'Copiar',
      download: 'Baixar',
      error: 'Erro',
      success: 'Sucesso',
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('apex_language');
    if (saved && ['en', 'es', 'fr', 'de', 'pt'].includes(saved)) {
      return saved as Language;
    }
    // Access browser preferred language
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'es', 'fr', 'de', 'pt'].includes(browserLang)) {
      return browserLang as Language;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('apex_language', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
