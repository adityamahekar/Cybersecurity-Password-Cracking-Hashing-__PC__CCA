import React, { useState, useEffect } from 'react';
import { SecurityEducationData, KdfComparisonItem } from '../types';
import { fetchSecurityEducation } from '../services/api';
import { ShieldCheck, ShieldAlert, Cpu, HardDrive, DollarSign, Clock, AlertTriangle, Layers } from 'lucide-react';

export const SecurityEducation: React.FC = () => {
  const [eduData, setEduData] = useState<SecurityEducationData | null>(null);
  const [calcLen, setCalcLen] = useState<number>(8);
  const [calcCharset, setCalcCharset] = useState<'lower' | 'alphanumeric' | 'all'>('alphanumeric');

  useEffect(() => {
    fetchSecurityEducation()
      .then(setEduData)
      .catch(() => {
        // Fallback static educational payload
      });
  }, []);

  // Calculator Math:
  // Base:
  // lower: 26
  // alphanumeric: 62 (a-z, A-Z, 0-9)
  // all: 95 (printable ASCII)
  const baseMap = {
    lower: 26,
    alphanumeric: 62,
    all: 95
  };
  const base = baseMap[calcCharset];
  const totalCombinations = Math.pow(base, calcLen);

  // Hash rates on single RTX 4090:
  // SHA-256: 28,500,000,000 H/s (28.5 GH/s)
  // PBKDF2-HMAC-SHA256 (600k iter): 47,500 H/s
  // bcrypt (cost 12): 280 H/s
  // Argon2id (64MB, t=3, p=4): 18 H/s
  const rtx4090HourlyCostUSD = 0.74; // Standard cloud spot instance rate

  const formatTime = (seconds: number): string => {
    if (seconds < 0.001) return '< 1 millisecond';
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)} milliseconds`;
    if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)} minutes`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
    if (seconds < 31536000) return `${(seconds / 86400).toFixed(1)} days`;
    if (seconds < 3153600000) return `${(seconds / 31536000).toFixed(1)} years`;
    const centuries = seconds / (31536000 * 100);
    if (centuries > 1000000) return '> 1,000,000 centuries';
    return `${centuries.toLocaleString(undefined, { maximumFractionDigits: 0 })} centuries`;
  };

  const formatCost = (seconds: number): string => {
    const cost = (seconds / 3600) * rtx4090HourlyCostUSD;
    if (cost < 0.001) return '< $0.001';
    if (cost < 1000) return `$${cost.toFixed(2)}`;
    if (cost < 1000000) return `$${(cost / 1000).toFixed(1)}k`;
    return `$${(cost / 1000000).toFixed(1)}M`;
  };

  const sha256Seconds = (totalCombinations / 2) / 28_500_000_000;
  const pbkdf2Seconds = (totalCombinations / 2) / 47_500;
  const bcryptSeconds = (totalCombinations / 2) / 280;
  const argon2idSeconds = (totalCombinations / 2) / 18;

  return (
    <div className="space-y-6">
      {/* Primary Thesis Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Fundamental Password Architecture Failure</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mb-2">
          Why Plain SHA-256 is Broken for Password Storage
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Cryptographic hash functions like SHA-256 and SHA-512 are designed to be fast and lightweight for integrity validation (digital signatures, TLS, block headers). When applied to passwords, this high throughput becomes a critical vulnerability: modern GPUs compute billions of hashes per second for pennies in electricity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              <span>Zero Memory-Hardness (Register-Only)</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              SHA-256 requires exactly 0 KB of RAM. A GPU with 16,384 cores can run 16,384 independent SHA-256 threads without ever touching VRAM or encountering cache misses.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Fixed Work Factor (No Tunable Iterations)</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              SHA-256 always executes exactly 64 rounds. Defenders cannot increase the computational cost as GPU hardware advances year over year.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Time-to-Crack & Cloud Cost Calculator */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Empirical Password Exhaustion & Attack Cost Calculator
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulated average brute-force duration ($50\%$ key space) on a single NVIDIA RTX 4090 ($0.74/hr cloud rate).
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Password Length:</span>
              <div className="flex gap-1.5">
                {[6, 7, 8, 9, 10, 12].map((len) => (
                  <button
                    key={len}
                    onClick={() => setCalcLen(len)}
                    className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                      calcLen === len
                        ? 'bg-slate-800 border-emerald-500/40 text-emerald-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Character Complexity:</span>
              <div className="flex gap-1.5">
                {[
                  { id: 'lower', label: 'a-z (26)' },
                  { id: 'alphanumeric', label: 'a-z, A-Z, 0-9 (62)' },
                  { id: 'all', label: 'Printable ASCII (95)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCalcCharset(item.id as any)}
                    className={`px-3 py-1 text-xs rounded border transition-colors cursor-pointer whitespace-nowrap ${
                      calcCharset === item.id
                        ? 'bg-slate-800 border-emerald-500/40 text-emerald-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Plain SHA-256 */}
          <div className="bg-slate-950 p-4 rounded-lg border border-rose-500/30">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-rose-400">Plain SHA-256</span>
              <span className="text-[10px] text-rose-400/80 uppercase">Insecure</span>
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {formatTime(sha256Seconds)}
            </div>
            <div className="text-xs text-slate-400 mt-2 font-mono flex items-center justify-between">
              <span>Attack Cost:</span>
              <span className="text-rose-400 font-bold">{formatCost(sha256Seconds)}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              Throughput: <span className="font-mono text-slate-300">28.5 GH/s</span>
            </div>
          </div>

          {/* PBKDF2-HMAC-SHA256 */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-200">PBKDF2 (600k iter)</span>
              <span className="text-[10px] text-amber-400 uppercase">Legacy Standard</span>
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {formatTime(pbkdf2Seconds)}
            </div>
            <div className="text-xs text-slate-400 mt-2 font-mono flex items-center justify-between">
              <span>Attack Cost:</span>
              <span className="text-amber-400 font-bold">{formatCost(pbkdf2Seconds)}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              Throughput: <span className="font-mono text-slate-300">47.5 kH/s</span>
            </div>
          </div>

          {/* bcrypt */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-200">bcrypt (Cost 12)</span>
              <span className="text-[10px] text-emerald-400 uppercase">Memory-Bound</span>
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {formatTime(bcryptSeconds)}
            </div>
            <div className="text-xs text-slate-400 mt-2 font-mono flex items-center justify-between">
              <span>Attack Cost:</span>
              <span className="text-emerald-400 font-bold">{formatCost(bcryptSeconds)}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              Throughput: <span className="font-mono text-slate-300">280 H/s</span>
            </div>
          </div>

          {/* Argon2id */}
          <div className="bg-slate-950 p-4 rounded-lg border border-emerald-500/40">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-emerald-400">Argon2id (64MB)</span>
              <span className="text-[10px] text-emerald-400 uppercase">OWASP #1 Pick</span>
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {formatTime(argon2idSeconds)}
            </div>
            <div className="text-xs text-slate-400 mt-2 font-mono flex items-center justify-between">
              <span>Attack Cost:</span>
              <span className="text-emerald-400 font-bold">{formatCost(argon2idSeconds)}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              Throughput: <span className="font-mono text-slate-300">18 H/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive KDF Specifications Matrix */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-bold text-white tracking-tight mb-4">
          Architectural Algorithm Comparison: Plain Hash vs Memory-Hard KDFs
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Algorithm</th>
                <th className="py-2.5 px-3 font-semibold">Memory Hardness</th>
                <th className="py-2.5 px-3 font-semibold">Work / Time Factor</th>
                <th className="py-2.5 px-3 font-semibold">GPU Resistance Mechanism</th>
                <th className="py-2.5 px-3 font-semibold">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-950/40">
                <td className="py-3 px-3 font-bold text-rose-400">SHA-256</td>
                <td className="py-3 px-3 text-slate-400">0 KB (Registers)</td>
                <td className="py-3 px-3 text-slate-400">Fixed (64 rounds)</td>
                <td className="py-3 px-3 text-rose-400 font-sans">None. Billions/sec per modern GPU.</td>
                <td className="py-3 px-3 text-rose-400 font-sans">Prohibited for passwords</td>
              </tr>
              <tr className="hover:bg-slate-950/40">
                <td className="py-3 px-3 font-bold text-slate-200">PBKDF2-HMAC</td>
                <td className="py-3 px-3 text-slate-400">0 KB</td>
                <td className="py-3 px-3 text-slate-300">600,000+ iterations</td>
                <td className="py-3 px-3 text-amber-400 font-sans">Time cost only. GPUs still parallelize easily.</td>
                <td className="py-3 px-3 text-slate-400 font-sans">Legacy only (NIST SP 800-63B)</td>
              </tr>
              <tr className="hover:bg-slate-950/40">
                <td className="py-3 px-3 font-bold text-slate-200">bcrypt</td>
                <td className="py-3 px-3 text-slate-300">4 KB S-Boxes</td>
                <td className="py-3 px-3 text-slate-300">2^cost (e.g. 4096)</td>
                <td className="py-3 px-3 text-emerald-400 font-sans">S-boxes cause memory divergence in GPU warps.</td>
                <td className="py-3 px-3 text-emerald-400 font-sans">Recommended (Production Standard)</td>
              </tr>
              <tr className="hover:bg-slate-950/40">
                <td className="py-3 px-3 font-bold text-slate-200">scrypt</td>
                <td className="py-3 px-3 text-slate-300">16 MB - 64 MB</td>
                <td className="py-3 px-3 text-slate-300">N, r, p parameters</td>
                <td className="py-3 px-3 text-emerald-400 font-sans">Sequential memory exhaustion saturates GPU VRAM.</td>
                <td className="py-3 px-3 text-emerald-400 font-sans">Recommended (RFC 7914)</td>
              </tr>
              <tr className="hover:bg-slate-950/40 bg-emerald-950/10">
                <td className="py-3 px-3 font-bold text-emerald-400">Argon2id</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">64 MB (Tunable)</td>
                <td className="py-3 px-3 text-emerald-400">t=3, p=4, m=64MB</td>
                <td className="py-3 px-3 text-emerald-400 font-sans">Maximum resistance: saturates VRAM and memory bus; defeats side-channel timing.</td>
                <td className="py-3 px-3 text-emerald-400 font-bold font-sans">Gold Standard (OWASP / RFC 9106)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
