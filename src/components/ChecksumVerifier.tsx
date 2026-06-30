import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, ShieldCheck, Check, AlertTriangle, RefreshCw, FileText, Copy } from 'lucide-react';

export default function ChecksumVerifier() {
  const [file, setFile] = useState<File | null>(null);
  const [sha256, setSha256] = useState<string>('');
  const [sha1, setSha1] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [expectedHash, setExpectedHash] = useState('');
  const [copiedSha256, setCopiedSha256] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const calculateHash = async (fileObj: File) => {
    setIsHashing(true);
    setSha256('');
    setSha1('');
    
    try {
      const buffer = await fileObj.arrayBuffer();

      // SHA-256
      const hashBuffer256 = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray256 = Array.from(new Uint8Array(hashBuffer256));
      const hashHex256 = hashArray256.map(b => b.toString(16).padStart(2, '0')).join('');
      setSha256(hashHex256);

      // SHA-1
      const hashBuffer1 = await crypto.subtle.digest('SHA-1', buffer);
      const hashArray1 = Array.from(new Uint8Array(hashBuffer1));
      const hashHex1 = hashArray1.map(b => b.toString(16).padStart(2, '0')).join('');
      setSha1(hashHex1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHashing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileObj = e.target.files[0];
      setFile(fileObj);
      calculateHash(fileObj);
    }
  };

  const getVerifyStatus = () => {
    if (!expectedHash.trim() || !sha256) return null;
    const match = expectedHash.trim().toLowerCase() === sha256.toLowerCase() || expectedHash.trim().toLowerCase() === sha1.toLowerCase();
    return match ? 'match' : 'mismatch';
  };

  const handleCopyHash = () => {
    if (!sha256) return;
    navigator.clipboard.writeText(sha256);
    setCopiedSha256(true);
    setTimeout(() => setCopiedSha256(false), 2000);
  };

  return (
    <div className="space-y-6" id="checksum-verifier-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          <span>File Hash &amp; Checksum Verifier</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Verify digital signatures and software integrity. Calculate standard SHA-256 and SHA-1 cryptographic checksums natively inside browser threads to ensure file security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload workspace */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select target file</span>
            </h3>

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-64 border-2 border-dashed border-zinc-800 hover:border-indigo-500/30 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3 cursor-pointer transition-all bg-zinc-950/40"
              >
                <Upload className="w-8 h-8 text-zinc-500" />
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold uppercase text-zinc-300">Upload package / archives</p>
                  <p className="text-[10px] text-zinc-500 font-mono">Verify installers, zip, bin files up to 200MB</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 space-y-1 text-zinc-300">
                  <div className="truncate font-bold">{file.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">Size parameters: {(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                    Compare with expected Checksum
                  </span>
                  <input
                    type="text"
                    value={expectedHash}
                    onChange={(e) => setExpectedHash(e.target.value)}
                    placeholder="Paste publisher SHA-256 or SHA-1 hash to verify..."
                    className="w-full bg-zinc-950 border border-zinc-900 text-xs font-mono text-zinc-300 rounded p-2 focus:outline-none focus:border-indigo-500/40"
                  />
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setSha256('');
                    setSha1('');
                    setExpectedHash('');
                  }}
                  className="w-full py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-300 rounded text-xs font-mono flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Choose other file</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-950/15 border border-indigo-950/25 rounded-lg text-[10px] text-zinc-400">
            <strong>Natively local computation:</strong> Digital hashes are parsed strictly inside local sandbox modules. No binary streams are sent to remote registries.
          </div>
        </div>

        {/* Audit results */}
        <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full flex-1 flex flex-col">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Cryptographic integrity report
            </h3>

            {isHashing && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-mono text-zinc-400 animate-pulse uppercase tracking-wider">Compiling cryptographic digests...</p>
              </div>
            )}

            {!file && !isHashing && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 space-y-2 border border-dashed border-zinc-900 rounded-lg w-full">
                <ShieldCheck className="w-8 h-8 opacity-40 text-indigo-400" />
                <p className="text-xs">Provide a target package on the left to initiate hash audits.</p>
              </div>
            )}

            {file && !isHashing && (
              <div className="space-y-4 w-full text-xs">
                {/* Verification compare warning indicator */}
                {getVerifyStatus() === 'match' && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span><strong>INTEGRITY VERIFIED:</strong> Checksums match perfectly. This installer or binary file is untampered.</span>
                  </div>
                )}

                {getVerifyStatus() === 'mismatch' && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span><strong>WARNING MATCH FAIL:</strong> Checked checksums do not match. The file may be corrupt or maliciously modified.</span>
                  </div>
                )}

                {/* SHA256 code line */}
                {sha256 && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      <span>SHA-256 (Primary integrity)</span>
                      <button
                        onClick={handleCopyHash}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300"
                      >
                        {copiedSha256 ? 'Copied' : 'Copy hash'}
                      </button>
                    </div>
                    <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-[10px] font-mono text-zinc-300 break-all select-all">
                      {sha256}
                    </pre>
                  </div>
                )}

                {/* SHA1 code line */}
                {sha1 && (
                  <div className="space-y-1">
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                      SHA-1 (Legacy)
                    </span>
                    <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-[10px] font-mono text-zinc-400 break-all select-all">
                      {sha1}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
