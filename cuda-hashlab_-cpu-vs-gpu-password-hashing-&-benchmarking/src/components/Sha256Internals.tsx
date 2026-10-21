import React, { useState } from 'react';
import { traceSha256, Sha256DetailedTrace, INITIAL_H } from '../utils/sha256';
import { Layers, Binary, ShieldCheck, Terminal, ArrowRight } from 'lucide-react';

export const Sha256Internals: React.FC = () => {
  const [inputText, setInputText] = useState<string>('cuda');
  const [activeRound, setActiveRound] = useState<number>(0);

  const trace: Sha256DetailedTrace = traceSha256(inputText);
  const currentStep = trace.rounds[activeRound] || trace.rounds[0];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Binary className="w-3.5 h-3.5" />
              <span>Cryptographic Compression Internals</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              FIPS 180-4 SHA-256 State Decomposition
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect how 512-bit message blocks are expanded through the 64-round Merkle–Damgård compression loop using 32-bit bitwise registers.
            </p>
          </div>

          <div className="w-full lg:w-72">
            <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">
              Message Input:
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* 256-bit Digest Output */}
        <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs">
          <div className="text-slate-400 text-[10px] uppercase mb-1">Final 256-Bit Cryptographic Digest:</div>
          <div className="text-emerald-400 font-bold text-sm break-all select-all">
            {trace.digest}
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px] mt-2">
            <span>Input Size: {trace.byteLength} bytes ({trace.bitLength} bits)</span>
            <span>·</span>
            <span>Padded Message: {trace.paddedBlocksCount * 512} bits ({trace.paddedBlocksCount} block)</span>
          </div>
        </div>

        {/* 64-Round Stepper */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-white">Compression Round Inspector: Round {activeRound} / 63</span>
            <span className="font-mono text-slate-400 text-[11px]">K[{activeRound}] = 0x{currentStep.k}</span>
          </div>

          <input
            type="range"
            min={0}
            max={63}
            value={activeRound}
            onChange={(e) => setActiveRound(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-400 cursor-pointer"
          />

          {/* Working Variables A-H Matrix */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-4 text-xs font-mono">
            {[
              { label: 'A', val: currentStep.a },
              { label: 'B', val: currentStep.b },
              { label: 'C', val: currentStep.c },
              { label: 'D', val: currentStep.d },
              { label: 'E', val: currentStep.e },
              { label: 'F', val: currentStep.f },
              { label: 'G', val: currentStep.g },
              { label: 'H', val: currentStep.h }
            ].map((v) => (
              <div key={v.label} className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">{v.label}</span>
                <span className="text-slate-200 font-bold text-[11px]">0x{v.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why GPUs Excel at SHA-256 */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-bold text-white tracking-tight mb-3">
          Hardware Mapping: Why GPUs Compute Billions of SHA-256 Hashes Per Second
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-1.5">
            <span className="text-emerald-400 font-semibold block text-sm">Register-Only State</span>
            <p className="leading-relaxed">
              Variables A through H fit entirely inside eight 32-bit hardware registers (256 bits). GPU threads never need to spill data into main VRAM or cache, eliminating memory latency bottlenecks.
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-1.5">
            <span className="text-emerald-400 font-semibold block text-sm">Single-Cycle Bitwise ALUs</span>
            <p className="leading-relaxed">
              Every round operation (Ch, Maj, XOR, ROTR, 32-bit addition) maps directly to standard GPU arithmetic logic unit (ALU) instructions that execute in 1 to 2 clock cycles.
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-1.5">
            <span className="text-emerald-400 font-semibold block text-sm">Zero Branch Divergence</span>
            <p className="leading-relaxed">
              The 64 compression rounds execute an identical fixed instruction sequence across all 32 threads in a warp. There are zero conditional branches during hashing, maximizing SIMT pipeline efficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
