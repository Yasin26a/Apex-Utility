import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SettingsPreset {
  id: string;
  name: string;
  isCustom: boolean;
  createdAt: string;
  settings: {
    // WebP Converter Settings
    webpQuality: number;
    webpFormat: 'png' | 'jpg' | 'webp';
    webpAutoCompress: boolean;
    webpTargetSizeKb: number;

    // Image to PDF Settings
    pdfPageSize: 'A4' | 'letter' | 'fit';
    pdfOrientation: 'portrait' | 'landscape' | 'auto';
    pdfMargin: 'none' | 'small' | 'medium' | 'large';
    pdfStretchMode: 'fit' | 'fill' | 'original';
    pdfQuality: number;
    pdfWatermarkType: 'none' | 'text';
    pdfWatermarkText: string;
    pdfWatermarkColor: string;
    pdfWatermarkOpacity: number;
    pdfWatermarkPosition: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

    // Password Generator Settings
    passwordGenMode: 'random' | 'passphrase';
    passwordLength: number;
    passwordWordCount: number;
    passwordIncludeUppercase: boolean;
    passwordIncludeLowercase: boolean;
    passwordIncludeNumbers: boolean;
    passwordIncludeSymbols: boolean;
    passwordCustomSymbols: string;
    passwordExcludedChars: string;
    passwordSeparator: string;
    passwordCapitalizeWords: boolean;
    passwordAddNumber: boolean;

    // QR Generator Settings
    qrMode: 'text' | 'url' | 'wifi' | 'email' | 'sms';
    qrErrorCorrection: 'L' | 'M' | 'Q' | 'H';
    qrForeColor: string;
    qrBgColor: string;
    qrSize: number;
    qrWithMargin: boolean;
    qrWifiSsid: string;
    qrWifiPass: string;
    qrWifiSecurity: 'WPA' | 'WEP' | 'nopass';
    qrEmailTo: string;
    qrEmailSubject: string;
    qrEmailBody: string;
    qrSmsPhone: string;
    qrSmsMessage: string;

    // Unit Converter Settings
    converterCategory?: 'length' | 'weight' | 'volume' | 'temperature';
    converterFromUnit?: string;
    converterToUnit?: string;
    converterInputValue?: number;

    // SVG Rasterizer Settings
    svgInput?: string;
    svgWidth?: number;
    svgHeight?: number;
    svgScale?: number;
    svgOutputFormat?: 'png' | 'jpg' | 'webp';
    svgBgColor?: string;
  };
}

// Beautiful standard presets configured based on real-world use cases
export const defaultPresets: SettingsPreset[] = [
  {
    id: 'preset-steel-ultra',
    name: 'Steel Ultra-HQ',
    isCustom: false,
    createdAt: new Date('2026-06-01').toISOString(),
    settings: {
      webpQuality: 95,
      webpFormat: 'png',
      webpAutoCompress: false,
      webpTargetSizeKb: 1000,
      pdfPageSize: 'letter',
      pdfOrientation: 'auto',
      pdfMargin: 'none',
      pdfStretchMode: 'fit',
      pdfQuality: 0.95,
      pdfWatermarkType: 'none',
      pdfWatermarkText: 'APEX ULTRA',
      pdfWatermarkColor: '#2563eb',
      pdfWatermarkOpacity: 0.2,
      pdfWatermarkPosition: 'center',
      passwordGenMode: 'random',
      passwordLength: 24,
      passwordWordCount: 4,
      passwordIncludeUppercase: true,
      passwordIncludeLowercase: true,
      passwordIncludeNumbers: true,
      passwordIncludeSymbols: true,
      passwordCustomSymbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      passwordExcludedChars: 'l1Io0O',
      passwordSeparator: '-',
      passwordCapitalizeWords: true,
      passwordAddNumber: true,
      qrMode: 'url',
      qrErrorCorrection: 'Q',
      qrForeColor: '#000000',
      qrBgColor: '#ffffff',
      qrSize: 400,
      qrWithMargin: true,
      qrWifiSsid: '',
      qrWifiPass: '',
      qrWifiSecurity: 'WPA',
      qrEmailTo: '',
      qrEmailSubject: '',
      qrEmailBody: '',
      qrSmsPhone: '',
      qrSmsMessage: '',
    },
  },
  {
    id: 'preset-ats-blueprint',
    name: 'ATS Resume Blueprint',
    isCustom: false,
    createdAt: new Date('2026-06-02').toISOString(),
    settings: {
      webpQuality: 80,
      webpFormat: 'jpg',
      webpAutoCompress: true,
      webpTargetSizeKb: 300,
      pdfPageSize: 'letter',
      pdfOrientation: 'portrait',
      pdfMargin: 'small',
      pdfStretchMode: 'original',
      pdfQuality: 0.75,
      pdfWatermarkType: 'none',
      pdfWatermarkText: 'CONFIDENTIAL',
      pdfWatermarkColor: '#e11d48',
      pdfWatermarkOpacity: 0.15,
      pdfWatermarkPosition: 'bottom-right',
      passwordGenMode: 'random',
      passwordLength: 16,
      passwordWordCount: 4,
      passwordIncludeUppercase: true,
      passwordIncludeLowercase: true,
      passwordIncludeNumbers: true,
      passwordIncludeSymbols: false,
      passwordCustomSymbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      passwordExcludedChars: 'l1Io0O',
      passwordSeparator: '-',
      passwordCapitalizeWords: true,
      passwordAddNumber: true,
      qrMode: 'text',
      qrErrorCorrection: 'M',
      qrForeColor: '#1e3a8a',
      qrBgColor: '#f8fafc',
      qrSize: 400,
      qrWithMargin: true,
      qrWifiSsid: '',
      qrWifiPass: '',
      qrWifiSecurity: 'WPA',
      qrEmailTo: '',
      qrEmailSubject: '',
      qrEmailBody: '',
      qrSmsPhone: '',
      qrSmsMessage: '',
    },
  },
  {
    id: 'preset-compact-pdf',
    name: 'Compact Draft Payload',
    isCustom: false,
    createdAt: new Date('2026-06-03').toISOString(),
    settings: {
      webpQuality: 60,
      webpFormat: 'webp',
      webpAutoCompress: true,
      webpTargetSizeKb: 150,
      pdfPageSize: 'A4',
      pdfOrientation: 'auto',
      pdfMargin: 'medium',
      pdfStretchMode: 'fit',
      pdfQuality: 0.5,
      pdfWatermarkType: 'text',
      pdfWatermarkText: 'DRAFT COPY',
      pdfWatermarkColor: '#6b7280',
      pdfWatermarkOpacity: 0.3,
      pdfWatermarkPosition: 'center',
      passwordGenMode: 'passphrase',
      passwordLength: 12,
      passwordWordCount: 4,
      passwordIncludeUppercase: true,
      passwordIncludeLowercase: true,
      passwordIncludeNumbers: true,
      passwordIncludeSymbols: true,
      passwordCustomSymbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      passwordExcludedChars: '',
      passwordSeparator: '-',
      passwordCapitalizeWords: true,
      passwordAddNumber: true,
      qrMode: 'wifi',
      qrErrorCorrection: 'H',
      qrForeColor: '#111827',
      qrBgColor: '#ffffff',
      qrSize: 400,
      qrWithMargin: true,
      qrWifiSsid: 'APEX_SECURE_WIFI',
      qrWifiPass: 'EnterpriseStandard99',
      qrWifiSecurity: 'WPA',
      qrEmailTo: '',
      qrEmailSubject: '',
      qrEmailBody: '',
      qrSmsPhone: '',
      qrSmsMessage: '',
    },
  },
];

interface PresetContextType {
  presets: SettingsPreset[];
  activePresetId: string | null;
  activeSettings: SettingsPreset['settings'];
  updateActiveSettings: (updater: Partial<SettingsPreset['settings']> | ((prev: SettingsPreset['settings']) => SettingsPreset['settings'])) => void;
  loadPreset: (id: string) => void;
  saveNewPreset: (name: string) => void;
  deletePreset: (id: string) => void;
}

const PresetContext = createContext<PresetContextType | undefined>(undefined);

export const PresetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load custom presets from localStorage or default to empty array
  const [customPresets, setCustomPresets] = useState<SettingsPreset[]>(() => {
    try {
      const saved = localStorage.getItem('apex_custom_presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    return localStorage.getItem('apex_active_preset_id');
  });

  // Keep track of active parameters state
  const [activeSettings, setActiveSettings] = useState<SettingsPreset['settings']>(() => {
    try {
      const savedActive = localStorage.getItem('apex_active_settings');
      if (savedActive) {
        return { ...defaultPresets[0].settings, ...JSON.parse(savedActive) };
      }
    } catch {}

    // Fallback to "Steel Ultra-HQ" settings initially
    return { ...defaultPresets[0].settings };
  });

  // Combine default built-in presets and user custom presets
  const presets = [...defaultPresets, ...customPresets];

  // Persist custom presets whenever they change
  useEffect(() => {
    localStorage.setItem('apex_custom_presets', JSON.stringify(customPresets));
  }, [customPresets]);

  // Persist active settings and active preset ID when they change
  useEffect(() => {
    localStorage.setItem('apex_active_settings', JSON.stringify(activeSettings));
    if (activePresetId) {
      localStorage.setItem('apex_active_preset_id', activePresetId);
    } else {
      localStorage.removeItem('apex_active_preset_id');
    }
  }, [activeSettings, activePresetId]);

  const updateActiveSettings = (
    updater: Partial<SettingsPreset['settings']> | ((prev: SettingsPreset['settings']) => SettingsPreset['settings'])
  ) => {
    setActiveSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      // Check if the current settings exactly match any existing preset. If not, reset activePresetId to null
      const matched = presets.find((p) => {
        return JSON.stringify(p.settings) === JSON.stringify(next);
      });
      setActivePresetId(matched ? matched.id : null);
      return next;
    });
  };

  const loadPreset = (id: string) => {
    const target = presets.find((p) => p.id === id);
    if (target) {
      setActiveSettings({ ...target.settings });
      setActivePresetId(id);
    }
  };

  const saveNewPreset = (name: string) => {
    const sanitizedName = name.trim() || `Preset #${customPresets.length + 1}`;
    const newPreset: SettingsPreset = {
      id: `preset-custom-${Date.now()}`,
      name: sanitizedName,
      isCustom: true,
      createdAt: new Date().toISOString(),
      settings: { ...activeSettings },
    };

    setCustomPresets((prev) => [...prev, newPreset]);
    setActivePresetId(newPreset.id);
  };

  const deletePreset = (id: string) => {
    const isTargetCustom = customPresets.some((p) => p.id === id);
    if (!isTargetCustom) return; // built-in presets cannot be deleted

    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
    if (activePresetId === id) {
      setActivePresetId(null);
    }
  };

  return (
    <PresetContext.Provider
      value={{
        presets,
        activePresetId,
        activeSettings,
        updateActiveSettings,
        loadPreset,
        saveNewPreset,
        deletePreset,
      }}
    >
      {children}
    </PresetContext.Provider>
  );
};

export const usePresets = () => {
  const context = useContext(PresetContext);
  if (!context) {
    throw new Error('usePresets must be used within a PresetProvider');
  }
  return context;
};
