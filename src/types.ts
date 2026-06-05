export type ActiveTab = 'dashboard' | 'compress-pdf' | 'webp-converter' | 'json-beautifier' | 'sitemap-seo' | 'image-to-pdf' | 'join-pdf';

export interface PDFFileState {
  name: string;
  size: number;
  type: string;
  progress: number;
  stage: 'idle' | 'uploading' | 'optimizing' | 'analyzing' | 'complete' | 'error';
  originalSizeStr: string;
  compressedSizeStr: string;
  compressedBlobUrl?: string;
  error?: string;
}

export interface WebPConverterState {
  file: File | null;
  previewUrl: string | null;
  outputFormat: 'jpg' | 'png';
  quality: number; // 1 to 100
  isProcessing: boolean;
  downloadUrl: string | null;
  originalSizeStr: string;
  convertedSizeStr: string;
}

export interface JSONBeautifierState {
  rawInput: string;
  beautifiedOutput: string;
  tabSize: 2 | 4 | 'tab';
  isValid: boolean | null;
  errorMessage: string | null;
}
