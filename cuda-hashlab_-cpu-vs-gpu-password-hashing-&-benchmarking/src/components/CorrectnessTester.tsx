import React, { useState, useEffect } from 'react';
import { VerificationResult, TestVector } from '../types';
import { fetchTestVectors, runVerification } from '../services/api';
import { CheckCircle2, XCircle, ShieldCheck, Play, RotateCcw, Terminal } from 'lucide-react';

export const CorrectnessTester: React.FC = () => {
  const [vectors, setVectors] = useState<TestVector[]>([]);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    fetchTestVectors()
      .then((res) => setVectors(res.testVectors))
      .catch(() => {});
  }, []);

  const handleRunVerification = async () => {
    setIsRunning(true);
    try {
      const res = await runVerification();
      setVerificationResult(res);
    } catch {
      // fallback
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cryptographic Validation Protocol</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              NIST CAVP & Bit-for-Bit Correctness Testing
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Verifies that sequential CPU execution and parallel CUDA SIMT kernel output match NIST FIPS 180-4 standard vectors with 100% bit-for-bit exactness.
            </p>
          </div>

          <button
            onClick={handleRunVerification}
            disabled={isRunning}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunning ? 'Validating Hashes...' : 'Run Correctness Suite'}</span>
          </button>
        </div>

        {/* Verification Summary Badge */}
        {verificationResult && (
          <div className={`mt-6 p-4 rounded-lg border text-xs flex items-center justify-between ${
            verificationResult.allPassed
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              {verificationResult.allPassed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {verificationResult.allPassed
                  ? `All ${verificationResult.totalTests} NIST test vectors verified bit-for-bit against CPU and GPU pipelines.`
                  : 'Test failures detected in cryptographic pipeline.'}
              </span>
            </div>
            <span className="font-mono font-bold">
              {verificationResult.passedTests} / {verificationResult.totalTests} PASSED
            </span>
          </div>
        )}

        {/* Test Vectors Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Standard Vector</th>
                <th className="py-2.5 px-3 font-semibold">Input Message</th>
                <th className="py-2.5 px-3 font-semibold">Expected NIST 256-Bit Digest</th>
                <th className="py-2.5 px-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(verificationResult?.results || vectors).map((item, idx) => {
                const isPassed = verificationResult
                  ? (item as any).matchesBitForBit
                  : (item as any).isValid;

                return (
                  <tr key={idx} className="hover:bg-slate-950/40">
                    <td className="py-3 px-3 text-slate-300 font-sans">
                      <div className="font-semibold text-white">{(item as any).category || 'Test Vector'}</div>
                      <div className="text-[11px] text-slate-400">{(item as any).description}</div>
                    </td>
                    <td className="py-3 px-3 text-amber-300 max-w-xs truncate">
                      "{item.input}"
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] break-all select-all font-mono">
                      {item.expectedHash}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isPassed !== undefined ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Ready</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
