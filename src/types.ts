export type ActiveTab = 'dashboard' | 'compress-pdf' | 'webp-converter' | 'json-beautifier' | 'sitemap-seo' | 'image-to-pdf' | 'join-pdf' | 'ai-writer' | 'password-generator' | 'qr-generator' | 'unit-converter' | 'svg-rasterizer' | 'batch-processor' | 'json-diff' | 'secure-hash' | 'color-palette' | 'digital-signature' | 'seo-optimizer' | 'base64-converter' | 'regex-tester' | 'csv-json-converter' | 'image-compressor' | 'rich-text-stats' | 'audio-trimmer' | 'ai-transcriber' | 'pdf-analyst' | 'exif-stripper' | 'video-recorder' | 'image-vectorizer' | 'code-snapshot' | 'private-sketchpad' | 'case-converter' | 'lorem-generator' | 'image-cropper' | 'date-calculator' | 'privacy-policy' | 'terms-of-service' | 'about-us' | 'guides';

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
  outputFormat: 'jpg' | 'png' | 'gif';
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
