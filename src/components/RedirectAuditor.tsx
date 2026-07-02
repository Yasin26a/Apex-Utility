import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, ChevronDown, ChevronUp, Shield, ShieldAlert, ShieldCheck, 
  Clock, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Link2, 
  HelpCircle, Info, Sparkles, RefreshCw, Copy, Check, Lock, Unlock, FileText
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HopSecurityHeaders {
  hsts: string | null;
  csp: string | null;
  xFrameOptions: string | null;
  xContentTypeOptions: string | null;
  referrerPolicy: string | null;
  xXssProtection: string | null;
}

interface RedirectHop {
  url: string;
  statusCode: number;
  statusText: string;
  redirectUrl: string | null;
  redirectType: string | null;
  responseTimeMs: number;
  headers: Record<string, string>;
  securityHeaders: HopSecurityHeaders;
}

interface AuditResult {
  targetUrl: string;
  redirectChain: RedirectHop[];
  finalUrl: string;
  totalRedirects: number;
  error: string | null;
  success: boolean;
}

export default function RedirectAuditor() {
  const { t } = useLanguage();
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedHops, setExpandedHops] = useState<Record<number, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Quick suggestions of URLs to test
  const quickPresets = [
    { name: 'HTTP to HTTPS', url: 'http://github.com' },
    { name: 'Triple Chain', url: 'http://httpbin.org/redirect-to?url=https%3A%2F%2Fhttpbin.org%2Frelative-redirect%2F1&status_code=301' },
    { name: 'Secure Final', url: 'https://google.com' }
  ];

  const handleAudit = async (targetUrlStr?: string) => {
    const urlToTest = (targetUrlStr || urlInput).trim();
    if (!urlToTest) {
      setError('Please provide a valid URL.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setExpandedHops({});

    try {
      const response = await fetch('/api/audit-redirect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToTest }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze the URL redirect chain.');
      }

      const data: AuditResult = await response.json();
      setResult(data);
      if (data.error && data.redirectChain.length === 0) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while communicating with the redirect auditor server.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHopExpand = (index: number) => {
    setExpandedHops(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-emerald-400 bg-emerald-950/45 border-emerald-800/40';
    if (code >= 300 && code < 400) return 'text-amber-400 bg-amber-950/45 border-amber-800/40';
    return 'text-red-400 bg-red-950/45 border-red-800/40';
  };

  // Analyze the redirect chain for expert webmaster insights
  const getAuditInsights = (chain: RedirectHop[]) => {
    const insights: { type: 'success' | 'warning' | 'danger'; title: string; desc: string }[] = [];
    
    if (chain.length === 0) return insights;

    const firstHop = chain[0];
    const lastHop = chain[chain.length - 1];

    // 1. Redirect Chain Length Check
    if (chain.length > 3) {
      insights.push({
        type: 'danger',
        title: 'Long Redirect Chain (SEO Hazard)',
        desc: `This chain has ${chain.length} hops. Search engines like Google may stop following redirects after 3-5 hops, leading to indexing issues and a heavily depleted crawl budget.`
      });
    } else if (chain.length > 1) {
      insights.push({
        type: 'warning',
        title: 'Multi-hop Redirection',
        desc: `Takes ${chain.length} hops to resolve. Aim for direct 1-step redirects to minimize latency and ensure search bots traverse your linkages optimally.`
      });
    } else if (chain.length === 1 && !firstHop.redirectUrl) {
      insights.push({
        type: 'success',
        title: 'Direct Connection (No Redirects)',
        desc: 'Great! The target URL loaded directly with no redirection loops or delay hops.'
      });
    }

    // 2. HTTPS / SSL Transition Auditing
    const firstIsHttp = firstHop.url.startsWith('http://');
    const lastIsHttps = lastHop.url.startsWith('https://');

    if (firstIsHttp && lastIsHttps) {
      insights.push({
        type: 'success',
        title: 'Secure Redirection Enforced',
        desc: 'Excellent. The insecure HTTP request successfully upgraded to a secure HTTPS connection.'
      });
    } else if (!lastIsHttps) {
      insights.push({
        type: 'danger',
        title: 'Insecure Final Destination (Critical)',
        desc: 'The final destination URL does not use HTTPS. User data and session information could be vulnerable to interception.'
      });
    }

    // 3. Status Code SEO Quality check
    const redirectsList = chain.filter(h => h.redirectUrl);
    const has302 = redirectsList.some(h => h.statusCode === 302 || h.statusCode === 307);
    const all301 = redirectsList.every(h => h.statusCode === 301 || h.statusCode === 308);

    if (has302) {
      insights.push({
        type: 'warning',
        title: 'Temporary Redirects (302/307) Detected',
        desc: 'One or more redirects in the chain are temporary. If this redirect is intended to be permanent, use a 301 or 308 redirect instead to pass full SEO link equity (PageRank) to the target page.'
      });
    } else if (redirectsList.length > 0 && all301) {
      insights.push({
        type: 'success',
        title: 'Permanent Redirects (301) Configured',
        desc: 'All redirect hops utilize permanent (301/308) status codes, which fully transmits ranking power and search traffic metrics.'
      });
    }

    // 4. Security Headers Audit
    let secureHeaderCount = 0;
    const finalSec = lastHop.securityHeaders;
    if (finalSec.hsts) secureHeaderCount++;
    if (finalSec.csp) secureHeaderCount++;
    if (finalSec.xFrameOptions) secureHeaderCount++;
    if (finalSec.xContentTypeOptions) secureHeaderCount++;
    if (finalSec.referrerPolicy) secureHeaderCount++;

    if (secureHeaderCount === 5) {
      insights.push({
        type: 'success',
        title: 'Bulletproof Security Headers Configuration',
        desc: 'All five major security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are correctly implemented on the final destination host.'
      });
    } else if (secureHeaderCount >= 3) {
      insights.push({
        type: 'warning',
        title: 'Moderate Security Hardening',
        desc: `The destination implements ${secureHeaderCount}/5 standard security headers. Consider establishing missing headers like ${!finalSec.csp ? 'Content-Security-Policy' : ''} ${!finalSec.hsts ? 'Strict-Transport-Security' : ''} to reach optimum protection.`
      });
    } else {
      insights.push({
        type: 'danger',
        title: 'Weak Security Profile (Missing Headers)',
        desc: `The destination implements only ${secureHeaderCount}/5 security headers. Lacks critical client defense wrappers, creating vulnerabilities to clickjacking, cross-site scripting (XSS), and MIME-sniffing exploits.`
      });
    }

    return insights;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header and Introduction */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#cf1544] uppercase">Audit &amp; Security Tools</span>
        <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">Redirect Chain &amp; HTTP Header Auditor</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Track complete redirect pathways (301, 302, Meta-refresh, JavaScript redirection), analyze response times, and audit critical security and compliance headers instantly.
        </p>
      </div>

      {/* Main Form Box */}
      <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-5">
        <div>
          <label htmlFor="target-url-input" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Target Website URL</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-4 flex items-center text-zinc-500 pointer-events-none">
                <Link2 className="w-4 h-4 text-brand" />
              </span>
              <input
                id="target-url-input"
                type="text"
                placeholder="e.g. http://github.com or test-site.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-mono"
              />
            </div>
            <button
              onClick={() => handleAudit()}
              disabled={isLoading}
              className="bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Audit URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick presets row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 font-mono">Sample Cases:</span>
          {quickPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setUrlInput(preset.url);
                handleAudit(preset.url);
              }}
              className="bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 border border-zinc-800/80 px-2.5 py-1 rounded-lg transition-all text-[11px] font-mono hover:text-brand"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 bg-red-950/30 border border-red-500/20 text-red-300 rounded-xl text-xs flex gap-3 items-start"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Auditing Failure</p>
              <p className="opacity-90">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit Results Dashboard */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Key Metrics Bento row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Redirections</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-white">{result.totalRedirects}</p>
                  <p className="text-xs text-zinc-400 font-mono">hops</p>
                </div>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Final Status</p>
                {result.redirectChain.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      result.redirectChain[result.redirectChain.length - 1].statusCode < 300 
                        ? 'bg-emerald-500' 
                        : 'bg-red-500'
                    }`} />
                    <p className="text-base font-extrabold text-white">
                      {result.redirectChain[result.redirectChain.length - 1].statusCode} {result.redirectChain[result.redirectChain.length - 1].statusText}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-zinc-500">N/A</p>
                )}
              </div>

              <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Delay</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-black text-white">
                    {result.redirectChain.reduce((acc, hop) => acc + hop.responseTimeMs, 0)}
                  </p>
                  <p className="text-xs text-zinc-400 font-mono">ms</p>
                </div>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Security Profile</p>
                {result.redirectChain.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    {result.redirectChain[result.redirectChain.length - 1].url.startsWith('https://') ? (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase font-mono tracking-wider">SSL Secure</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-400">
                        <Unlock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase font-mono tracking-wider">Insecure HTTP</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-zinc-500">N/A</p>
                )}
              </div>
            </div>

            {/* Main content grid: Timeline on Left, Expert audit findings on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Vertical redirection timeline (Left 2/3) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-black text-xs uppercase tracking-widest text-zinc-400">Redirect Chain Timeline</h3>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Interactive Trace Logs</span>
                </div>

                <div className="space-y-4 relative pl-4 sm:pl-6 border-l border-zinc-900 py-1">
                  {result.redirectChain.map((hop, index) => {
                    const isLast = index === result.redirectChain.length - 1;
                    const isExpanded = !!expandedHops[index];
                    
                    // Count implemented security headers on this hop
                    const secCount = [
                      hop.securityHeaders.hsts,
                      hop.securityHeaders.csp,
                      hop.securityHeaders.xFrameOptions,
                      hop.securityHeaders.xContentTypeOptions,
                      hop.securityHeaders.referrerPolicy
                    ].filter(Boolean).length;

                    return (
                      <div key={index} className="relative space-y-2">
                        {/* Bullet node decorator */}
                        <div className={`absolute -left-[21px] sm:-left-[29px] top-1 w-3 h-3 rounded-full border-2 bg-black ${
                          hop.statusCode >= 200 && hop.statusCode < 300 
                            ? 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                            : 'border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        }`} />

                        <div className="bg-zinc-950/65 border border-zinc-900 rounded-xl p-4 hover:border-zinc-800 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                                Hop #{index + 1}
                              </span>
                              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${getStatusColor(hop.statusCode)}`}>
                                {hop.statusCode} {hop.statusText}
                              </span>
                              {hop.redirectType && (
                                <span className="text-[10px] font-mono text-red-400 bg-red-950/20 border border-red-900/40 px-2 py-0.5 rounded-md">
                                  {hop.redirectType}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5 text-zinc-500 font-mono text-[11px]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-zinc-600" />
                                {hop.responseTimeMs}ms
                              </span>
                            </div>
                          </div>

                          <div className="mt-2.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-xs text-zinc-300 font-mono break-all select-all pr-2">
                                {hop.url}
                              </p>
                              <button
                                onClick={() => copyToClipboard(hop.url, `hop-url-${index}`)}
                                className="text-zinc-600 hover:text-white shrink-0 transition-colors"
                                title="Copy URL"
                              >
                                {copiedText === `hop-url-${index}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {hop.redirectUrl && (
                              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono py-1 border-t border-zinc-900/60 mt-2">
                                <ArrowRight className="w-3.5 h-3.5 text-brand shrink-0" />
                                <span className="text-zinc-500 uppercase shrink-0">Redirects to:</span>
                                <span className="text-zinc-400 break-all">{hop.redirectUrl}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick statistics checklist */}
                          <div className="mt-3.5 flex items-center justify-between pt-3 border-t border-zinc-900/80">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-zinc-600" />
                                Security Headers: {secCount}/5
                              </span>
                            </div>

                            <button
                              onClick={() => toggleHopExpand(index)}
                              className="text-zinc-400 hover:text-white text-[11px] font-mono flex items-center gap-1 transition-colors"
                            >
                              <span>{isExpanded ? 'Hide' : 'Inspect'} Headers</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* Expandable headers details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-zinc-900/85 space-y-4">
                                  {/* 1. Security headers analysis panel */}
                                  <div className="bg-zinc-900/40 border border-zinc-900/80 rounded-xl p-3.5 space-y-2.5">
                                    <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Security Hardening Status</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.hsts || "Missing Strict-Transport-Security (HSTS)"}>
                                        <span className="font-mono text-[11px] text-zinc-400">Strict-Transport-Security</span>
                                        {hop.securityHeaders.hsts ? (
                                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                          <ShieldAlert className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.csp || "Missing Content-Security-Policy (CSP)"}>
                                        <span className="font-mono text-[11px] text-zinc-400">Content-Security-Policy</span>
                                        {hop.securityHeaders.csp ? (
                                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                          <ShieldAlert className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.xFrameOptions || "Missing X-Frame-Options"}>
                                        <span className="font-mono text-[11px] text-zinc-400">X-Frame-Options</span>
                                        {hop.securityHeaders.xFrameOptions ? (
                                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                          <ShieldAlert className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.xContentTypeOptions || "Missing X-Content-Type-Options"}>
                                        <span className="font-mono text-[11px] text-zinc-400">X-Content-Type-Options</span>
                                        {hop.securityHeaders.xContentTypeOptions ? (
                                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                          <ShieldAlert className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.referrerPolicy || "Missing Referrer-Policy"}>
                                        <span className="font-mono text-[11px] text-zinc-400">Referrer-Policy</span>
                                        {hop.securityHeaders.referrerPolicy ? (
                                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                          <ShieldAlert className="w-4 h-4 text-red-500" />
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.xXssProtection || "Missing X-XSS-Protection (Legacy)"}>
                                        <span className="font-mono text-[11px] text-zinc-400">X-XSS-Protection</span>
                                        {hop.securityHeaders.xXssProtection ? (
                                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                          <ShieldAlert className="w-4 h-4 text-zinc-600" />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* 2. Raw headers grid */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Raw Response Headers</h4>
                                      <button
                                        onClick={() => copyToClipboard(JSON.stringify(hop.headers, null, 2), `hop-headers-${index}`)}
                                        className="text-[10px] text-zinc-500 hover:text-white font-mono flex items-center gap-1 transition-all"
                                      >
                                        {copiedText === `hop-headers-${index}` ? 'Copied!' : 'Copy JSON'}
                                      </button>
                                    </div>
                                    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 font-mono text-[10px] text-zinc-400 overflow-x-auto max-h-56 overflow-y-auto space-y-1.5">
                                      {Object.entries(hop.headers).map(([key, val]) => (
                                        <div key={key} className="flex gap-2 border-b border-zinc-900/40 pb-1 last:border-b-0 last:pb-0">
                                          <span className="text-brand font-semibold select-all shrink-0">{key}:</span>
                                          <span className="text-zinc-300 break-all select-all">{val}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expert Audit Summary (Right 1/3) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-black text-xs uppercase tracking-widest text-zinc-400">Expert Insights</h3>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Compliance Auditor</span>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 space-y-5 shadow-lg">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">SEO &amp; Security Diagnosis</h4>
                    <p className="text-[11px] text-zinc-500 font-mono">Dynamic Webmaster Quality checks</p>
                  </div>

                  <hr className="border-zinc-900" />

                  <div className="space-y-4">
                    {result.redirectChain.length > 0 && getAuditInsights(result.redirectChain).map((insight, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3.5 rounded-xl border flex gap-3 items-start ${
                          insight.type === 'success' 
                            ? 'bg-emerald-950/15 border-emerald-950/80 text-emerald-300' 
                            : insight.type === 'warning' 
                              ? 'bg-amber-950/15 border-amber-950/80 text-amber-300' 
                              : 'bg-red-950/15 border-red-950/80 text-red-300'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {insight.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : insight.type === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold">{insight.title}</p>
                          <p className="opacity-95 leading-relaxed text-[11px] font-mono">{insight.desc}</p>
                        </div>
                      </div>
                    ))}
                    
                    {result.redirectChain.length === 0 && (
                      <p className="text-zinc-500 font-mono text-xs text-center py-6">No hops analyzed yet.</p>
                    )}
                  </div>

                  <hr className="border-zinc-900" />

                  {/* AI Assistance Promo callout */}
                  <div className="p-4 bg-red-950/10 border border-red-950/50 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-brand">
                      <Sparkles className="w-4 h-4 text-brand animate-pulse" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">AI Optimizer recommendation</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                      To optimize your crawl path latency, redirect from host directly in your server configuration (Nginx or .htaccess) with a direct <span className="text-white font-bold">301 Permanent Redirect</span> rather than multiple client hops.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
