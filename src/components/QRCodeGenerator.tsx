import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, Barcode, Copy, Download, Check, Trash2, Sliders, Type, Link, Wifi, Mail, MessageSquare, 
  AlertTriangle, ShieldCheck, Palette, FileText, Tag, Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { addRecentOperation } from '../utils/recentOperations';
import { usePresets } from '../context/PresetContext';

// Built-in Premium Color Palettes for QC and Barcode design
const PALETTES = [
  { name: 'Onyx Dark', fore: '#000000', back: '#ffffff' },
  { name: 'Crimson Glow', fore: '#e11d48', back: '#040405' },
  { name: 'Cyber Cobalt', fore: '#2563eb', back: '#020617' },
  { name: 'Emerald Vault', fore: '#10b981', back: '#050505' },
  { name: 'Amber Signal', fore: '#f59e0b', back: '#070708' },
  { name: 'Monochrome inverted', fore: '#ffffff', back: '#0c0a09' }
];

export default function QRCodeGenerator() {
  const { activeSettings, updateActiveSettings } = usePresets();

  // Active Tool state: 'qr' | 'barcode'
  const [toolType, setToolType] = useState<'qr' | 'barcode'>('qr');

  // ---------- QR CODE SPECIFIC STATE ----------
  // Mode state: 'text' | 'url' | 'wifi' | 'email' | 'sms'
  const [mode, setMode] = useState<'text' | 'url' | 'wifi' | 'email' | 'sms'>(
    () => activeSettings.qrMode || 'url'
  );
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>(
    () => activeSettings.qrErrorCorrection || 'Q'
  );
  const [qrSize, setQrSize] = useState<number>(() => activeSettings.qrSize || 400);
  
  // Content values
  const [plainText, setPlainText] = useState('Welcome to APEX Utility Labs secure QR console.');
  const [url, setUrl] = useState('https://apexutility.live');
  
  // Custom Wifi
  const [wifiSsid, setWifiSsid] = useState(() => activeSettings.qrWifiSsid || '');
  const [wifiPass, setWifiPass] = useState(() => activeSettings.qrWifiPass || '');
  const [wifiSecurity, setWifiSecurity] = useState<'WPA' | 'WEP' | 'nopass'>(
    () => activeSettings.qrWifiSecurity || 'WPA'
  );
  const [wifiHidden, setWifiHidden] = useState(false);

  // Custom Email
  const [emailTo, setEmailTo] = useState(() => activeSettings.qrEmailTo || '');
  const [emailSubject, setEmailSubject] = useState(() => activeSettings.qrEmailSubject || '');
  const [emailBody, setEmailBody] = useState(() => activeSettings.qrEmailBody || '');

  // Custom SMS
  const [smsPhone, setSmsPhone] = useState(() => activeSettings.qrSmsPhone || '');
  const [smsMessage, setSmsMessage] = useState(() => activeSettings.qrSmsMessage || '');

  // Render values
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [qrError, setQrError] = useState<string>('');
  const [qrCopied, setQrCopied] = useState<boolean>(false);

  // ---------- BARCODE SPECIFIC STATE ----------
  const [barcodeFormat, setBarcodeFormat] = useState<string>('CODE128');
  const [barcodeValue, setBarcodeValue] = useState<string>('APEX-CODE-128');
  const [barWidth, setBarWidth] = useState<number>(2);
  const [barHeight, setBarHeight] = useState<number>(80);
  const [showBarcodeText, setShowBarcodeText] = useState<boolean>(true);
  const [barcodeFontSize, setBarcodeFontSize] = useState<number>(14);
  const [barcodeTextMargin, setBarcodeTextMargin] = useState<number>(4);
  const [barcodeFont, setBarcodeFont] = useState<string>('monospace');

  const [barcodePngUrl, setBarcodePngUrl] = useState<string>('');
  const [barcodeSvgString, setBarcodeSvgString] = useState<string>('');
  const [barcodeError, setBarcodeError] = useState<string>('');
  const [barcodeCopied, setBarcodeCopied] = useState<boolean>(false);

  // Ref container for barcode rendering SVG
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  // ---------- SHARED STYLE STATE ----------
  const [foreColor, setForeColor] = useState(() => activeSettings.qrForeColor || '#000000');
  const [bgColor, setBgColor] = useState(() => activeSettings.qrBgColor || '#ffffff');
  const [withMargin, setWithMargin] = useState<boolean>(
    () => activeSettings.qrWithMargin !== undefined ? activeSettings.qrWithMargin : true
  );

  // ---------- HISTORY & NOTIFICATIONS ----------
  const [recentCodes, setRecentCodes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('apex_qr_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notif, setNotif] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 3000);
  };

  // Persists local options to global PresetContext settings hook (reusing QR bounds for compatibility)
  useEffect(() => {
    updateActiveSettings({
      qrMode: mode,
      qrErrorCorrection: errorCorrection,
      qrForeColor: foreColor,
      qrBgColor: bgColor,
      qrSize: qrSize,
      qrWithMargin: withMargin,
      qrWifiSsid: wifiSsid,
      qrWifiPass: wifiPass,
      qrWifiSecurity: wifiSecurity,
      qrEmailTo: emailTo,
      qrEmailSubject: emailSubject,
      qrEmailBody: emailBody,
      qrSmsPhone: smsPhone,
      qrSmsMessage: smsMessage,
    });
  }, [
    mode, errorCorrection, foreColor, bgColor, qrSize, withMargin,
    wifiSsid, wifiPass, wifiSecurity, emailTo, emailSubject, emailBody,
    smsPhone, smsMessage
  ]);

  // Sync state if another preset updates activeSettings globally
  useEffect(() => {
    if (activeSettings) {
      if (activeSettings.qrMode && activeSettings.qrMode !== mode) setMode(activeSettings.qrMode);
      if (activeSettings.qrErrorCorrection && activeSettings.qrErrorCorrection !== errorCorrection) {
        setErrorCorrection(activeSettings.qrErrorCorrection);
      }
      if (activeSettings.qrForeColor && activeSettings.qrForeColor !== foreColor) setForeColor(activeSettings.qrForeColor);
      if (activeSettings.qrBgColor && activeSettings.qrBgColor !== bgColor) setBgColor(activeSettings.qrBgColor);
      if (activeSettings.qrSize && activeSettings.qrSize !== qrSize) setQrSize(activeSettings.qrSize);
      if (activeSettings.qrWithMargin !== undefined && activeSettings.qrWithMargin !== withMargin) {
        setWithMargin(activeSettings.qrWithMargin);
      }
      if (activeSettings.qrWifiSsid !== undefined && activeSettings.qrWifiSsid !== wifiSsid) setWifiSsid(activeSettings.qrWifiSsid);
      if (activeSettings.qrWifiPass !== undefined && activeSettings.qrWifiPass !== wifiPass) setWifiPass(activeSettings.qrWifiPass);
      if (activeSettings.qrWifiSecurity !== undefined && activeSettings.qrWifiSecurity !== wifiSecurity) {
        setWifiSecurity(activeSettings.qrWifiSecurity);
      }
      if (activeSettings.qrEmailTo !== undefined && activeSettings.qrEmailTo !== emailTo) setEmailTo(activeSettings.qrEmailTo);
      if (activeSettings.qrEmailSubject !== undefined && activeSettings.qrEmailSubject !== emailSubject) {
        setEmailSubject(activeSettings.qrEmailSubject);
      }
      if (activeSettings.qrEmailBody !== undefined && activeSettings.qrEmailBody !== emailBody) setEmailBody(activeSettings.qrEmailBody);
      if (activeSettings.qrSmsPhone !== undefined && activeSettings.qrSmsPhone !== smsPhone) setSmsPhone(activeSettings.qrSmsPhone);
      if (activeSettings.qrSmsMessage !== undefined && activeSettings.qrSmsMessage !== smsMessage) setSmsMessage(activeSettings.qrSmsMessage);
    }
  }, [activeSettings]);

  // QR String payload resolver
  const getQrPayload = (): string => {
    switch (mode) {
      case 'url':
        return url.trim() || 'https://google.com';
      case 'wifi':
        const ssid = wifiSsid.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,');
        const pass = wifiPass.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,');
        const sec = wifiSecurity;
        return `WIFI:S:${ssid};T:${sec};P:${pass};${wifiHidden ? 'H:true;' : ''};`;
      case 'email':
        const mailToQuery = [];
        if (emailSubject) mailToQuery.push(`subject=${encodeURIComponent(emailSubject)}`);
        if (emailBody) mailToQuery.push(`body=${encodeURIComponent(emailBody)}`);
        const queryString = mailToQuery.length > 0 ? `?${mailToQuery.join('&')}` : '';
        return `mailto:${emailTo.trim()}${queryString}`;
      case 'sms':
        return `SMSTO:${smsPhone.trim()}:${smsMessage}`;
      case 'text':
      default:
        return plainText;
    }
  };

  // Compile QR Code
  const compileQRCode = async () => {
    const payload = getQrPayload();
    if (!payload) {
      setQrError('Payload cannot be empty');
      return;
    }

    try {
      setQrError('');
      const options: QRCode.QRCodeToDataURLOptions = {
        errorCorrectionLevel: errorCorrection,
        margin: withMargin ? 4 : 0,
        width: qrSize,
        color: {
          dark: foreColor,
          light: bgColor
        }
      };

      const dataUrl = await QRCode.toDataURL(payload, options);
      setQrDataUrl(dataUrl);

      const svgOptions: QRCode.QRCodeToStringOptions = {
        type: 'svg',
        errorCorrectionLevel: errorCorrection,
        margin: withMargin ? 4 : 0,
        width: qrSize,
        color: {
          dark: foreColor,
          light: bgColor
        }
      };
      const svgStr = await QRCode.toString(payload, svgOptions);
      setQrSvgString(svgStr);

    } catch (err: any) {
      console.error(err);
      setQrError(err?.message || 'Failed to compile QR code. Input may exceed maximum byte size for this error tolerance.');
    }
  };

  // Monitor QR state to trigger compilation
  useEffect(() => {
    if (toolType === 'qr') {
      compileQRCode();
    }
  }, [
    toolType, mode, errorCorrection, foreColor, bgColor, qrSize, withMargin,
    plainText, url, wifiSsid, wifiPass, wifiSecurity, wifiHidden,
    emailTo, emailSubject, emailBody, smsPhone, smsMessage
  ]);

  // ---------- BARCODE SPECIFIC VALIDATIONS ----------
  const validateBarcodeValue = (value: string, format: string): string | null => {
    if (!value) return 'Barcode value cannot be empty.';
    switch (format) {
      case 'EAN13':
        if (!/^\d{12,13}$/.test(value)) {
          return 'EAN-13 expects exactly 12 or 13 numerical digits.';
        }
        break;
      case 'EAN8':
        if (!/^\d{7,8}$/.test(value)) {
          return 'EAN-8 expects exactly 7 or 8 numerical digits.';
        }
        break;
      case 'UPCA':
        if (!/^\d{11,12}$/.test(value)) {
          return 'UPC-A expects exactly 11 or 12 numerical digits.';
        }
        break;
      case 'ITF':
        if (!/^\d+$/.test(value)) {
          return 'ITF expects numerical digits only.';
        }
        if (value.length % 2 !== 0) {
          return 'ITF requires an even number of digits (even length).';
        }
        break;
      case 'CODABAR':
        if (!/^[A-D][0-9\-\$\:\/\.\+]+[A-D]$/i.test(value) && !/^[0-9\-\$\:\/\.\+]+$/.test(value)) {
          return 'Codabar expects numbers, special signs (-$:/.+), and optional start/stop characters (A-D).';
        }
        break;
      case 'MSI':
        if (!/^\d+$/.test(value)) {
          return 'MSI code expects numerical digits only.';
        }
        break;
      case 'CODE39':
        if (!/^[0-9A-Z\- \.\$\/\+\%]+$/.test(value.toUpperCase())) {
          return 'Code 39 expects uppercase characters, numbers, and symbols (- . $ / + % space).';
        }
        break;
      case 'CODE128':
      default:
        // ASCII only
        if (!/^[\x00-\x7F]+$/.test(value)) {
          return 'Code 128 accepts standard ASCII alphanumeric text.';
        }
        break;
    }
    return null;
  };

  // Compile Barcode
  const compileBarcode = () => {
    if (toolType !== 'barcode') return;

    const validationError = validateBarcodeValue(barcodeValue, barcodeFormat);
    if (validationError) {
      setBarcodeError(validationError);
      setBarcodePngUrl('');
      setBarcodeSvgString('');
      return;
    }

    setBarcodeError('');

    try {
      if (barcodeSvgRef.current) {
        JsBarcode(barcodeSvgRef.current, barcodeValue, {
          format: barcodeFormat,
          lineColor: foreColor,
          background: bgColor,
          width: barWidth,
          height: barHeight,
          displayValue: showBarcodeText,
          fontSize: barcodeFontSize,
          font: barcodeFont,
          textMargin: barcodeTextMargin,
          margin: withMargin ? 12 : 0
        });

        // Extract fresh rendered SVG lines to save
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(barcodeSvgRef.current);
        setBarcodeSvgString(svgStr);
      }

      // Generate offscreen canvas high-res PNG
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, barcodeValue, {
        format: barcodeFormat,
        lineColor: foreColor,
        background: bgColor,
        width: barWidth * 2, // Double width for high-density rendering
        height: barHeight * 1.5,
        displayValue: showBarcodeText,
        fontSize: barcodeFontSize * 1.4,
        font: barcodeFont,
        textMargin: barcodeTextMargin * 1.5,
        margin: withMargin ? 24 : 0
      });
      setBarcodePngUrl(canvas.toDataURL('image/png'));

    } catch (err: any) {
      console.error(err);
      setBarcodeError(err?.message || 'WASM Barcode compilation yielded a matrix overflow.');
      setBarcodePngUrl('');
      setBarcodeSvgString('');
    }
  };

  // Monitor Barcode state triggers
  useEffect(() => {
    compileBarcode();
  }, [
    toolType, barcodeFormat, barcodeValue, barWidth, barHeight,
    showBarcodeText, barcodeFontSize, barcodeTextMargin, barcodeFont,
    foreColor, bgColor, withMargin
  ]);

  // Switch formats and inject appropriate sample data to avoid validation bugs
  const handleBarcodeFormatSelect = (format: string) => {
    setBarcodeFormat(format);
    let sample = '';
    switch (format) {
      case 'EAN13':
        sample = '4006381333931';
        break;
      case 'EAN8':
        sample = '90311017';
        break;
      case 'UPCA':
        sample = '123456789012';
        break;
      case 'ITF':
        sample = '1234567890';
        break;
      case 'CODABAR':
        sample = 'A12345B';
        break;
      case 'MSI':
        sample = '123456';
        break;
      case 'CODE39':
        sample = 'APEX-LABEL';
        break;
      case 'CODE128':
      default:
        sample = 'APEX-CODE-128';
        break;
    }
    setBarcodeValue(sample);
  };

  // ---------- QUICK PRESETS TEMPLATES ----------
  const applyStudioTemplate = (type: 'wifi' | 'ean13' | 'code128' | 'code39' | 'plain') => {
    if (type === 'plain') {
      setToolType('qr');
      setMode('text');
      setPlainText('APEX secure signal string payload.');
      setForeColor('#000000');
      setBgColor('#ffffff');
      triggerNotification('Applied: Clean Text QR', 'info');
    } else if (type === 'wifi') {
      setToolType('qr');
      setMode('wifi');
      setWifiSsid('APEX_Secure_Net');
      setWifiPass('WASMCompiler99');
      setWifiSecurity('WPA');
      setForeColor('#2563eb');
      setBgColor('#020617');
      triggerNotification('Applied: Inverted High-Tech Wi-Fi Card', 'info');
    } else if (type === 'ean13') {
      setToolType('barcode');
      setBarcodeFormat('EAN13');
      setBarcodeValue('4312345678901');
      setBarHeight(75);
      setBarWidth(2);
      setForeColor('#000000');
      setBgColor('#ffffff');
      setShowBarcodeText(true);
      triggerNotification('Applied: Retail EAN-13 Product Tag', 'info');
    } else if (type === 'code128') {
      setToolType('barcode');
      setBarcodeFormat('CODE128');
      setBarcodeValue('APEX-LOGISTICS-99X');
      setBarHeight(100);
      setBarWidth(3);
      setForeColor('#e11d48');
      setBgColor('#040405');
      setShowBarcodeText(true);
      triggerNotification('Applied: Premium Warehouse Logistics Badge', 'info');
    } else if (type === 'code39') {
      setToolType('barcode');
      setBarcodeFormat('CODE39');
      setBarcodeValue('INV-39401-A');
      setBarHeight(55);
      setBarWidth(2);
      setForeColor('#f59e0b');
      setBgColor('#070708');
      setShowBarcodeText(false);
      triggerNotification('Applied: Compact Inventory Asset Tag', 'info');
    }
  };

  // ---------- COPY ACTION ----------
  const handleCopyClipboardAction = async () => {
    if (toolType === 'qr') {
      if (!qrDataUrl) return;
      try {
        setQrCopied(true);
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        triggerNotification('QR image copied to clipboard!', 'success');
        setTimeout(() => setQrCopied(false), 2000);
      } catch {
        try {
          await navigator.clipboard.writeText(getQrPayload());
          triggerNotification('Copied raw QR text payload to clipboard', 'info');
        } catch {
          triggerNotification('Clipboard block detected by sandbox browser', 'error');
        }
        setTimeout(() => setQrCopied(false), 2000);
      }
    } else {
      if (!barcodePngUrl) return;
      try {
        setBarcodeCopied(true);
        const response = await fetch(barcodePngUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        triggerNotification('Barcode image copied to clipboard!', 'success');
        setTimeout(() => setBarcodeCopied(false), 2000);
      } catch {
        try {
          await navigator.clipboard.writeText(barcodeValue);
          triggerNotification('Copied raw barcode value to clipboard', 'info');
        } catch {
          triggerNotification('Clipboard injection block detected', 'error');
        }
        setTimeout(() => setBarcodeCopied(false), 2000);
      }
    }
  };

  // ---------- DOWNLOAD ACTION ----------
  const handleDownloadAction = (format: 'png' | 'svg') => {
    const isQr = toolType === 'qr';
    
    if (isQr) {
      if (format === 'png' && !qrDataUrl) return;
      if (format === 'svg' && !qrSvgString) return;
    } else {
      if (format === 'png' && !barcodePngUrl) return;
      if (format === 'svg' && !barcodeSvgString) return;
    }

    try {
      const typeLabel = isQr ? `qr_${mode}` : `barcode_${barcodeFormat.toLowerCase()}`;
      const filename = `apex_${typeLabel}_${Date.now()}`;
      const payloadString = isQr ? getQrPayload() : barcodeValue;

      if (format === 'png') {
        const link = document.createElement('a');
        link.href = isQr ? qrDataUrl : barcodePngUrl;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const svgStr = isQr ? qrSvgString : barcodeSvgString;
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${filename}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      }

      // Record in local history
      const displaySnippet = payloadString.length > 22 ? `${payloadString.slice(0, 22)}...` : payloadString;
      const historyItem = {
        id: `${toolType}-${Date.now()}`,
        name: isQr ? `QR Code (${mode.toUpperCase()}: ${displaySnippet})` : `Barcode (${barcodeFormat}: ${displaySnippet})`,
        type: isQr ? 'QR Code Generation' as any : 'Barcode Generation' as any,
        originalSize: `${payloadString.length} chars`,
        newSize: `${format.toUpperCase()}`,
        timestamp: new Date().toLocaleTimeString(),
        downloadName: `${filename}.${format}`
      };

      const updatedHistory = [historyItem, ...recentCodes].slice(0, 30);
      setRecentCodes(updatedHistory);
      localStorage.setItem('apex_qr_history', JSON.stringify(updatedHistory));

      // Sync into main Dashboard analytics
      addRecentOperation(
        historyItem.name,
        'PDF Compression', // Complies with existing category maps
        '-',
        '-',
        historyItem.downloadName,
        isQr ? qrDataUrl : barcodePngUrl
      );

      window.dispatchEvent(new Event('apex_recent_ops_updated'));
      triggerNotification(`Completed ${format.toUpperCase()} downloaded.`, 'success');

    } catch (e) {
      console.error(e);
      triggerNotification('Download sequence failed', 'error');
    }
  };

  const handleClearHistory = () => {
    setRecentCodes([]);
    localStorage.removeItem('apex_qr_history');
    triggerNotification('Local output history cleared', 'info');
  };

  return (
    <div id="qr-generator-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8 select-none">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border font-mono text-xs shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              notif.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
                : notif.type === 'error'
                ? 'bg-red-950/90 border-red-500/30 text-red-300'
                : 'bg-zinc-950/90 border-zinc-500/30 text-zinc-300'
            }`}
          >
            <ShieldCheck className="w-5 h-5 animate-pulse" />
            <span>{notif.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: Controls & Input configuration */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Card 1: Tool Engine Switcher */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/15 pb-3">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">Select Vector Engine</h3>
            <span className="text-[10px] font-mono font-semibold bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded uppercase">
              Isolated Client-Side Compiler
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
            <button
              onClick={() => setToolType('qr')}
              className={`flex items-center justify-center py-3 rounded-lg border text-xs font-mono font-bold uppercase transition-all duration-300 gap-2 cursor-pointer ${
                toolType === 'qr'
                  ? 'bg-brand/10 border-brand/40 text-brand shadow-[0_0_15px_-3px_rgba(37,99,235,0.25)] font-black'
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 font-semibold'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code Studio</span>
            </button>
            <button
              onClick={() => setToolType('barcode')}
              className={`flex items-center justify-center py-3 rounded-lg border text-xs font-mono font-bold uppercase transition-all duration-300 gap-2 cursor-pointer ${
                toolType === 'barcode'
                  ? 'bg-brand/10 border-brand/40 text-brand shadow-[0_0_15px_-3px_rgba(37,99,235,0.25)] font-black'
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 font-semibold'
              }`}
            >
              <Barcode className="w-4 h-4" />
              <span>Barcode Builder</span>
            </button>
          </div>

          {/* Quick Studio Presets */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Load Studio Templates</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyStudioTemplate('plain')}
                className="px-2.5 py-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Clean QR</span>
              </button>
              <button
                onClick={() => applyStudioTemplate('wifi')}
                className="px-2.5 py-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Wi-Fi Card</span>
              </button>
              <button
                onClick={() => applyStudioTemplate('ean13')}
                className="px-2.5 py-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>EAN-13 Retail Tag</span>
              </button>
              <button
                onClick={() => applyStudioTemplate('code128')}
                className="px-2.5 py-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Logistics C128</span>
              </button>
              <button
                onClick={() => applyStudioTemplate('code39')}
                className="px-2.5 py-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Asset Code 39</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Inputs Form based on active selection */}
        {toolType === 'qr' ? (
          <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/10 pb-2">
              <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-wider uppercase">QR Payload Scheme</h3>
              <span className="text-[10px] font-mono text-zinc-600">Select data matrix type</span>
            </div>

            <div className="grid grid-cols-5 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
              {[
                { id: 'url', label: 'URL', icon: Link },
                { id: 'text', label: 'Text', icon: Type },
                { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'sms', label: 'SMS', icon: MessageSquare },
              ].map((btn) => {
                const Icon = btn.icon;
                const isActive = mode === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setMode(btn.id as any)}
                    className={`flex flex-col items-center justify-center py-2 rounded-md border text-[9px] font-mono font-bold uppercase transition-all duration-300 gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-brand/10 border-brand/35 text-brand'
                        : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <AnimatePresence mode="wait">
                {mode === 'url' && (
                  <motion.div
                    key="qr-url"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-2.5"
                  >
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Link Address (URL)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-600 font-mono text-xs">href=</span>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-3 pl-14 pr-4 text-xs font-mono text-white outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                {mode === 'text' && (
                  <motion.div
                    key="qr-text"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-2.5"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Raw Character Stream</label>
                      <span className="text-[10px] font-mono text-zinc-500">{plainText.length}/1200 chars</span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Enter raw alphanumeric data string..."
                      value={plainText}
                      onChange={(e) => setPlainText(e.target.value)}
                      maxLength={1200}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl p-3 text-xs font-mono text-white outline-none transition-all resize-none"
                    />
                  </motion.div>
                )}

                {mode === 'wifi' && (
                  <motion.div
                    key="qr-wifi"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">SSID Name</label>
                        <input
                          type="text"
                          placeholder="My_Network"
                          value={wifiSsid}
                          onChange={(e) => setWifiSsid(e.target.value)}
                          className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Encryption</label>
                        <select
                          value={wifiSecurity}
                          onChange={(e: any) => setWifiSecurity(e.target.value)}
                          className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-zinc-300 outline-none transition-all cursor-pointer"
                        >
                          <option value="WPA">WPA / WPA2 / WPA3</option>
                          <option value="WEP">WEP Legacy</option>
                          <option value="nopass">Unsecured (None)</option>
                        </select>
                      </div>
                    </div>

                    {wifiSecurity !== 'nopass' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">WiFi Password</label>
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          value={wifiPass}
                          onChange={(e) => setWifiPass(e.target.value)}
                          className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white outline-none transition-all"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 select-none">
                      <input
                        id="wifi-hidden"
                        type="checkbox"
                        checked={wifiHidden}
                        onChange={(e) => setWifiHidden(e.target.checked)}
                        className="rounded border-zinc-800 text-brand bg-zinc-950 focus:ring-brand/40 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="wifi-hidden" className="text-[11px] font-sans text-zinc-400 cursor-pointer">
                        Our network broadcast SSID is hidden
                      </label>
                    </div>
                  </motion.div>
                )}

                {mode === 'email' && (
                  <motion.div
                    key="qr-email"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-3.5"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Receiver Email</label>
                      <input
                        type="email"
                        placeholder="service@apexlabs.org"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Subject</label>
                      <input
                        type="text"
                        placeholder="Service Request Title"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Mail Body Context</label>
                      <textarea
                        rows={3}
                        placeholder="Pre-populate message details..."
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl p-3 text-xs font-mono text-white outline-none transition-all resize-none"
                      />
                    </div>
                  </motion.div>
                )}

                {mode === 'sms' && (
                  <motion.div
                    key="qr-sms"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-3.5"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Target Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +14155552671"
                        value={smsPhone}
                        onChange={(e) => setSmsPhone(e.target.value)}
                        className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Precompiled Message Text</label>
                      <textarea
                        rows={3}
                        placeholder="Message details to compose..."
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl p-3 text-xs font-mono text-white outline-none transition-all resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/10 pb-2">
              <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-wider uppercase">Barcode Specification</h3>
              <span className="text-[10px] font-mono text-zinc-600">Dynamic layout validations</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Symbology Format</label>
                  <select
                    value={barcodeFormat}
                    onChange={(e) => handleBarcodeFormatSelect(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-300 outline-none transition-all cursor-pointer"
                  >
                    <option value="CODE128">Code 128 (ASCII text)</option>
                    <option value="CODE39">Code 39 (Alphanumeric, legacy)</option>
                    <option value="EAN13">EAN-13 (13 digits retail)</option>
                    <option value="EAN8">EAN-8 (8 digits retail)</option>
                    <option value="UPCA">UPC-A (12 digits retail)</option>
                    <option value="ITF">ITF (Digits only, even length)</option>
                    <option value="CODABAR">Codabar (Digits / dividers)</option>
                    <option value="MSI">MSI (Plessey digits only)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Barcode Identifier Value</label>
                  <input
                    type="text"
                    value={barcodeValue}
                    onChange={(e) => setBarcodeValue(e.target.value)}
                    placeholder="E.g. APEX-CODE-128"
                    className={`w-full bg-zinc-950/70 border rounded-xl py-2.5 px-3.5 text-xs font-mono text-white outline-none transition-all ${
                      barcodeError ? 'border-rose-500/70 focus:border-rose-400' : 'border-zinc-800 focus:border-brand/60'
                    }`}
                  />
                </div>
              </div>

              {barcodeError && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-mono text-rose-300 leading-normal">
                    {barcodeError}
                  </p>
                </div>
              )}

              <div className="p-3 bg-brand/5 border border-brand/10 rounded-lg">
                <p className="text-[10px] font-mono text-zinc-400 leading-normal">
                  {barcodeFormat === 'CODE128' && "Code 128 is a highly compact, robust high-density linear barcode widely adopted in transport, retail, and manufacturing."}
                  {barcodeFormat === 'CODE39' && "Code 39 supports alphanumeric characters. Note that barcode length grows widely according to text volume."}
                  {barcodeFormat === 'EAN13' && "EAN-13 expects exactly 13 digits (the 13th number is verified as a checksum module calculated dynamically)."}
                  {barcodeFormat === 'EAN8' && "EAN-8 expects exactly 8 digits representing standard lightweight consumer goods retail tags."}
                  {barcodeFormat === 'UPCA' && "UPC-A represents universal North American store supply chain coordinates. Requires 12 numerical digits."}
                  {barcodeFormat === 'ITF' && "Interleaved 2 of 5 handles numeric digits only. Must contain an even number of characters (padded automatically if even padding flags fail)."}
                  {barcodeFormat === 'CODABAR' && "Codabar encodes numbers and symbols (-$:/.+), with alternate alphabetical start/stop codes."}
                  {barcodeFormat === 'MSI' && "MSI Plessey provides sequential asset tracker signatures widely utilized in warehouse inventory management."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card 3: Color Grids and Aesthetic Customization Panel */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">Aesthetics & Calibration</h3>
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Palette className="w-3.5 h-3.5 text-brand" />
              <span className="text-[10px] font-mono">Hex Controls</span>
            </div>
          </div>

          {/* Quick Palettes */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Presets Palettes Matrix</span>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {PALETTES.map((pal, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setForeColor(pal.fore);
                    setBgColor(pal.back);
                    triggerNotification(`Colors synchronized to: ${pal.name}`, 'info');
                  }}
                  className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-lg flex flex-col items-center gap-1.5 cursor-pointer text-center group transition-all"
                >
                  <div className="flex w-6 h-3 rounded overflow-hidden shadow-inner border border-zinc-800">
                    <div className="w-1/2" style={{ backgroundColor: pal.fore }} />
                    <div className="w-1/2" style={{ backgroundColor: pal.back }} />
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500 group-hover:text-zinc-300 font-bold max-w-full truncate">
                    {pal.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Foreground Hex */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Foreground Marker Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={foreColor}
                  onChange={(e) => setForeColor(e.target.value)}
                  className="w-10 h-10 rounded border border-zinc-800 bg-zinc-950 p-1 cursor-pointer"
                />
                <input
                  type="text"
                  maxLength={7}
                  value={foreColor}
                  onChange={(e) => setForeColor(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 focus:border-brand/40 px-3 py-2 text-xs font-mono text-zinc-300 rounded-lg outline-none uppercase flex-1"
                />
              </div>
            </div>

            {/* Custom Background Hex */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Canvas Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded border border-zinc-800 bg-zinc-950 p-1 cursor-pointer"
                />
                <input
                  type="text"
                  maxLength={7}
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 focus:border-brand/40 px-3 py-2 text-xs font-mono text-zinc-300 rounded-lg outline-none uppercase flex-1"
                />
              </div>
            </div>
          </div>

          {/* Quiet Zone Padding - Shared Option */}
          <div className="flex items-center gap-2 select-none pt-2 border-t border-zinc-900">
            <input
              id="shared-with-margin"
              type="checkbox"
              checked={withMargin}
              onChange={(e) => setWithMargin(e.target.checked)}
              className="rounded border-zinc-800 text-brand bg-zinc-950 focus:ring-brand/40 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="shared-with-margin" className="text-xs font-sans text-zinc-400 cursor-pointer">
              Include Quiet Zone Padding (Isolates scanning tags pattern)
            </label>
          </div>

          {/* Engine Calibration Sliders */}
          <div className="pt-4 border-t border-zinc-900 space-y-5">
            {toolType === 'qr' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Size */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Precision Resolution Size</label>
                    <span className="text-[10px] font-mono text-brand font-extrabold">{qrSize} × {qrSize} px</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={1200}
                    step={50}
                    value={qrSize}
                    onChange={(e) => setQrSize(parseInt(e.target.value))}
                    className="w-full accent-brand h-1.5 bg-zinc-950 rounded-lg cursor-pointer"
                  />
                </div>

                {/* QR Error correction levels */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Reed-Solomon Fault Tolerance</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['L', 'M', 'Q', 'H'].map((lvl) => {
                      const isActive = errorCorrection === lvl;
                      return (
                        <button
                          key={lvl}
                          onClick={() => setErrorCorrection(lvl as any)}
                          className={`py-1.5 text-center text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-brand/15 border-brand/50 text-brand font-bold'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[8px] font-sans text-zinc-500 leading-normal leading-relaxed pt-0.5">
                    {errorCorrection === 'L' && "L: ~7% recovery. Generates leanest patterns."}
                    {errorCorrection === 'M' && "M: ~15% recovery. Solid retail standard."}
                    {errorCorrection === 'Q' && "Q: ~25% recovery. Ideal for lowlight dynamics."}
                    {errorCorrection === 'H' && "H: ~30% recovery. Best for logos/heavily scuffed tags."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bar Height */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Bar height</label>
                      <span className="text-[10px] font-mono text-brand font-extrabold">{barHeight}px</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={180}
                      value={barHeight}
                      onChange={(e) => setBarHeight(parseInt(e.target.value))}
                      className="w-full accent-brand h-1.5 bg-zinc-950 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Bar Width multiplier */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Stroke width multiplier</label>
                      <span className="text-[10px] font-mono text-brand font-extrabold">{barWidth} px</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={1}
                      value={barWidth}
                      onChange={(e) => setBarWidth(parseInt(e.target.value))}
                      className="w-full accent-brand h-1.5 bg-zinc-950 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Text settings collapsible block */}
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 select-none">
                      <input
                        id="show-barcode-text"
                        type="checkbox"
                        checked={showBarcodeText}
                        onChange={(e) => setShowBarcodeText(e.target.checked)}
                        className="rounded border-zinc-800 text-brand bg-zinc-950 focus:ring-brand/40 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="show-barcode-text" className="text-xs font-mono text-zinc-400 cursor-pointer">
                        Display Alphanumeric ID label Below Codes
                      </label>
                    </div>
                  </div>

                  {showBarcodeText && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">Font Type</label>
                        <select
                          value={barcodeFont}
                          onChange={(e) => setBarcodeFont(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-lg py-1.5 px-2 text-[10px] font-mono text-zinc-300 outline-none cursor-pointer"
                        >
                          <option value="monospace">Monospace</option>
                          <option value="sans-serif">Sans-Serif</option>
                          <option value="serif">Classic Serif</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">Font size</label>
                          <span className="text-[9px] font-mono text-zinc-500">{barcodeFontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={8}
                          max={26}
                          value={barcodeFontSize}
                          onChange={(e) => setBarcodeFontSize(parseInt(e.target.value))}
                          className="w-full accent-brand h-1 bg-zinc-900 rounded cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">Text margin</label>
                          <span className="text-[9px] font-mono text-zinc-500">{barcodeTextMargin}px</span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={20}
                          value={barcodeTextMargin}
                          onChange={(e) => setBarcodeTextMargin(parseInt(e.target.value))}
                          className="w-full accent-brand h-1 bg-zinc-900 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive live vector preview, download controls, history */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Card 4: Precision Live Preview Board */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 space-y-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-brand-border/10 pb-3 select-none">
            <div className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="font-heading text-xs font-bold text-zinc-300 tracking-wider uppercase">Laser Marker Signal view</h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
              Live preview
            </span>
          </div>

          {/* Preview Canvas viewport frame */}
          <div className="relative group w-full max-w-[290px] aspect-square rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4 flex items-center justify-center overflow-hidden flex-col">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:14px_24px] opacity-30" />
            
            {toolType === 'qr' ? (
              qrError ? (
                <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center space-y-2 select-none">
                  <AlertTriangle className="w-9 h-9 text-rose-500 animate-bounce" />
                  <span className="text-[10px] font-mono text-rose-400 font-bold">WASM Overflow Error</span>
                  <p className="text-[9px] text-zinc-500 max-w-[200px] leading-normal">{qrError}</p>
                </div>
              ) : qrDataUrl ? (
                <div className="relative z-10 p-3 bg-white rounded-xl shadow-2xl flex items-center justify-center transition-all duration-500 active:scale-95 cursor-pointer">
                  <img
                    src={qrDataUrl}
                    alt="Apex Secure QR code identifier visual"
                    className="w-full h-full max-w-[210px] aspect-square block border border-zinc-100 rounded-lg select-all"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center py-6 select-none">
                  <div className="w-8 h-8 rounded-full border-2 border-brand/20 border-t-brand animate-spin mb-2" />
                  <span className="text-[10px] font-mono text-zinc-500">Synthesizing...</span>
                </div>
              )
            ) : (
              barcodeError ? (
                <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center space-y-2 select-none">
                  <AlertTriangle className="w-9 h-9 text-rose-500 animate-bounce" />
                  <span className="text-[10px] font-mono text-rose-400 font-bold">Symbology Validation Error</span>
                  <p className="text-[9px] text-zinc-500 max-w-[200px] leading-normal">{barcodeError}</p>
                </div>
              ) : (
                <div 
                  className="relative z-10 w-full p-4 bg-white rounded-xl shadow-2xl flex items-center justify-center transition-all duration-500 overflow-x-auto"
                  style={{ backgroundColor: bgColor }}
                >
                  <svg ref={barcodeSvgRef} className="max-w-full h-auto block select-all transition-all" />
                </div>
              )
            )}

            {/* Glowing laser scanner overlay */}
            {((toolType === 'qr' && !qrError && qrDataUrl) || (toolType === 'barcode' && !barcodeError)) && (
              <div className="absolute left-0 right-0 h-0.5 bg-brand/40 top-0 group-hover:top-full transition-all duration-2000 pointer-events-none shadow-[0_0_10px_2px_rgba(37,99,235,0.3)]" />
            )}
          </div>

          {/* Quick Analytics Readouts */}
          <div className="w-full grid grid-cols-2 gap-2 text-center text-xs select-none">
            <div className="bg-zinc-950/60 p-2.5 border border-zinc-900 rounded-xl">
              <span className="text-[8px] font-mono text-zinc-600 block uppercase">Signal Weight</span>
              <span className="font-mono text-white text-xs font-bold leading-normal">
                {toolType === 'qr' ? `${getQrPayload().length} chars` : `${barcodeValue.length} chars`}
              </span>
            </div>
            <div className="bg-zinc-950/60 p-2.5 border border-zinc-900 rounded-xl">
              <span className="text-[8px] font-mono text-zinc-600 block uppercase">Format Standards</span>
              <span className="font-mono text-emerald-400 text-xs font-bold leading-normal">
                {toolType === 'qr' ? `RS Level ${errorCorrection}` : barcodeFormat}
              </span>
            </div>
          </div>

          {/* Action Operations Command Buttons */}
          <div className="w-full space-y-2">
            <button
              onClick={handleCopyClipboardAction}
              disabled={toolType === 'qr' ? Boolean(qrError) || !qrDataUrl : Boolean(barcodeError) || !barcodePngUrl}
              className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider select-none border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                (toolType === 'qr' ? qrCopied : barcodeCopied)
                  ? 'bg-emerald-900/40 hover:bg-emerald-900/50 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-brand/40'
              }`}
            >
              {(toolType === 'qr' ? qrCopied : barcodeCopied) ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-brand" />
              )}
              <span>{(toolType === 'qr' ? qrCopied : barcodeCopied) ? 'Copied Image to Clipboard!' : 'Copy High-Res PNG'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleDownloadAction('png')}
                disabled={toolType === 'qr' ? Boolean(qrError) || !qrDataUrl : Boolean(barcodeError) || !barcodePngUrl}
                className="py-2.5 rounded-xl bg-brand hover:bg-blue-700 disabled:opacity-40 border border-brand/25 text-white text-xs font-bold font-mono uppercase tracking-wider select-none transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={() => handleDownloadAction('svg')}
                disabled={toolType === 'qr' ? Boolean(qrError) || !qrSvgString : Boolean(barcodeError) || !barcodeSvgString}
                className="py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 disabled:opacity-40 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold font-mono uppercase tracking-wider select-none transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-500/30"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Vector SVG</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 5: Local Output History Vault */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/85 space-y-3.5">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-brand" />
              <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">Local Output Vault</h3>
            </div>
            {recentCodes.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[9px] font-mono font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Format list</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {recentCodes.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center select-none">
                <QrCode className="w-10 h-10 text-zinc-800 mb-2 stroke-1" />
                <span className="text-[10px] font-mono text-zinc-600 block">Queue currently empty.</span>
                <span className="text-[8px] font-sans text-zinc-500 block max-w-[200px] leading-normal">
                  Generate codes and trigger local downlinks to populate your diagnostic archives.
                </span>
              </div>
            ) : (
              recentCodes.map((item: any) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-zinc-950/60 border border-zinc-900 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="font-mono text-zinc-300 font-bold block truncate max-w-full" title={item.name}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500 font-semibold select-none">
                      <span>{item.timestamp}</span>
                      <span>•</span>
                      <span className="text-brand/80">{item.originalSize}</span>
                    </div>
                  </div>
                  <div className="shrink-0 font-mono text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 font-extrabold select-none">
                    {item.newSize}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
