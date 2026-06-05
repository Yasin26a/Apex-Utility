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
