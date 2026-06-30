import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, ShieldCheck, AlertTriangle, FileCode, Sliders } from 'lucide-react';

interface JwtDecoded {
  header: any;
  payload: any;
  signature: string;
}

export default function JWTDecoder() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState<JwtDecoded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const base64UrlDecode = (str: string) => {
    try {
      // Replace non-url compat characters
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      // Pad base64 block
      const pad = base64.length % 4;
      if (pad) {
        if (pad === 1) throw new Error('Invalid base64 length');
        base64 += new Array(5 - pad).join('=');
      }
      return JSON.parse(atob(base64));
    } catch (err) {
      return null;
    }
  };

  const handleDecode = () => {
    if (!token.trim()) {
      setError('Please provide a JWT token.');
      setDecoded(null);
      return;
    }
    setError(null);

    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      setError('Invalid JWT structure. A valid JWT must consist of 3 parts separated by periods (header.payload.signature).');
      setDecoded(null);
      return;
    }

    const header = base64UrlDecode(parts[0]);
    const payload = base64UrlDecode(parts[1]);
    const signature = parts[2];

    if (!header || !payload) {
      setError('Malformed payload parts. Failed to run Base64URL decoding on token segments.');
      setDecoded(null);
      return;
    }

    setDecoded({ header, payload, signature });
  };

  const isTokenExpired = () => {
    if (!decoded?.payload?.exp) return false;
    const expTime = decoded.payload.exp * 1000;
    return Date.now() > expTime;
  };

  // Pre-load a valid standard sample token to make it easy to play with
  React.useEffect(() => {
    const sampleHeader = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const samplePayload = btoa(JSON.stringify({
      sub: "1234567890",
      name: "John Doe",
      admin: true,
      iat: Math.floor(Date.now() / 1000) - 3600,
      exp: Math.floor(Date.now() / 1000) + 7200,
      iss: "apex-utility-auth"
    })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const sampleSignature = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    setToken(`${sampleHeader}.${samplePayload}.${sampleSignature}`);
  }, []);

  React.useEffect(() => {
    if (token) {
      handleDecode();
    }
  }, [token]);

  return (
    <div className="space-y-6" id="jwt-decoder-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          <span>JSON Web Token (JWT) Decoder</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Decode JWT headers and payload structures locally inside your browser thread. Inspect cryptographic algorithm headers, token lifetimes, expired claims, and custom session payloads instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Token Input Column */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5 flex-1 flex flex-col">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Source Token Input
            </h3>

            <textarea
              rows={12}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste encoded JWT starting with eyJ..."
              className="w-full flex-1 bg-zinc-950/80 border border-zinc-900 text-xs font-mono text-zinc-300 rounded-lg p-3 focus:outline-none focus:border-indigo-500/40 resize-none break-all"
            />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-3 border-t border-zinc-900">
            <div className="flex gap-2 text-[10px] font-mono text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Decoded strictly locally inside sandbox. Token keys are never sent to external servers.</span>
            </div>
          </div>
        </div>

        {/* Decoded structures column */}
        <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[400px]">
          {decoded ? (
            <div className="space-y-4 w-full flex-1 flex flex-col">
              {/* Claims Lifespans and Expired Warnings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 text-xs">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">
                    Token Expiration status
                  </span>
                  {isTokenExpired() ? (
                    <span className="text-red-400 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>EXPIRED</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>VALID/ACTIVE LIFE</span>
                    </span>
                  )}
                </div>

                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 text-xs">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">
                    Algorithm Signature
                  </span>
                  <span className="font-mono text-indigo-400 font-bold">{decoded.header.alg || 'UNKNOWN'}</span>
                </div>
              </div>

              {/* Decoded Header */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                    Header (Algorithm &amp; Token Type)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(decoded.header, null, 2));
                      setCopiedHeader(true);
                      setTimeout(() => setCopiedHeader(false), 2000);
                    }}
                    className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300"
                  >
                    {copiedHeader ? 'Copied' : 'Copy Header'}
                  </button>
                </div>
                <pre className="bg-zinc-950 border border-zinc-900 rounded-lg p-3 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>

              {/* Decoded Payload */}
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                    Payload (Claims &amp; Custom Key Data)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(decoded.payload, null, 2));
                      setCopiedPayload(true);
                      setTimeout(() => setCopiedPayload(false), 2000);
                    }}
                    className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300"
                  >
                    {copiedPayload ? 'Copied' : 'Copy Payload'}
                  </button>
                </div>
                <pre className="bg-zinc-950 border border-zinc-900 rounded-lg p-3 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre flex-1 max-h-[220px]">
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 space-y-2 border border-dashed border-zinc-900 rounded-lg w-full">
              <FileCode className="w-8 h-8 opacity-40 text-indigo-400" />
              <p className="text-xs">Provide a target encoded JWT token to render header and payload parameters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
