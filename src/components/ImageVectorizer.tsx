import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileImage, Download, Copy, Trash2, Sliders, ToggleLeft, Sparkles, 
  RefreshCcw, Grid, Maximize2, ShieldCheck, HelpCircle, AlertCircle, Palette, Check, Layers, Image as ImageIcon
} from 'lucide-react';
import { addRecentOperation } from '../utils/recentOperations';
import { usePresets } from '../context/PresetContext';

interface Point {
  x: number;
  y: number;
}

interface Triangle {
  p1: Point;
  p2: Point;
  p3: Point;
  color: string;
}

export default function ImageVectorizer() {
  const { activeSettings, updateActiveSettings } = usePresets();

  // Primary operational states
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Vectorization mode: 'silhouette' | 'lowpoly' | 'halftone' | 'pixelart'
  const [vectorMode, setVectorMode] = useState<'silhouette' | 'lowpoly' | 'halftone' | 'pixelart'>('silhouette');
  
  // Controls & parameters
  const [silhouetteThreshold, setSilhouetteThreshold] = useState<number>(128);
  const [silhouetteInvert, setSilhouetteInvert] = useState<boolean>(false);
  const [silhouetteColor, setSilhouetteColor] = useState<string>('#000000');
  const [silhouetteBgColor, setSilhouetteBgColor] = useState<string>('#ffffff');
  const [smoothingLevel, setSmoothingLevel] = useState<number>(2); // RDP simplification tolerance or smoothing
  const [useBezierCurves, setUseBezierCurves] = useState<boolean>(true); // Bezier spline curve fitting toggle

  // Low-poly controls
  const [polyGridSize, setPolyGridSize] = useState<number>(30); // division count
  const [polyJitter, setPolyJitter] = useState<number>(60); // randomness %
  const [polyStroke, setPolyStroke] = useState<boolean>(false);
  const [polyStrokeColor, setPolyStrokeColor] = useState<string>('#1e1b4b');

  // Halftone controls
  const [halftoneSpacing, setHalftoneSpacing] = useState<number>(10);
  const [halftoneMaxRadius, setHalftoneMaxRadius] = useState<number>(6);
  const [halftoneType, setHalftoneType] = useState<'bw' | 'color' | 'eccentric'>('color');
  const [halftoneShape, setHalftoneShape] = useState<'circle' | 'square' | 'triangle'>('circle');

  // Pixel art tracer controls
  const [pixelResolution, setPixelResolution] = useState<number>(48); // width of grid
  const [pixelShape, setPixelShape] = useState<'rect' | 'circle' | 'squircle'>('rect');
  const [pixelColorCount, setPixelColorCount] = useState<number>(8); // Quantization

  // Output SVG result
  const [svgOutput, setSvgOutput] = useState<string>('');
  const [svgCopied, setSvgCopied] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Compare split/slider states
  const [compareMode, setCompareMode] = useState<'single' | 'split' | 'sidebyside'>('split');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // Drag and drop states
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Refs for tracking original image
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Global drag handler for compare slider
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDragging || !sliderRef.current || !e.touches[0]) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };

    const handleGlobalUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('touchmove', handleGlobalTouchMove);
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchend', handleGlobalUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDragging]);

  // ----------------------------------------------------
  // FILE SELECTION AND LOADERS
  // ----------------------------------------------------
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG, JPEG, WEBP)', 'error');
      return;
    }
    setImageName(file.name.replace(/\.[^/.]+$/, ''));
    setProcessingError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSourceImage(e.target.result as string);
        showToast('Image loaded successfully. Ready to vectorize!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleClearImage = () => {
    setSourceImage(null);
    setImageName('');
    setSvgOutput('');
    setProcessingError(null);
    showToast('Source cleared', 'info');
  };

  // ----------------------------------------------------
  // CORE VECTORIZATION ENGINES (RUNNING ENTIRELY OFFLINE)
  // ----------------------------------------------------
  const runVectorization = async () => {
    if (!sourceImage || !imgRef.current) return;
    setIsProcessing(true);
    setProcessingError(null);

    // Give browser a moment to update the spinner
    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
      const img = imgRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      
      // We process the image at a stable resolution to keep vectorization fast yet crisp
      // Silhouette and pixel-art use relative downscaling, lowpoly/halftone can leverage high details
      let targetWidth = img.naturalWidth;
      let targetHeight = img.naturalHeight;

      const maxDim = 800; // Cap dimension for fast pixel iterating
      if (targetWidth > maxDim || targetHeight > maxDim) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
          targetWidth = maxDim;
        } else {
          targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
          targetHeight = maxDim;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not instantiate 2d canvas rendering context');

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const pixels = imgData.data;

      let svgResult = '';

      switch (vectorMode) {
        case 'silhouette':
          svgResult = buildSilhouetteVector(pixels, targetWidth, targetHeight);
          break;
        case 'lowpoly':
          svgResult = buildLowPolyVector(pixels, targetWidth, targetHeight);
          break;
        case 'halftone':
          svgResult = buildHalftoneVector(pixels, targetWidth, targetHeight);
          break;
        case 'pixelart':
          svgResult = buildPixelArtVector(pixels, targetWidth, targetHeight);
          break;
        default:
          throw new Error('Unsupported vector mapping mode');
      }

      setSvgOutput(svgResult);
      showToast('Image successfully vectorized!', 'success');
    } catch (err: any) {
      console.error(err);
      setProcessingError(err?.message || 'Error occurred during mathematical vectorization.');
      showToast('Vector compilation aborted', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger vectorized trace whenever configurations shift
  useEffect(() => {
    if (sourceImage) {
      runVectorization();
    }
  }, [
    sourceImage, vectorMode, silhouetteThreshold, silhouetteInvert, silhouetteColor,
    silhouetteBgColor, smoothingLevel, useBezierCurves, polyGridSize, polyJitter, polyStroke, polyStrokeColor,
    halftoneSpacing, halftoneMaxRadius, halftoneType, halftoneShape, pixelResolution,
    pixelShape, pixelColorCount
  ]);

  // Handle Image load details
  const onImageLoad = () => {
    if (imgRef.current) {
      setImageWidth(imgRef.current.naturalWidth);
      setImageHeight(imgRef.current.naturalHeight);
      runVectorization();
    }
  };

  // ----------------------------------------------------
  // MODE 1: SILHOUETTE (Moore-Neighbor Contour Tracer + Douglas-Peucker)
  // ----------------------------------------------------
  const buildSilhouetteVector = (pixels: Uint8ClampedArray, w: number, h: number): string => {
    // 1. Create a binary grid representation
    const grid = new Uint8Array(w * h);
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // Standard contrast luminance weights
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const isOpaque = a > 50;
      
      let val = 0;
      if (isOpaque) {
        val = luminance < silhouetteThreshold ? 1 : 0;
      } else {
        // Transparent is considered "white" background
        val = 0;
      }

      if (silhouetteInvert) {
        val = val === 1 ? 0 : 1;
      }

      grid[i / 4] = val;
    }

    // 2. Moore-Neighbor boundary following with grid marking
    const visited = new Uint8Array(w * h);
    const paths: Point[][] = [];

    // Moore-Neighbor directions: Clockwise starting from North-West
    const dx = [-1, 0, 1, 1, 1, 0, -1, -1];
    const dy = [-1, -1, -1, 0, 1, 1, 1, 0];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        // Find a starting point: unvisited black pixel border
        if (grid[idx] === 1 && visited[idx] === 0) {
          // Verify it's a boundary pixel (has a white neighbor)
          let isBoundary = false;
          for (let d = 0; d < 8; d++) {
            const nx = x + dx[d];
            const ny = y + dy[d];
            if (grid[ny * w + nx] === 0) {
              isBoundary = true;
              break;
            }
          }

          if (isBoundary) {
            // Found a shape border! Trace it.
            const contour = traceContour(x, y, grid, visited, w, h, dx, dy);
            if (contour.length > 2) {
              // Apply Douglas-Peucker simplification based on chosen smoothing
              const simplified = simplifyPath(contour, smoothingLevel * 0.35);
              paths.push(simplified);
            }
          }
        }
      }
    }

    // Generate output SVG raw string
    let pathTags = '';
    paths.forEach(p => {
      if (p.length === 0) return;
      let d = '';
      if (useBezierCurves && smoothingLevel > 0 && p.length >= 3) {
        // Curve Interpolation across midpoints of simplified vertices (for beautiful organic rendering)
        const n = p.length;
        const midPoints = p.map((point, index) => {
          const next = p[(index + 1) % n];
          return {
            x: (point.x + next.x) / 2,
            y: (point.y + next.y) / 2
          };
        });

        // Start path at the midpoint before the first vertex
        const start = midPoints[n - 1];
        d = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`;
        
        for (let i = 0; i < n; i++) {
          const ctrl = p[i];
          const end = midPoints[i];
          d += ` Q ${ctrl.x.toFixed(1)} ${ctrl.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
        }
        d += ' Z';
      } else {
        // Fallback or explicit disabled smoothing state: Straight polygon lines
        d = `M ${p[0].x} ${p[0].y}`;
        for (let i = 1; i < p.length; i++) {
          d += ` L ${p[i].x} ${p[i].y}`;
        }
        d += ' Z';
      }
      pathTags += `<path d="${d}" fill="${silhouetteColor}" />\n`;
    });

    return `<!-- APEX Client Image Vectorizer Engine -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="105%" height="100%" style="background-color: ${silhouetteBgColor};">
  <rect width="${w}" height="${h}" fill="${silhouetteBgColor}" />
  <g id="vector-silhouette">
    ${pathTags || `<!-- No outlines were matched. Adjust Threshold slider -->`}
  </g>
</svg>`;
  };

  // Boundary Tracer method
  const traceContour = (
    startX: number, startY: number, 
    grid: Uint8Array, visited: Uint8Array, 
    w: number, h: number,
    dx: number[], dy: number[]
  ): Point[] => {
    const pts: Point[] = [];
    let cx = startX;
    let cy = startY;
    
    // Initial enter direction
    let enterDirection = 0;
    let started = false;

    // Safety loops threshold to prevent infinite hangs in nested arrays
    let iterations = 0;
    const maxIterations = 8000;

    while (iterations < maxIterations) {
      iterations++;
      const currentIdx = cy * w + cx;
      visited[currentIdx] = 1; // Mark as visited in global search
      pts.push({ x: cx, y: cy });

      // Scan Moore search patterns clockwise
      let foundNext = false;
      let nextX = cx;
      let nextY = cy;
      let nextDir = 0;

      // Start search relative to search enter direction
      const startScan = (enterDirection + 5) % 8; // scan backtrack offset

      for (let i = 0; i < 8; i++) {
        const checkDir = (startScan + i) % 8;
        const tx = cx + dx[checkDir];
        const ty = cy + dy[checkDir];

        if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
          if (grid[ty * w + tx] === 1) {
            nextX = tx;
            nextY = ty;
            nextDir = checkDir;
            foundNext = true;
            break;
          }
        }
      }

      if (!foundNext) break;

      // Check if we looped back to origin point
      if (started && nextX === startX && nextY === startY) {
        break;
      }

      started = true;
      cx = nextX;
      cy = nextY;
      enterDirection = nextDir;
    }

    return pts;
  };

  // Douglas-Peucker Polygon Approximation algorithm for smoothing vector lines
  const simplifyPath = (points: Point[], epsilon: number): Point[] => {
    if (points.length <= 2 || epsilon <= 0) return points;

    let dmax = 0;
    let index = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
      const d = getPerpendicularDistance(points[i], points[0], points[end]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }

    if (dmax > epsilon) {
      const recResults1 = simplifyPath(points.slice(0, index + 1), epsilon);
      const recResults2 = simplifyPath(points.slice(index), epsilon);
      return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
    } else {
      return [points[0], points[end]];
    }
  };

  const getPerpendicularDistance = (p: Point, p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (dx === 0 && dy === 0) {
      return Math.sqrt((p.x - p1.x) ** 2 + (p.y - p1.y) ** 2);
    }
    const num = Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x);
    const den = Math.sqrt(dx ** 2 + dy ** 2);
    return num / den;
  };

  // ----------------------------------------------------
  // MODE 2: LOW-POLY / TRIANGULATION MESH
  // Generates edge vertices + Jitter grid + Delaunay rendering
  // ----------------------------------------------------
  const buildLowPolyVector = (pixels: Uint8ClampedArray, w: number, h: number): string => {
    // 1. Set grid parameters
    const size = polyGridSize;
    const cols = Math.max(8, Math.round(w / size));
    const rows = Math.max(8, Math.round(h / size));
    const cellW = w / cols;
    const cellH = h / rows;

    const vertices: Point[][] = [];

    // Sobel filters for highlighting key visual details/borders
    const contrastMap = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y += 2) {
      for (let x = 1; x < w - 1; x += 2) {
        const idx = y * w + x;
        // Local pixels brightness
        const getBrightness = (tx: number, ty: number) => {
          const pi = (ty * w + tx) * 4;
          return 0.299 * pixels[pi] + 0.587 * pixels[pi + 1] + 0.114 * pixels[pi + 2];
        };
        
        // Horizontal gradient
        const gx = -getBrightness(x-1, y-1) + getBrightness(x+1, y-1) 
                   -2 * getBrightness(x-1, y) + 2 * getBrightness(x+1, y)
                   -getBrightness(x-1, y+1) + getBrightness(x+1, y+1);
        // Vertical gradient
        const gy = -getBrightness(x-1, y-1) - 2 * getBrightness(x, y-1) - getBrightness(x+1, y-1)
                   +getBrightness(x-1, y+1) + 2 * getBrightness(x, y+1) + getBrightness(x+1, y+1);
        
        contrastMap[idx] = Math.sqrt(gx * gx + gy * gy);
      }
    }

    // 2. Establish grid points with customized aesthetic offsets
    for (let r = 0; r <= rows; r++) {
      const rowVertices: Point[] = [];
      const y = r * cellH;
      for (let c = 0; c <= cols; c++) {
        const x = c * cellW;

        // Keep outermost board limits absolute to seal boundaries nicely
        if (r === 0 || r === rows || c === 0 || c === cols) {
          rowVertices.push({ x: Math.min(w, Math.max(0, x)), y: Math.min(h, Math.max(0, y)) });
        } else {
          // Adjust points based on Jitter slider and local detail density!
          const pxIdx = Math.round(y) * w + Math.round(x);
          const localContrast = contrastMap[pxIdx] || 0;
          
          // Higher contrast locks vertices (for edges), lower contrast jitters widely
          const jitterCoeff = (1 - Math.min(1, localContrast / 240)) * (polyJitter / 100);
          
          const maxDx = (cellW / 2) * jitterCoeff;
          const maxDy = (cellH / 2) * jitterCoeff;
          
          // Custom pseudo-random offsets
          const dx = (Math.sin(r * 12.3 + c * 4.9) * maxDx);
          const dy = (Math.cos(c * 9.8 + r * 15.1) * maxDy);
          
          rowVertices.push({ 
            x: Math.min(w - 1, Math.max(1, x + dx)), 
            y: Math.min(h - 1, Math.max(1, y + dy)) 
          });
        }
      }
      vertices.push(rowVertices);
    }

    // 3. Assemble grid triangles + compute average centroid color
    let polySegments = '';
    
    // We sample the average color inside a mini bounding frame of the triangle
    const getTriangleAvgColor = (p1: Point, p2: Point, p3: Point): string => {
      // Find bounding box limits
      const xMin = Math.max(0, Math.round(Math.min(p1.x, p2.x, p3.x)));
      const xMax = Math.min(w - 1, Math.round(Math.max(p1.x, p2.x, p3.x)));
      const yMin = Math.max(0, Math.round(Math.min(p1.y, p2.y, p3.y)));
      const yMax = Math.min(h - 1, Math.round(Math.max(p1.y, p2.y, p3.y)));

      // Sample a quick centroid point + 3 extra offsets to average colors safely
      const cx = Math.round((p1.x + p2.x + p3.x) / 3);
      const cy = Math.round((p1.y + p2.y + p3.y) / 3);

      const pxIdx = (cy * w + cx) * 4;
      let r = pixels[pxIdx];
      let g = pixels[pxIdx + 1];
      let b = pixels[pxIdx + 2];

      // Safe checks in case of coordinates shifting out of range
      if (isNaN(r)) { r = 0; g = 0; b = 0; }

      return `rgb(${r},${g},${b})`;
    };

    // Construct grid square triangles (each square cell gets split into 2 visual triangles)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tl = vertices[r][c];
        const tr = vertices[r][c + 1];
        const bl = vertices[r + 1][c];
        const br = vertices[r + 1][c + 1];

        // Diagonal choice: change direction depending on coordinates to add mesh variety
        const diagonalDir = (r + c) % 2 === 0;

        if (diagonalDir) {
          // Triangle 1: tl-tr-bl
          const color1 = getTriangleAvgColor(tl, tr, bl);
          polySegments += `<polygon points="${tl.x.toFixed(1)},${tl.y.toFixed(1)} ${tr.x.toFixed(1)},${tr.y.toFixed(1)} ${bl.x.toFixed(1)},${bl.y.toFixed(1)}" fill="${color1}"${polyStroke ? ` stroke="${polyStrokeColor}" stroke-width="0.3"` : ` stroke="${color1}" stroke-width="0.3"`} />\n`;
          
          // Triangle 2: tr-br-bl
          const color2 = getTriangleAvgColor(tr, br, bl);
          polySegments += `<polygon points="${tr.x.toFixed(1)},${tr.y.toFixed(1)} ${br.x.toFixed(1)},${br.y.toFixed(1)} ${bl.x.toFixed(1)},${bl.y.toFixed(1)}" fill="${color2}"${polyStroke ? ` stroke="${polyStrokeColor}" stroke-width="0.3"` : ` stroke="${color2}" stroke-width="0.3"`} />\n`;
        } else {
          // Triangle 1: tl-tr-br
          const color1 = getTriangleAvgColor(tl, tr, br);
          polySegments += `<polygon points="${tl.x.toFixed(1)},${tl.y.toFixed(1)} ${tr.x.toFixed(1)},${tr.y.toFixed(1)} ${br.x.toFixed(1)},${br.y.toFixed(1)}" fill="${color1}"${polyStroke ? ` stroke="${polyStrokeColor}" stroke-width="0.3"` : ` stroke="${color1}" stroke-width="0.3"`} />\n`;
          
          // Triangle 2: tl-br-bl
          const color2 = getTriangleAvgColor(tl, br, bl);
          polySegments += `<polygon points="${tl.x.toFixed(1)},${tl.y.toFixed(1)} ${br.x.toFixed(1)},${br.y.toFixed(1)} ${bl.x.toFixed(1)},${bl.y.toFixed(1)}" fill="${color2}"${polyStroke ? ` stroke="${polyStrokeColor}" stroke-width="0.3"` : ` stroke="${color2}" stroke-width="0.3"`} />\n`;
        }
      }
    }

    return `<!-- APEX Low-Poly Mesh Triangulation Engine -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
  <rect width="${w}" height="${h}" fill="#0a0a0c" />
  <g id="low-poly-polygons" stroke-linejoin="round" stroke-linecap="round">
    ${polySegments}
  </g>
</svg>`;
  };

  // ----------------------------------------------------
  // MODE 3: HALFTONE / MATRIX GRAPHIC POSTER
  // Creates modern halftone offset dot patterns
  // ----------------------------------------------------
  const buildHalftoneVector = (pixels: Uint8ClampedArray, w: number, h: number): string => {
    let shapes = '';
    const spacing = halftoneSpacing;
    const maxR = halftoneMaxRadius;
    const isBW = halftoneType === 'bw';

    for (let y = spacing / 2; y < h; y += spacing) {
      for (let x = spacing / 2; x < w; x += spacing) {
        const pxIdx = (Math.round(y) * w + Math.round(x)) * 4;
        if (pxIdx >= pixels.length) continue;

        const r = pixels[pxIdx];
        const g = pixels[pxIdx + 1];
        const b = pixels[pxIdx + 2];
        const a = pixels[pxIdx + 3];

        if (a < 30) continue; // Skip transparency

        // Normalize pixel brightness (0 = black, 1 = white)
        const intensity = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Halftone uses inverse rule (darker areas get larger filled elements)
        const sizeFactor = 1 - intensity;
        const currentRadius = sizeFactor * maxR;

        if (currentRadius < 0.8) continue; // Skip tiny dot dust to optimize performance

        const fillColor = isBW ? '#ffffff' : `rgb(${r},${g},${b})`;
        const rotateAngle = (Math.sin(x * y) * 360).toFixed(0);

        if (halftoneShape === 'circle') {
          shapes += `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${currentRadius.toFixed(1)}" fill="${fillColor}" />\n`;
        } else if (halftoneShape === 'square') {
          const side = currentRadius * 1.7;
          shapes += `  <rect x="${(x - side/2).toFixed(1)}" y="${(y - side/2).toFixed(1)}" width="${side.toFixed(1)}" height="${side.toFixed(1)}" transform="rotate(${rotateAngle} ${x} ${y})" fill="${fillColor}" />\n`;
        } else if (halftoneShape === 'triangle') {
          const side = currentRadius * 2;
          const hDiff = (side * Math.sqrt(3)) / 6;
          const p1 = `${x.toFixed(1)},${(y - 2*hDiff).toFixed(1)}`;
          const p2 = `${(x - side/2).toFixed(1)},${(y + hDiff).toFixed(1)}`;
          const p3 = `${(x + side/2).toFixed(1)},${(y + hDiff).toFixed(1)}`;
          shapes += `  <polygon points="${p1} ${p2} ${p3}" transform="rotate(${rotateAngle} ${x} ${y})" fill="${fillColor}" />\n`;
        }
      }
    }

    const halftoneBg = isBW ? '#030712' : '#08080a';

    return `<!-- APEX Halftone Matrix Raster Vectorizer Engine -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" style="background-color: ${halftoneBg};">
  <rect width="${w}" height="${h}" fill="${halftoneBg}" />
  <g id="halftone-matrix-nodes">
    ${shapes}
  </g>
</svg>`;
  };

  // ----------------------------------------------------
  // MODE 4: PIXEL-ART VECTOR TRACER
  // Quantizes to palette and outputs crisp rectangular grids
  // ----------------------------------------------------
  const buildPixelArtVector = (pixels: Uint8ClampedArray, w: number, h: number): string => {
    // 1. Establish pixel grid downscale size
    const cols = pixelResolution;
    const cellW = w / cols;
    const rows = Math.round(h / cellW);
    const cellH = h / rows;

    let elements = '';

    // Advanced modular K-Means color quantization algorithm running locally
    // Pre-extract sample colors for centroids
    const centers: [number, number, number][] = [];
    const step = Math.floor(pixels.length / (4 * pixelColorCount));
    
    for (let c = 0; c < pixelColorCount; c++) {
      const idx = (c * step + 4) % pixels.length;
      centers.push([pixels[idx], pixels[idx+1], pixels[idx+2]]);
    }

    // Assign and re-calculate center coordinate values 3 times for crisp palette clustering
    for (let iter = 0; iter < 3; iter++) {
      const clusters: [number, number, number][] = Array.from({ length: pixelColorCount }, () => [0, 0, 0]);
      const counts = new Array(pixelColorCount).fill(0);

      for (let i = 0; i < pixels.length; i += 40) { // Subsample to maximize speed
        if (pixels[i+3] < 50) continue;
        const pr = pixels[i];
        const pg = pixels[i+1];
        const pb = pixels[i+2];

        // Find nearest centroid
        let nearestIdx = 0;
        let dMin = Infinity;
        for (let j = 0; j < pixelColorCount; j++) {
          const d = (pr - centers[j][0])**2 + (pg - centers[j][1])**2 + (pb - centers[j][2])**2;
          if (d < dMin) {
            dMin = d;
            nearestIdx = j;
          }
        }

        clusters[nearestIdx][0] += pr;
        clusters[nearestIdx][1] += pg;
        clusters[nearestIdx][2] += pb;
        counts[nearestIdx]++;
      }

      for (let j = 0; j < pixelColorCount; j++) {
        if (counts[j] > 0) {
          centers[j] = [
            Math.round(clusters[j][0] / counts[j]),
            Math.round(clusters[j][1] / counts[j]),
            Math.round(clusters[j][2] / counts[j])
          ];
        }
      }
    }

    // Trace downscaled pixelated tiles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Find center coords of block in original image coordinates
        const pxX = Math.round((c + 0.5) * cellW);
        const pxY = Math.round((r + 0.5) * cellH);
        const pixelIdx = (pxY * w + pxX) * 4;

        if (pixelIdx >= pixels.length) continue;

        const originalR = pixels[pixelIdx];
        const originalG = pixels[pixelIdx + 1];
        const originalB = pixels[pixelIdx + 2];
        const originalA = pixels[pixelIdx + 3];

        if (originalA < 50) continue; // Transparency

        // Push nearest palette color match
        let bestRGB = centers[0];
        let dBest = Infinity;
        for (let j = 0; j < centers.length; j++) {
          const d = (originalR - centers[j][0])**2 + (originalG - centers[j][1])**2 + (originalB - centers[j][2])**2;
          if (d < dBest) {
            dBest = d;
            bestRGB = centers[j];
          }
        }

        const tileColor = `rgb(${bestRGB[0]},${bestRGB[1]},${bestRGB[2]})`;
        
        // Compute box positions
        const xPos = c * cellW;
        const yPos = r * cellH;

        if (pixelShape === 'rect') {
          elements += `  <rect x="${xPos.toFixed(1)}" y="${yPos.toFixed(1)}" width="${cellW.toFixed(1)}" height="${cellH.toFixed(1)}" fill="${tileColor}" />\n`;
        } else if (pixelShape === 'circle') {
          const rx = cellW / 2;
          const ry = cellH / 2;
          elements += `  <circle cx="${(xPos + rx).toFixed(1)}" cy="${(yPos + ry).toFixed(1)}" r="${Math.min(rx, ry).toFixed(1)}" fill="${tileColor}" />\n`;
        } else if (pixelShape === 'squircle') {
          elements += `  <rect x="${(xPos + 0.5).toFixed(1)}" y="${(yPos + 0.5).toFixed(1)}" width="${(cellW - 1).toFixed(1)}" height="${(cellH - 1).toFixed(1)}" rx="${(Math.min(cellW, cellH) * 0.25).toFixed(1)}" fill="${tileColor}" />\n`;
        }
      }
    }

    return `<!-- APEX Quantized Pixel-Art Vector Map Engine -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
  <rect width="${w}" height="${h}" fill="#08080a" />
  <g id="pixel-tiles-raster-group">
    ${elements}
  </g>
</svg>`;
  };

  // ----------------------------------------------------
  // DOWNLOADING AND CLIPPING OPERATIONS
  // ----------------------------------------------------
  const handleCopySvg = async () => {
    if (!svgOutput) return;
    try {
      await navigator.clipboard.writeText(svgOutput);
      setSvgCopied(true);
      showToast('SVG XML payload copied to clipboard!', 'success');
      setTimeout(() => setSvgCopied(false), 2000);
    } catch {
      showToast('Clipboard access temporarily blocked', 'error');
    }
  };

  const handleDownloadSvg = () => {
    if (!svgOutput) return;
    try {
      const simplifiedName = imageName || 'vectorized_artwork';
      const filename = `apex_vector_${simplifiedName}_${vectorMode}_${Date.now()}.svg`;

      const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
      const objectUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      // Track into recent operation lists
      const rawSizeKB = (blob.size / 1024).toFixed(1);
      const historyItem = {
        id: `vectorizer-${Date.now()}`,
        name: `Vectorizer SVG (${vectorMode.toUpperCase()}: ${simplifiedName})`,
        type: 'SVG Vectorizer' as any,
        originalSize: 'Image Input',
        newSize: `${rawSizeKB} KB`,
        timestamp: new Date().toLocaleTimeString(),
        downloadName: filename
      };

      // Add to Dashboard analytics tracker
      addRecentOperation(
        historyItem.name,
        'SVG Vectorizer' as any,
        '-',
        `${rawSizeKB} KB`,
        historyItem.downloadName,
        'data:image/svg+xml;utf8,' + encodeURIComponent(svgOutput)
      );

      // Deploy signal trigger for sidebar counters
      window.dispatchEvent(new Event('apex_recent_ops_updated'));
      showToast('SVG file compiled and downloaded.', 'success');

    } catch (e: any) {
      console.error(e);
      showToast('Download packaging aborted', 'error');
    }
  };

  return (
    <div id="image-vectorizer-applet" className="grid grid-cols-1 lg:grid-cols-12 gap-8 select-none">
      
      {/* Dynamic Slide Toaster */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border font-mono text-xs shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/30 text-red-300'
                : 'bg-zinc-950/90 border-zinc-500/30 text-zinc-300'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: Controls & Input configurations */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Card 1: Load Source File */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/15 pb-3">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase mb-0">Source Image Ingestion</h3>
            <span className="text-[9px] font-mono font-bold bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded uppercase">
              100% Client-Side Private
            </span>
          </div>

          {!sourceImage ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
                dragActive 
                  ? 'border-brand bg-brand/5 scale-[0.99] shadow-[0_0_20px_-5px_rgba(37,99,235,0.2)]' 
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-950'
              }`}
              onClick={() => document.getElementById('vectorizer-input')?.click()}
            >
              <FileImage className="w-10 h-10 text-zinc-600 mb-3 animate-pulse" />
              <p className="text-xs font-sans text-zinc-300 font-medium heading-gradient">
                Drag & drop raster image here, or <span className="text-brand font-bold underline">browse</span>
              </p>
              <p className="text-[10px] font-mono text-zinc-500 mt-2">
                Supports PNG, JPG, JPEG, WEBP up to 25MB
              </p>
              <input
                id="vectorizer-input"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 bg-zinc-950 rounded-xl border border-zinc-900">
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                  <img src={sourceImage} alt="Thumbnail preview" className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-bold text-zinc-300 truncate">{imageName}</p>
                  <p className="text-[10px] font-mono text-zinc-500 mt-1">
                    Dimensions: {imageWidth > 0 ? `${imageWidth} × ${imageHeight} px` : 'Calculating...'}
                  </p>
                </div>
                <button
                  onClick={handleClearImage}
                  className="p-2 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 text-zinc-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                  title="Clear source image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Vectorization Style Selection */}
        {sourceImage && (
          <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/10 pb-2">
              <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-wider uppercase mb-0">Vectorization Style</h3>
              <span className="text-[10px] font-mono text-zinc-600">Trace Mode</span>
            </div>

            <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
              {[
                { id: 'silhouette', label: 'Silhou', icon: Maximize2 },
                { id: 'lowpoly', label: 'Low-Poly', icon: Grid },
                { id: 'halftone', label: 'Halftone', icon: Sparkles },
                { id: 'pixelart', label: 'Quantize', icon: Layers },
              ].map((style) => {
                const Icon = style.icon;
                const isActive = vectorMode === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setVectorMode(style.id as any)}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-md border text-[9px] font-mono font-bold uppercase transition-all duration-300 gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-brand/10 border-brand/35 text-brand'
                        : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{style.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Description context according to choice */}
            <div className="p-3 bg-brand/5 border border-brand/10 rounded-lg">
              <p className="text-[10px] font-mono text-zinc-400 leading-normal mb-0">
                {vectorMode === 'silhouette' && "Traces boundaries and creates crisp vector outline layers. Perfect for logos, signatures, high-contrast monochrome line arts."}
                {vectorMode === 'lowpoly' && "Converts your image into a stunning 3D style triangulation mesh map using dynamic edge jitter math centroids."}
                {vectorMode === 'halftone' && "Replicates classic vector halftone screen plates. Modulates dot matrix radii depending on dark pixel depth values."}
                {vectorMode === 'pixelart' && "Quantizes colors using K-Means and traces beautiful grid blocks creating retro pixelated vector poster graphics."}
              </p>
            </div>
          </div>
        )}

        {/* Card 3: Dynamic Style Controls */}
        {sourceImage && (
          <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border/10 pb-2">
              <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-wider uppercase mb-0 font-sans">Aesthetic Calibration</h3>
              <Sliders className="w-3.5 h-3.5 text-brand" />
            </div>

            {/* SILHOUETTE SPECIFIC SLIDERS */}
            {vectorMode === 'silhouette' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Luminance Threshold</label>
                    <span className="text-[10px] font-mono text-brand font-bold">{silhouetteThreshold} / 255</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={245}
                    value={silhouetteThreshold}
                    onChange={(e) => setSilhouetteThreshold(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Simplify Vector (Smoothing)</label>
                    <span className="text-[10px] font-mono text-brand font-bold">Lvl {smoothingLevel}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={1}
                    value={smoothingLevel}
                    onChange={(e) => setSmoothingLevel(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Vector Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={silhouetteColor}
                        onChange={(e) => setSilhouetteColor(e.target.value)}
                        className="w-8 h-8 rounded border border-zinc-800 bg-zinc-950 p-1 cursor-pointer"
                      />
                      <input
                        type="text"
                        maxLength={7}
                        value={silhouetteColor}
                        onChange={(e) => setSilhouetteColor(e.target.value)}
                        className="bg-zinc-950 border border-zinc-850 text-zinc-300 font-mono text-[10px] rounded-lg px-2 w-[80px] text-center outline-none uppercase focus:border-brand/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Bg Canvas</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={silhouetteBgColor}
                        onChange={(e) => setSilhouetteBgColor(e.target.value)}
                        className="w-8 h-8 rounded border border-zinc-800 bg-zinc-950 p-1 cursor-pointer"
                      />
                      <input
                        type="text"
                        maxLength={7}
                        value={silhouetteBgColor}
                        onChange={(e) => setSilhouetteBgColor(e.target.value)}
                        className="bg-zinc-950 border border-zinc-850 text-zinc-300 font-mono text-[10px] rounded-lg px-2 w-[80px] text-center outline-none uppercase focus:border-brand/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 select-none pt-2">
                  <input
                    id="silhou-invert"
                    type="checkbox"
                    checked={silhouetteInvert}
                    onChange={(e) => setSilhouetteInvert(e.target.checked)}
                    className="rounded border-zinc-800 text-brand bg-zinc-950 focus:ring-brand/40 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="silhou-invert" className="text-xs font-sans text-zinc-400 cursor-pointer">
                    Invert Contour binary mask
                  </label>
                </div>
              </div>
            )}

            {/* LOW POLY CALIBRATION */}
            {vectorMode === 'lowpoly' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Grid Mesh Density</label>
                    <span className="text-[10px] font-mono text-brand font-bold">{31 - polyGridSize} (Dense)</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={42}
                    step={2}
                    value={polyGridSize}
                    onChange={(e) => setPolyGridSize(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Edge Alignment Jitter</label>
                    <span className="text-[10px] font-mono text-brand font-bold">{polyJitter}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={polyJitter}
                    onChange={(e) => setPolyJitter(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                <div className="pt-2 border-t border-zinc-900/60 space-y-3.5">
                  <div className="flex items-center gap-2 select-none">
                    <input
                      id="poly-stroke"
                      type="checkbox"
                      checked={polyStroke}
                      onChange={(e) => setPolyStroke(e.target.checked)}
                      className="rounded border-zinc-800 text-brand bg-zinc-950 focus:ring-brand/40 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="poly-stroke" className="text-xs font-sans text-zinc-400 cursor-pointer">
                      Trace Explicit Polygon Borders
                    </label>
                  </div>

                  {polyStroke && (
                    <div className="space-y-1.5 flex items-center gap-3">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-0">Border Color: </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={polyStrokeColor}
                          onChange={(e) => setPolyStrokeColor(e.target.value)}
                          className="w-7 h-7 rounded border border-zinc-800 bg-zinc-950 p-1 cursor-pointer"
                        />
                        <input
                          type="text"
                          maxLength={7}
                          value={polyStrokeColor}
                          onChange={(e) => setPolyStrokeColor(e.target.value)}
                          className="bg-zinc-950 border border-zinc-850 text-zinc-300 font-mono text-[9px] rounded-lg px-2 w-[70px] text-center outline-none uppercase"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HALFTONE SCREEN CALIBRATION */}
            {vectorMode === 'halftone' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Dot Intervals Spacing</label>
                    <span className="text-[10px] font-mono text-brand font-bold">{halftoneSpacing} px</span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={26}
                    step={1}
                    value={halftoneSpacing}
                    onChange={(e) => setHalftoneSpacing(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Maximum Node Size</label>
                    <span className="text-[10px] font-mono text-brand font-bold">{halftoneMaxRadius} px</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    step={1}
                    value={halftoneMaxRadius}
                    onChange={(e) => setHalftoneMaxRadius(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Color Mapping</label>
                    <select
                      value={halftoneType}
                      onChange={(e: any) => setHalftoneType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 text-xs font-mono py-1.5 px-2 rounded-lg text-zinc-300 outline-none cursor-pointer"
                    >
                      <option value="color">Original Color</option>
                      <option value="bw">Inverted Halftime B&W</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Element shape</label>
                    <select
                      value={halftoneShape}
                      onChange={(e: any) => setHalftoneShape(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 text-xs font-mono py-1.5 px-2 rounded-lg text-zinc-300 outline-none cursor-pointer"
                    >
                      <option value="circle">Circles</option>
                      <option value="square">Squares (Rotated)</option>
                      <option value="triangle">Triangles</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PIXEL QUANTIZATION SCREEN CALIBRATION */}
            {vectorMode === 'pixelart' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Tile Resolution Scale</label>
                    <span className="text-[10px] font-mono text-brand font-bold">{pixelResolution} Blocks (width)</span>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={120}
                    step={4}
                    value={pixelResolution}
                    onChange={(e) => setPixelResolution(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Unique Color Limits</label>
                    <select
                      value={pixelColorCount}
                      onChange={(e: any) => setPixelColorCount(parseInt(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-850 text-xs font-mono py-1.5 px-2 rounded-lg text-zinc-300 outline-none cursor-pointer"
                    >
                      <option value={2}>2 Colors (Monochrome)</option>
                      <option value={4}>4 Colors (CGA)</option>
                      <option value={8}>8 Colors (Retro PC)</option>
                      <option value={16}>16 Colors (High Contrast)</option>
                      <option value={32}>32 Colors (Stylized Layer)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Tile Style Node</label>
                    <select
                      value={pixelShape}
                      onChange={(e: any) => setPixelShape(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 text-xs font-mono py-1.5 px-2 rounded-lg text-zinc-300 outline-none cursor-pointer"
                    >
                      <option value="rect">Sharp Rectangles</option>
                      <option value="circle">Isolated Dots</option>
                      <option value="squircle">Squircles (Rounded)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Output Preview & Controls */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Card 4: Vector Canvas Output Realtime Preview */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 flex flex-col min-h-[460px]">
          <div className="flex items-center justify-between border-b border-brand-border/15 pb-3 mb-4">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase mb-0 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand" />
              <span>Realtime Scalable SVG Output</span>
            </h3>

            {svgOutput && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySvg}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all duration-300 gap-1.5 flex items-center border cursor-pointer ${
                    svgCopied 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                      : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white'
                  }`}
                  title="Copy Raw SVG XML text payload"
                >
                  {svgCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy XML</span>
                </button>
                <button
                  onClick={handleDownloadSvg}
                  className="px-3 py-1.5 bg-brand/10 hover:bg-brand/20 border border-brand/25 hover:border-brand/40 text-brand rounded-lg text-[10px] font-mono font-bold uppercase transition-all duration-300 gap-1.5 flex items-center cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SVG</span>
                </button>
              </div>
            )}
          </div>

          {sourceImage && svgOutput && !processingError && (
            <div className="flex bg-[#040406] border border-zinc-900/60 rounded-xl p-1 gap-1 mb-4 w-full">
              <button
                onClick={() => setCompareMode('single')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-mono font-bold uppercase transition-all duration-200 cursor-pointer text-center ${
                  compareMode === 'single'
                    ? 'bg-brand/10 border border-brand/25 text-brand shadow-sm'
                    : 'border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                }`}
              >
                Vector Only
              </button>
              <button
                onClick={() => setCompareMode('split')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-mono font-bold uppercase transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  compareMode === 'split'
                    ? 'bg-brand/10 border border-brand/25 text-brand shadow-sm'
                    : 'border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Interactive Split Slider</span>
              </button>
              <button
                onClick={() => setCompareMode('sidebyside')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-mono font-bold uppercase transition-all duration-200 cursor-pointer text-center ${
                  compareMode === 'sidebyside'
                    ? 'bg-brand/10 border border-brand/25 text-brand shadow-sm'
                    : 'border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                }`}
              >
                Side-by-Side
              </button>
            </div>
          )}

          {sourceImage && svgOutput && !processingError && vectorMode === 'silhouette' && (
            <div className="bg-[#040406]/95 border border-zinc-900/60 rounded-xl p-4 mb-4 space-y-3 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                {/* Smoothing slider */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-heading font-bold text-[10px] text-zinc-400 tracking-wider uppercase flex items-center gap-1.5 label-glow">
                      <Sliders className="w-3.5 h-3.5 text-brand" />
                      Vector Path Smoothing Factor
                    </span>
                    <span className="text-[10px] font-mono font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-md">
                      {smoothingLevel === 0 ? 'Raw Pixels (Lvl 0)' : ''}
                      {smoothingLevel > 0 && smoothingLevel <= 2 ? `Sharp Simplification (Lvl ${smoothingLevel})` : ''}
                      {smoothingLevel >= 3 && smoothingLevel <= 5 ? `Smoothed Splines (Lvl ${smoothingLevel})` : ''}
                      {smoothingLevel > 5 ? `Ultra Fluid Curves (Lvl ${smoothingLevel})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-zinc-600">Rigid</span>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={1}
                      value={smoothingLevel}
                      onChange={(e) => setSmoothingLevel(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                    <span className="text-[10px] font-mono text-brand font-bold">Fluid</span>
                  </div>
                </div>

                {/* Spline toggle */}
                <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-zinc-900/60 pt-2.5 md:pt-0 shrink-0">
                  <div className="flex items-center gap-2 select-none">
                    <input
                      id="preview-bezier"
                      type="checkbox"
                      checked={useBezierCurves}
                      onChange={(e) => setUseBezierCurves(e.target.checked)}
                      disabled={smoothingLevel === 0}
                      className="rounded border-zinc-850 text-brand bg-zinc-950 focus:ring-brand/40 w-4 h-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <label 
                      htmlFor="preview-bezier" 
                      className={`text-[10px] font-mono uppercase tracking-wider cursor-pointer ${
                        smoothingLevel === 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Use Spline Curves
                    </label>
                  </div>
                </div>
              </div>
              <p className="text-[9px] font-mono text-zinc-500 leading-normal">
                {smoothingLevel === 0 
                  ? "Tracing raw geometric contours around boundary coordinates without any point optimization."
                  : useBezierCurves 
                  ? "Simplifying vertices with Ramer-Douglas-Peucker logic and drawing beautiful continuous quadratic Bezier curves."
                  : "Simplifying path segments with Douglas-Peucker logic but using straight angular polyline connections."
                }
              </p>
            </div>
          )}

          <div className="bg-[#040406]/98 border border-zinc-900 rounded-xl flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden min-h-[340px]">
            {isProcessing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                <div className="relative flex items-center justify-center mb-3">
                  <div className="w-10 h-10 border-4 border-zinc-800 border-t-brand rounded-full animate-spin" />
                  <Sparkles className="w-4 h-4 text-brand absolute animate-bounce" />
                </div>
                <p className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-widest animate-pulse">Calculating Contours...</p>
                <p className="text-[9px] font-mono text-zinc-500 mt-1">Mathematical Vector conversion in sandbox</p>
              </div>
            )}

            {processingError && (
              <div className="text-center max-w-md p-4 space-y-2">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-xs font-mono text-rose-400 font-bold">Calculation Interrupted</p>
                <p className="text-[10px] font-mono text-zinc-500 leading-normal">{processingError}</p>
              </div>
            )}

            {!sourceImage && (
              <div className="text-center p-8 space-y-3">
                <ImageIcon className="w-12 h-12 text-zinc-800 mx-auto" />
                <p className="text-xs font-mono text-zinc-500 font-bold uppercase tracking-widest">Awaiting Raster Source</p>
                <p className="text-[10px] font-mono text-zinc-600 max-w-sm leading-relaxed">
                  Upload an image in the left panel. The browser will run localized polygon edge triangulation and trace boundaries natively offline.
                </p>
              </div>
            )}

            {sourceImage && svgOutput && !processingError && (
              <div className="w-full h-full min-h-[340px] flex items-center justify-center">
                {compareMode === 'single' && (
                  <div 
                    className="w-full h-full max-h-[460px] flex items-center justify-center transition-all duration-300"
                    dangerouslySetInnerHTML={{ __html: svgOutput }}
                  />
                )}

                {compareMode === 'sidebyside' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full min-h-[340px] p-2 bg-[#020203] rounded-xl border border-zinc-900/40">
                    <div className="bg-[#050508]/40 p-4 border border-zinc-900/60 rounded-xl flex flex-col items-center justify-center relative min-h-[260px] overflow-hidden">
                      <span className="absolute top-2.5 left-2.5 bg-zinc-950/90 border border-zinc-900 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-zinc-400 tracking-wider uppercase pointer-events-none z-10">
                        Original Raster
                      </span>
                      <img 
                        src={sourceImage} 
                        className="max-h-[220px] max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" 
                        alt="Original Input"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="bg-[#050508]/40 p-4 border border-zinc-900/60 rounded-xl flex flex-col items-center justify-center relative min-h-[260px] overflow-hidden">
                      <span className="absolute top-2.5 left-2.5 bg-zinc-950/90 border border-zinc-900 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-brand tracking-wider uppercase pointer-events-none z-10">
                        Vector Output (SVG)
                      </span>
                      <div 
                        className="max-h-[220px] max-w-full flex items-center justify-center w-full h-full svg-container"
                        dangerouslySetInnerHTML={{ __html: svgOutput }}
                      />
                    </div>
                  </div>
                )}

                {compareMode === 'split' && (
                  <div 
                    ref={sliderRef}
                    onMouseDown={(e) => {
                      setIsDragging(true);
                      if (sliderRef.current) {
                        const rect = sliderRef.current.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                        setSliderPosition(percentage);
                      }
                    }}
                    onTouchStart={(e) => {
                      setIsDragging(true);
                      if (sliderRef.current && e.touches && e.touches[0]) {
                        const rect = sliderRef.current.getBoundingClientRect();
                        const x = e.touches[0].clientX - rect.left;
                        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                        setSliderPosition(percentage);
                      }
                    }}
                    className="relative w-full h-full min-h-[340px] flex items-center justify-center select-none overflow-hidden rounded-xl bg-[#030304] border border-zinc-900 cursor-ew-resize group"
                  >
                    {/* Layer 1 (Under): Original Raster Image */}
                    <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                      <img 
                        src={sourceImage} 
                        className="max-h-[300px] max-w-full object-contain opacity-70 filter saturate-[0.85] blur-[0.2px]" 
                        alt="Original"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Layer 2 (Over): Clipped SVG Vector Output */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none bg-[#030304]/10 transition-all duration-75"
                      style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                    >
                      <div 
                        className="max-h-[300px] max-w-full flex items-center justify-center w-full h-full"
                        dangerouslySetInnerHTML={{ __html: svgOutput }}
                      />
                    </div>

                    {/* Vertical slider divider/handle */}
                    <div 
                      className="absolute top-0 bottom-0 w-[2px] bg-brand hover:bg-brand/80 active:bg-brand z-10 pointer-events-none transition-colors"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-zinc-950 border-2 border-brand/80 group-hover:border-brand flex items-center justify-center shadow-lg shadow-black/80 hover:scale-110 active:scale-95 transition-all">
                        <Sliders className="w-3.5 h-3.5 text-brand rotate-90" />
                      </div>
                    </div>

                    {/* Mode Hint Labels */}
                    <div className="absolute bottom-3 left-3 bg-zinc-950/85 border border-zinc-900/60 px-2 py-0.5 rounded text-[8px] font-mono text-brand pointer-events-none uppercase tracking-wider">
                      SVG Vector (Left)
                    </div>
                    <div className="absolute bottom-3 right-3 bg-zinc-950/85 border border-zinc-900/60 px-2 py-0.5 rounded text-[8px] font-mono text-zinc-400 pointer-events-none uppercase tracking-wider">
                      Original (Right)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {sourceImage && (
            <div className="mt-4 flex items-center justify-between p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase tracking-wider">
                  Edge Boundary Simplification: Douglas-Peucker active.
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-600">
                Vector scale: ∞ lossy compression
              </span>
            </div>
          )}
        </div>

        {/* Instructions block */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 space-y-3.5">
          <div className="flex items-center gap-2 text-zinc-400">
            <HelpCircle className="w-4 h-4 text-brand" />
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider mb-0 text-zinc-300">How Sandbox Vectorization Works</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-mono text-zinc-500 leading-relaxed">
            <div className="space-y-1.5">
              <p>
                <strong className="text-zinc-400">1. Local Buffer Ingestion</strong>: Reads colors & opacity channels in localized RAM heap. Pixels never ascend to cloud processors.
              </p>
              <p>
                <strong className="text-zinc-400">2. Boundary Delineation</strong>: Moore-Neighbor follows 8-point compass coordinates for active masks to compose loop paths.
              </p>
            </div>
            <div className="space-y-1.5">
              <p>
                <strong className="text-zinc-400">3. Ramer-Douglas-Peucker (RDP)</strong>: Decimates linear vertex redundancies. Suppresses file weight and fits clean bezier segments.
              </p>
              <p>
                <strong className="text-zinc-400">4. SVG compilation</strong>: Outputs native scalable XML strings. Ready for Illustrator, Figma, or physical cutters/CNC plotters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden helper elements */}
      <img
        ref={imgRef}
        src={sourceImage || ''}
        style={{ display: 'none' }}
        onLoad={onImageLoad}
        alt="Original Hidden"
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
