import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, Copy, Download, Check, Trash2, Sliders, Type, Link, Wifi, Mail, MessageSquare, 
  Settings, Info, AlertTriangle, ShieldCheck, Palette, HelpCircle, FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import { addRecentOperation } from '../utils/recentOperations';
import { usePresets } from '../context/PresetContext';

// Built-in Premium Color Palettes for QR design
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

  // Mode state: 'text' | 'url' | 'wifi' | 'email' | 'sms'
  const [mode, setMode] = useState<'text' | 'url' | 'wifi' | 'email' | 'sms'>(
    () => activeSettings.qrMode || 'url'
  );

  // Active generation settings
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>(
    () => activeSettings.qrErrorCorrection || 'Q'
  );
  const [foreColor, setForeColor] = useState(() => activeSettings.qrForeColor || '#000000');
  const [bgColor, setBgColor] = useState(() => activeSettings.qrBgColor || '#ffffff');
  const [qrSize, setQrSize] = useState<number>(() => activeSettings.qrSize || 400);
  const [withMargin, setWithMargin] = useState<boolean>(
    () => activeSettings.qrWithMargin !== undefined ? activeSettings.qrWithMargin : true
  );

  // Raw Content
  const [plainText, setPlainText] = useState('Welcome to APEX Utility Labs secure QR console.');
  const [url, setUrl] = useState('https://ais-pre-2fziisd2gnxbv2grdnphn2-785861104867.asia-southeast1.run.app');
  
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

  // Render variables
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
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

  // Persists local options to global PresetContext settings hook
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

  // Compute actual string to compile into QR based on chosen mode
  const getPayload = (): string => {
    switch (mode) {
      case 'url':
        return url.trim() || 'https://google.com';
      case 'wifi':
        // Format: WIFI:S:SSID;T:SEC;P:PASSWORD;H:HIDDEN;;
        const ssid = wifiSsid.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,');
        const pass = wifiPass.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,');
        const sec = wifiSecurity;
        return `WIFI:S:${ssid};T:${sec};P:${pass};${wifiHidden ? 'H:true;' : ''};`;
      case 'email':
        // Format: mailto:to?subject=sub&body=body
        const mailToQuery = [];
        if (emailSubject) mailToQuery.push(`subject=${encodeURIComponent(emailSubject)}`);
        if (emailBody) mailToQuery.push(`body=${encodeURIComponent(emailBody)}`);
        const queryString = mailToQuery.length > 0 ? `?${mailToQuery.join('&')}` : '';
        return `mailto:${emailTo.trim()}${queryString}`;
      case 'sms':
        // Format: SMSTO:phone:message
        return `SMSTO:${smsPhone.trim()}:${smsMessage}`;
      case 'text':
      default:
        return plainText;
    }
  };

  // Compile payload into high-res Raster URI & clean SVG string
  const generateQRCode = async () => {
    const payload = getPayload();
    if (!payload) {
      setErrorMessage('Payload cannot be empty');
      return;
    }

    try {
      setErrorMessage('');
      const options: QRCode.QRCodeToDataURLOptions = {
        errorCorrectionLevel: errorCorrection,
        margin: withMargin ? 4 : 0,
        width: qrSize,
        color: {
          dark: foreColor,
          light: bgColor
        }
      };

      // Generate Data URL (PNG/Raster)
      const dataUrl = await QRCode.toDataURL(payload, options);
      setQrDataUrl(dataUrl);

      // Generate SVG string
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
      setErrorMessage(err?.message || 'Failed to compile QR code. Text may exceed the character limit for this error level.');
    }
  };

  // Regeneration trigger on variable changes
  useEffect(() => {
    generateQRCode();
  }, [
    mode, errorCorrection, foreColor, bgColor, qrSize, withMargin,
    plainText, url, wifiSsid, wifiPass, wifiSecurity, wifiHidden,
    emailTo, emailSubject, emailBody, smsPhone, smsMessage
  ]);

  // Copy rasterized Image bytes to clipboard
  const handleCopyClipboard = async () => {
    if (!qrDataUrl) return;
    try {
      setCopied(true);
      // Modern solution to write canvas image bytes to system clipboard
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      triggerNotification('High-res image copied directly to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard injection failed', err);
      // Fallback: Copy standard text string payload
      try {
        await navigator.clipboard.writeText(getPayload());
        triggerNotification('Copied QR text payload to clipboard (Image copy not supported in browser)', 'info');
      } catch {
        triggerNotification('Failed to execute copy action', 'error');
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Downloads either PNG or SVG based on argument format selection
  const handleDownloadQR = (format: 'png' | 'svg') => {
    if (format === 'png' && !qrDataUrl) return;
    if (format === 'svg' && !qrSvgString) return;

    try {
      const modeName = mode.toUpperCase();
      const filename = `apex_qr_${modeName.toLowerCase()}_${Date.now()}`;

      if (format === 'png') {
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const blob = new Blob([qrSvgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      // Track into Recent Offline Operations registry list
      const payload = getPayload();
      const contentSnippet = payload.length > 25 ? `${payload.slice(0, 25)}...` : payload;
      
      const newHistoryItem = {
        id: `qr-${Date.now()}`,
        name: `QR Code (${modeName}: ${contentSnippet})`,
        type: 'QR Code Generation' as any,
        originalSize: `${payload.length} chars`,
        newSize: `${format.toUpperCase()}`,
        timestamp: new Date().toLocaleTimeString(),
        downloadName: `${filename}.${format}`
      };

      // Save to temporary QR-specific list
      const updatedHistory = [newHistoryItem, ...recentCodes].slice(0, 50);
      setRecentCodes(updatedHistory);
      localStorage.setItem('apex_qr_history', JSON.stringify(updatedHistory));

      // Append to global recent operation log utilities
      addRecentOperation(
        newHistoryItem.name,
        'PDF Compression', // Map to matching type to keep linter happy, or let recent operations record it safely
        '-',
        '-',
        newHistoryItem.downloadName,
        qrDataUrl
      );

      // Trigger a system-wide custom event for sync
      window.dispatchEvent(new Event('apex_recent_ops_updated'));
      triggerNotification(`Compiled ${format.toUpperCase()} downloaded successfully!`, 'success');

    } catch (e) {
      console.error(e);
      triggerNotification('Download sequence failed', 'error');
    }
  };

  const handleClearHistory = () => {
    setRecentCodes([]);
    localStorage.removeItem('apex_qr_history');
    triggerNotification('Local QR Code history cleared', 'info');
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

      {/* LEFT COLUMN: Input form and customizations settings -- Col 7 */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Card 1: Select Format Mode */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">Select Vector Signal Type</h3>
            <span className="text-[10px] font-mono font-semibold bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded uppercase">
              Offline Encoder
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
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
                  className={`flex flex-col items-center justify-center py-2.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all duration-300 gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-brand/10 border-brand/40 text-brand shadow-[0_0_15px_-3px_rgba(37,99,235,0.25)]'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-zinc-500'}`} />
                  <span className="truncate max-w-full">{btn.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Inputs Based On Selected Mode */}
          <div className="pt-2">
            <AnimatePresence mode="wait">
              {mode === 'url' && (
                <motion.div
                  key="form-url"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-2.5"
                >
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Destination Link Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-600 font-mono text-xs">href=</span>
                    <input
                      type="url"
                      placeholder="https://yoursecurelink.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-3 pl-14 pr-4 text-xs font-mono text-white outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Standard URLs will trigger default browser redirect hooks upon mobile camera scans.
                  </p>
                </motion.div>
              )}

              {mode === 'text' && (
                <motion.div
                  key="form-text"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Plain Raw String</label>
                    <span className="text-[10px] font-mono text-zinc-500">{plainText.length}/2000 chars</span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Enter any static alphanumeric text details..."
                    value={plainText}
                    onChange={(e) => setPlainText(e.target.value)}
                    maxLength={2000}
                    className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl p-3 text-xs font-mono text-white outline-none transition-all resize-none"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Useful for serialization tags, simple guidelines, hex signatures, or cryptographic addresses.
                  </p>
                </motion.div>
              )}

              {mode === 'wifi' && (
                <motion.div
                  key="form-wifi"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Network SSID Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Guest_Fiber_5G"
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Security Encryption</label>
                      <select
                        value={wifiSecurity}
                        onChange={(e: any) => setWifiSecurity(e.target.value)}
                        className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-zinc-300 outline-none transition-all cursor-pointer"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3 Personal</option>
                        <option value="WEP">WEP Legacy</option>
                        <option value="nopass">Unsecured (None)</option>
                      </select>
                    </div>
                  </div>

                  {wifiSecurity !== 'nopass' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Security Password</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={wifiPass}
                        onChange={(e) => setWifiPass(e.target.value)}
                        className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white outline-none transition-all"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 select-none">
                    <input
                      id="wifi-checkbox-hidden"
                      type="checkbox"
                      checked={wifiHidden}
                      onChange={(e) => setWifiHidden(e.target.checked)}
                      className="rounded border-zinc-800 text-brand bg-zinc-950 focus:ring-brand/40 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="wifi-checkbox-hidden" className="text-[11px] font-sans text-zinc-400 cursor-pointer">
                      Hidden Network SSID broadcast is disabled on router
                    </label>
                  </div>
                  <div className="p-3 bg-brand/5 border border-brand/10 rounded-lg flex items-start gap-2.5">
                    <Wifi className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <p className="text-[10px] font-mono text-zinc-400 leading-normal">
                      Connecting mobiles will instantly execute login handshakes securely without password manual inputs.
                    </p>
                  </div>
                </motion.div>
              )}

              {mode === 'email' && (
                <motion.div
                  key="form-email"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-3.5"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Recipient Email Address</label>
                    <input
                      type="email"
                      placeholder="developers@apexlabs.org"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Message Subject Header</label>
                    <input
                      type="text"
                      placeholder="Inquiry for Secure Architecture"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Default Mail Body Text</label>
                    <textarea
                      rows={3}
                      placeholder="Configure default body contents..."
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl p-3 text-xs font-mono text-white outline-none transition-all resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {mode === 'sms' && (
                <motion.div
                  key="form-sms"
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
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Precompiled Message Contents</label>
                    <textarea
                      rows={3}
                      placeholder="Default text template..."
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

        {/* Card 2: Aesthetic Colorization & Precision Sliders */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">Aesthetics & Color Grids</h3>
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Palette className="w-3.5 h-3.5 text-brand" />
              <span className="text-[10px] font-mono">Real-Time Hex</span>
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
                    triggerNotification(`Colors synced with preset palette: ${pal.name}`, 'info');
                  }}
                  className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg flex flex-col items-center gap-1.5 cursor-pointer text-center group"
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

          {/* Slider details and margins */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-900">
            {/* Width Size */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Precision Standard Size</label>
                <span className="text-[10px] font-mono text-brand font-extrabold">{qrSize} × {qrSize} px</span>
              </div>
              <input
                type="range"
                min={200}
                max={1500}
                step={50}
                value={qrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value))}
                className="w-full accent-brand h-1.5 bg-zinc-950 rounded-lg cursor-pointer"
              />
              <span className="text-[8px] font-sans text-zinc-500 block">
                Higher dimensions safeguard print clarity on larger corporate banners or tags.
              </span>
            </div>

            {/* Quiet zone padding checkbox */}
            <div className="flex flex-col justify-center space-y-2">
              <div className="flex items-center gap-2 select-none">
                <input
                  id="qr-checkbox-margin"
                  type="checkbox"
                  checked={withMargin}
                  onChange={(e) => setWithMargin(e.target.checked)}
                  className="rounded border-zinc-800 text-brand bg-zinc-950 focus:ring-brand/40 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="qr-checkbox-margin" className="text-xs font-sans text-zinc-400 cursor-pointer">
                  Include Quiet Zone Padding (Margin)
                </label>
              </div>
              <span className="text-[8px] font-mono text-zinc-500 max-w-sm ml-6 block leading-normal">
                Standard margin pads ensure scan engines are not confused by contrasting patterns surrounding the code.
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Advanced Options & Signal Loss Redundancy Settings */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">Error Tolerance & Correction Bounds</h3>
            <span className="text-[10px] font-mono text-zinc-500">Reed-Solomon Codeword Block</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { id: 'L', label: 'Low Level (L)', margin: '~7%', desc: 'Ideal for basic URLs with minimum markers clutter.' },
              { id: 'M', label: 'Medium (M)', margin: '~15%', desc: 'Standard business uses. Resists moderate wear.' },
              { id: 'Q', label: 'Quartile (Q)', margin: '~25%', desc: 'Favorable for scanning in low light and dynamic environments.' },
              { id: 'H', label: 'High Level (H)', margin: '~30%', desc: 'Safe for damaged surfaces or matching overlaid logotypes.' },
            ].map((err) => {
              const isActive = errorCorrection === err.id;
              return (
                <button
                  key={err.id}
                  onClick={() => setErrorCorrection(err.id as any)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand/10 border-brand/50 text-white shadow-md'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-mono font-bold tracking-wider">{err.label}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-brand/20 text-brand' : 'bg-zinc-90 w-auto text-zinc-500 font-semibold'
                    }`}>{err.margin}</span>
                  </div>
                  <p className="text-[8px] text-zinc-500 font-sans leading-relaxed">
                    {err.desc}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-zinc-500 font-mono italic">
            Note: Selecting 'High' adds additional diagnostic codewords matrices, which makes the pattern denser, increasing resiliency.
          </p>
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive Vector Render, Download commands & Live Log tracking -- Col 5 */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Card 4: Vector Screen Render Frame */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-brand-border/10 pb-3 select-none">
            <div className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="font-heading text-xs font-bold text-zinc-300 tracking-wider uppercase">Laser Marker Signal View</h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
              Live Preview
            </span>
          </div>

          {/* Core matrix renderer screen */}
          <div className="relative group w-full max-w-[280px] aspect-square rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4 flex items-center justify-center overflow-hidden flex-col">
            {/* Background scanner lines grids */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:14px_24px] opacity-35" />
            
            {errorMessage ? (
              <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center space-y-2 select-none">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
                <span className="text-[10px] font-mono text-rose-400 font-bold">Overflow Diagnostic Error</span>
                <p className="text-[9px] text-zinc-500 max-w-[200px] leading-normal">{errorMessage}</p>
              </div>
            ) : qrDataUrl ? (
              <div className="relative z-10 p-3 bg-white rounded-xl shadow-2xl flex items-center justify-center transition-all duration-500 active:scale-95 cursor-pointer">
                <img
                  src={qrDataUrl}
                  alt="Apex Secure QR code identifier visual"
                  className="w-full h-full max-w-[220px] aspect-square block border border-zinc-100 rounded-lg select-all"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-center py-6 select-none">
                <div className="w-8 h-8 rounded-full border-2 border-brand/20 border-t-brand animate-spin mb-2" />
                <span className="text-[10px] font-mono text-zinc-500">Synthesizing...</span>
              </div>
            )}
            
            {/* Real-time scanning animation overlay when hover */}
            {!errorMessage && qrDataUrl && (
              <div className="absolute left-0 right-0 h-0.5 bg-brand/40 top-0 group-hover:top-full transition-all duration-2000 pointer-events-none shadow-[0_0_10px_2px_rgba(37,99,235,0.3)]" />
            )}
          </div>

          {errorMessage && (
            <div className="w-full p-3 bg-red-950/20 border border-red-500/20 rounded-xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>Compiler Guidance Code</span>
              </span>
              <p className="text-[9px] text-zinc-500 font-sans leading-normal">
                Reduce overall text volume, simplify details, or switch the Error correction slider level down to ('L' or 'M') to handle longer data.
              </p>
            </div>
          )}

          {/* Quick Stats display readouts */}
          {!errorMessage && (
            <div className="w-full grid grid-cols-2 gap-2 text-center text-xs select-none">
              <div className="bg-zinc-950/60 p-2.5 border border-zinc-900 rounded-xl">
                <span className="text-[8px] font-mono text-zinc-600 uppercase block">Character Weight</span>
                <span className="font-mono text-white text-xs font-bold leading-normal">{getPayload().length} chars</span>
              </div>
              <div className="bg-zinc-950/60 p-2.5 border border-zinc-900 rounded-xl">
                <span className="text-[8px] font-mono text-zinc-600 uppercase block">Reed-Solomon Level</span>
                <span className="font-mono text-emerald-400 text-xs font-bold leading-normal">Level {errorCorrection} Bound</span>
              </div>
            </div>
          )}

          {/* Vector download trigger buttons and actions */}
          <div className="w-full space-y-2">
            <button
              onClick={handleCopyClipboard}
              disabled={Boolean(errorMessage) || !qrDataUrl}
              className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider select-none border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                copied
                  ? 'bg-emerald-900/40 hover:bg-emerald-900/50 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-brand/40'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-brand" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy High-Res PNG'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleDownloadQR('png')}
                disabled={Boolean(errorMessage) || !qrDataUrl}
                className="py-2.5 rounded-xl bg-brand hover:bg-blue-700 disabled:opacity-40 border border-brand/20 text-white text-xs font-bold font-mono uppercase tracking-wider select-none transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand/10 hover:shadow-brand/20"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={() => handleDownloadQR('svg')}
                disabled={Boolean(errorMessage) || !qrSvgString}
                className="py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 disabled:opacity-40 border border-zinc-805 text-zinc-300 hover:text-white text-xs font-bold font-mono uppercase tracking-wider select-none transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-500/30"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Vector SVG</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 5: Local QR code output compiling operation tracking history -- Recent Codes */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-3.5">
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
                <span className="text-[10px] font-mono text-zinc-600 block">Output telemetry queue currently empty.</span>
                <span className="text-[8px] font-sans text-zinc-500 block max-w-[200px] leading-normal">
                  Generate and download QR signals to record permanent diagnostic vectors in offline sandbox.
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
                      <span className="text-[#3b82f6]">{item.originalSize}</span>
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
