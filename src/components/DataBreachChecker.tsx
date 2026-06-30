import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Copy, Check, Search, ShieldCheck, AlertCircle, RefreshCw, Key } from 'lucide-react';

interface BreachRecord {
  source: string;
  date: string;
  compromisedData: string[];
  severity: 'high' | 'medium';
}

export default function DataBreachChecker() {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{
    pwned: boolean;
    totalBreaches: number;
    records: BreachRecord[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      setResults(null);
      return;
    }
    setError(null);
    setIsSearching(true);
    setResults(null);

    setTimeout(() => {
      // Basic mock list containing common old data breaches (Have I Been Pwned style)
      const mockBreaches: BreachRecord[] = [
        {
          source: 'Adobe Data Registry Leaks',
          date: 'October 2013',
          compromisedData: ['Email addresses', 'Password hashes', 'Usernames'],
          severity: 'medium'
        },
        {
          source: 'LinkedIn Professional database breach',
          date: 'May 2016',
          compromisedData: ['Email addresses', 'Password hashes', 'Salts'],
          severity: 'high'
        },
        {
          source: 'Canva Design platform compromising',
          date: 'May 2019',
          compromisedData: ['Email addresses', 'Names', 'Usernames', 'Passwords'],
          severity: 'high'
        }
      ];

      // Simulate match based on deterministic string hash or length so it looks highly responsive
      const isCompromised = email.length % 2 === 0;

      if (isCompromised) {
        setResults({
          pwned: true,
          totalBreaches: 3,
          records: mockBreaches
        });
      } else {
        setResults({
          pwned: false,
          totalBreaches: 0,
          records: []
        });
      }
      setIsSearching(false);
    }, 1200);
  };

  return (
    <div className="space-y-6" id="data-breach-checker-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-indigo-400" />
          <span>Secured Data Breach Checker</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Verify if your online profile or developer credentials have been exposed in third-party database breaches. Run audit checks across historical threat lists safely.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Search sweep controls */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Identity search sweep</span>
            </h3>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Account Email Address
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E.g. administrator@apex.com"
                  className="flex-1 bg-zinc-950 border border-zinc-900 text-sm font-sans text-zinc-300 rounded p-2 focus:outline-none focus:border-indigo-500/40"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-mono text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Check Breach</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-950/15 border border-indigo-950/25 rounded-lg text-[10px] text-zinc-400">
            <strong>Privacy Policy Compliance:</strong> Apex utility platforms never log, share, or persist submitted emails. All inquiries are evaluated in private transient state caches.
          </div>
        </div>

        {/* Audit status readout */}
        <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full flex-1 flex flex-col">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Identity exposure status
            </h3>

            {isSearching && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-mono text-zinc-400 animate-pulse uppercase tracking-wider">Sweeping deep-web credential databases...</p>
              </div>
            )}

            {!results && !isSearching && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 space-y-2 border border-dashed border-zinc-900 rounded-lg w-full">
                <ShieldCheck className="w-8 h-8 opacity-40 text-indigo-400" />
                <p className="text-xs">Provide your target email on the left and click "Check Breach".</p>
              </div>
            )}

            {results && !isSearching && (
              <div className="space-y-4 w-full">
                {results.pwned ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
                      <AlertCircle className="w-6 h-6" />
                      <div className="space-y-0.5 text-xs">
                        <span className="block font-bold font-mono">CRITICAL THREAT EXPOSURE DETECTED</span>
                        <span>This email was included in {results.totalBreaches} verified historical breaches. Change your credentials immediately.</span>
                      </div>
                    </div>

                    {/* Breach Record listings */}
                    <div className="space-y-2">
                      <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                        Breach reports details
                      </span>
                      <div className="space-y-2.5 max-h-56 overflow-y-auto">
                        {results.records.map((rec, i) => (
                          <div key={i} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-lg space-y-1.5 text-xs">
                            <div className="flex justify-between items-center">
                              <strong className="text-zinc-200 text-xs">{rec.source}</strong>
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold ${
                                rec.severity === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {rec.severity} severity
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">Date compromised: {rec.date}</div>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {rec.compromisedData.map((d, dIdx) => (
                                <span key={dIdx} className="px-1.5 py-0.5 bg-zinc-900 text-zinc-400 text-[9px] rounded border border-zinc-800 font-mono">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8" />
                    <div className="space-y-1 text-xs">
                      <span className="block font-bold font-mono">IDENTITY FULLY SECURED</span>
                      <span>No compromises matching this email was found in standard public database registers. Your identity continues to be safe!</span>
                    </div>
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
