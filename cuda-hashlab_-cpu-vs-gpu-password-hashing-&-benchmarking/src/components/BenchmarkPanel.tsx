import React, { useState } from 'react';
import {
  CpuBenchmarkResult,
  GpuBenchmarkResult,
  ComparisonBenchmarkResult,
  HardwareInfo
} from '../types';
import {
  CHARSETS,
  CharsetType,
  SAFE_CHALLENGE_PRESETS,
  calculateSpaceSize,
  candidateStringToIndex
} from '../utils/candidateGenerator';
import {
  runCpuBenchmark,
  runGpuBenchmark,
  runComparisonBenchmark,
  hashText
} from '../services/api';
import {
  Cpu,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Gauge,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

interface BenchmarkPanelProps {
  hardwareInfo: HardwareInfo | null;
  selectedGpuKey: string;
  onBenchmarkComplete?: (res: {
    cpu: CpuBenchmarkResult | null;
    gpu: GpuBenchmarkResult | null;
    charsetType: CharsetType;
  }) => void;
}

export const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({
  hardwareInfo,
  selectedGpuKey,
  onBenchmarkComplete
}) => {
  // Configuration State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('cat');
  const [customPassword, setCustomPassword] = useState<string>('');
  const [activePassword, setActivePassword] = useState<string>('cat');
  const [activeTargetHash, setActiveTargetHash] = useState<string>(
    '77af778b51abd4a3c51c5ddd97204a9c3ae614ebccb75a606c3b6865aed6744e'
  );
  const [charsetType, setCharsetType] = useState<CharsetType>('lower');
  const [maxLength, setMaxLength] = useState<number>(4);
  const [threadsPerBlock, setThreadsPerBlock] = useState<number>(256);

  // Execution & Results State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeBenchmarkMode, setActiveBenchmarkMode] = useState<'both' | 'cpu' | 'gpu'>('both');
  const [cpuResult, setCpuResult] = useState<CpuBenchmarkResult | null>(null);
  const [gpuResult, setGpuResult] = useState<GpuBenchmarkResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonBenchmarkResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search bounds calculation
  const charset = CHARSETS[charsetType];
  const maxSearchSpace = calculateSpaceSize(charset.base, maxLength);

  // Handle Preset Selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = SAFE_CHALLENGE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setActivePassword(preset.plaintext);
      setActiveTargetHash(preset.hash);
      setCharsetType(preset.charset);
      setMaxLength(Math.max(preset.length, 3));
      setCustomPassword('');
    }
  };

  // Handle Custom Password Creation (Enforced Max 20 chars)
  const handleSetCustomPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    let sanitized = customPassword.trim();
    if (!sanitized) return;

    if (charsetType === 'lower') {
      sanitized = sanitized.toLowerCase();
    } else if (charsetType === 'upper') {
      sanitized = sanitized.toUpperCase();
    }

    if (sanitized.length > 20) {
      setErrorMsg('Controlled Search Limit: Maximum 20 characters allowed for laboratory benchmarking.');
      return;
    }

    // Validate characters against current charset
    const validChars = charset.chars;
    for (const char of sanitized) {
      if (!validChars.includes(char)) {
        setErrorMsg(`Character '${char}' is not in selected charset (${charset.name}). Valid: ${validChars.slice(0, 15)}...`);
        return;
      }
    }

    setErrorMsg(null);
    setSelectedPresetId('custom');
    setActivePassword(sanitized);
    const computedHash = await hashText(sanitized);
    setActiveTargetHash(computedHash);
    setMaxLength(Math.max(sanitized.length, 1));
  };

  // Launch Benchmark Runner
  const handleRunBenchmark = async (mode: 'both' | 'cpu' | 'gpu') => {
    setIsRunning(true);
    setErrorMsg(null);
    setActiveBenchmarkMode(mode);

    try {
      const benchmarkParams = {
        targetHash: activeTargetHash,
        charsetType,
        maxLength,
        maxCandidates: Math.min(maxSearchSpace, 600000),
        threadsPerBlock,
        selectedGpuProfile: selectedGpuKey
      };

      if (mode === 'both') {
        const comp = await runComparisonBenchmark(benchmarkParams);
        setComparisonResult(comp);

        // Also fetch granular GPU block samples for visualizer
        const gpuGranular = await runGpuBenchmark(benchmarkParams);
        setGpuResult(gpuGranular);

        const cpuGranular = await runCpuBenchmark(benchmarkParams);
        setCpuResult(cpuGranular);

        if (onBenchmarkComplete) {
          onBenchmarkComplete({ cpu: cpuGranular, gpu: gpuGranular, charsetType });
        }
      } else if (mode === 'cpu') {
        const res = await runCpuBenchmark(benchmarkParams);
        setCpuResult(res);
        if (onBenchmarkComplete) {
          onBenchmarkComplete({ cpu: res, gpu: gpuResult, charsetType });
        }
      } else if (mode === 'gpu') {
        const res = await runGpuBenchmark(benchmarkParams);
        setGpuResult(res);
        if (onBenchmarkComplete) {
          onBenchmarkComplete({ cpu: cpuResult, gpu: res, charsetType });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Benchmark execution encountered an error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ethical Testing & Controlled Limits Banner */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 flex items-start gap-3 text-xs text-slate-400">
        <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-white font-medium">Ethical Research & Controlled Bounds: </span>
          <span>
            This benchmark operates strictly on local synthetic test targets. The candidate space is clamped to at most 5 characters ({maxSearchSpace.toLocaleString()} combinations) to prevent denial of service and ensure responsive, sandboxed exploration of CUDA SIMT parallelism vs single-threaded CPU loops.
          </span>
        </div>
      </div>

      {/* Target Configuration Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white tracking-tight mb-4">
          Target Synthetic Hash & Search Parameters
        </h2>

        {/* Challenge Presets */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Synthetic Challenge Presets:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {SAFE_CHALLENGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedPresetId === preset.id
                    ? 'bg-slate-800 border-emerald-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-mono text-xs font-bold text-emerald-400">"{preset.plaintext}"</div>
                <div className="text-[11px] text-slate-400 mt-1">{preset.name.split(':')[0]}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{preset.note}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Form */}
        <div className="mb-6 p-4 bg-slate-950 rounded-lg border border-slate-800/80">
          <form onSubmit={handleSetCustomPassword} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                Custom Synthetic Word (Max 20 chars):
              </label>
              <input
                type="text"
                maxLength={20}
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="e.g. key, cuda2026, pass#1_gpu"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Set Custom Target
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Active Target Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] uppercase block mb-1">Target Plaintext</span>
            <span className="text-amber-300 font-bold text-sm">"{activePassword}"</span>
            <span className="text-slate-400 text-[11px] ml-2 font-normal">({activePassword.length} chars)</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-slate-400 text-[10px] uppercase block mb-1">Target SHA-256 Digest (256-bit Hex)</span>
            <span className="text-emerald-400 break-all select-all">{activeTargetHash}</span>
          </div>
        </div>

        {/* Search Parameter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Character Set & Radix Base:
            </label>
            <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5">
              {(Object.keys(CHARSETS) as CharsetType[]).map((cKey) => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setCharsetType(cKey)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-all cursor-pointer flex justify-between items-center ${
                    charsetType === cKey
                      ? 'bg-slate-800 text-emerald-400 font-medium border border-emerald-500/40 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-white truncate">{CHARSETS[cKey].name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{CHARSETS[cKey].description}</div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 shrink-0 tabular-nums">
                    Base {CHARSETS[cKey].base}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Max Search Length:
              </label>
              <span className="font-mono text-emerald-400 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-xs tabular-nums">
                {maxLength} chars
              </span>
            </div>

            {/* Range Slider for rapid 1-20 adjustment */}
            <div className="flex items-center gap-2 mb-2">
              <input
                type="range"
                min={1}
                max={20}
                value={maxLength}
                onChange={(e) => setMaxLength(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* 20 Size Buttons in a clean compact grid */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((len) => (
                <button
                  key={len}
                  onClick={() => setMaxLength(len)}
                  className={`py-1.5 px-0.5 text-[11px] font-mono font-semibold rounded border transition-all cursor-pointer text-center tabular-nums ${
                    maxLength === len
                      ? 'bg-slate-800 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>

            <div className="mt-2 text-[11px] text-slate-400 flex flex-col gap-0.5">
              <div>
                Candidate Space: <span className="text-slate-300 font-mono tabular-nums">
                  {maxSearchSpace > 1e12 ? maxSearchSpace.toExponential(2) : maxSearchSpace.toLocaleString()}
                </span> possibilities
              </div>
              {maxLength > 8 && (
                <div className="text-[10px] text-amber-400/90 font-mono">
                  Astronomical search space: {maxLength} chars (~{maxSearchSpace.toExponential(1)} keys)
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              CUDA Threads Per Block:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[64, 128, 256, 512, 1024].map((t) => (
                <button
                  key={t}
                  onClick={() => setThreadsPerBlock(t)}
                  className={`py-2 text-xs font-mono rounded border transition-colors cursor-pointer ${
                    threadsPerBlock === t
                      ? 'bg-slate-800 border-emerald-500/40 text-emerald-400 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Warps per Block: <span className="font-mono text-slate-300">{threadsPerBlock / 32}</span> (32 threads/warp)
            </div>
          </div>
        </div>

        {/* Run Controls */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleRunBenchmark('both')}
            disabled={isRunning}
            className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunning ? 'Benchmarking...' : 'Launch CPU vs GPU Comparison'}</span>
          </button>
        </div>
      </div>

      {/* Benchmark Results Display */}
      {comparisonResult && (
        <div className="space-y-6">
          {/* Speedup Headline Card */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Benchmarking Outcome
                </span>
                <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>GPU Acceleration Speedup:</span>
                  <span className="text-emerald-400 font-mono tabular-nums">
                    {comparisonResult.gpu.speedupVsCpu}x Faster
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
                  {comparisonResult.securityTakeaway}
                </p>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-lg text-right shrink-0">
                <div className="text-xs text-slate-400">Total Guesses Tested</div>
                <div className="text-xl font-bold font-mono text-white tabular-nums">
                  {comparisonResult.guessesTested.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-400 mt-0.5">
                  Match: "{comparisonResult.matchedPassword}"
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-side Comparative Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPU Metric Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-slate-300">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">CPU Execution</h3>
                    <div className="text-[11px] text-slate-400">Sequential Single Thread</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">x86_64</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block">Execution Time</span>
                  <span className="text-lg font-bold font-mono text-white tabular-nums">
                    {comparisonResult.cpu.timeMs} ms
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block">Throughput</span>
                  <span className="text-lg font-bold font-mono text-slate-200 tabular-nums">
                    {(comparisonResult.cpu.hashesPerSec / 1000).toFixed(1)} kH/s
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 pt-2">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span>Concurrency:</span>
                  <span className="font-mono text-slate-200">1 Thread (Sequential)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span>Pipeline:</span>
                  <span className="font-mono text-slate-200">One guess evaluated at a time</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Thread Coordination:</span>
                  <span className="font-mono text-slate-200">Linear memory pointer</span>
                </div>
              </div>
            </div>

            {/* GPU Metric Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">GPU Execution</h3>
                    <div className="text-[11px] text-slate-400">CUDA SIMT Parallelism</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {comparisonResult.gpu.model.split(' ')[1] || 'GPU'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block">Execution Time</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                    {comparisonResult.gpu.timeMs} ms
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block">Throughput</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                    {comparisonResult.gpu.mhashesPerSec} MH/s
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 pt-2">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span>Active Grid / Blocks:</span>
                  <span className="font-mono text-slate-200 tabular-nums">{comparisonResult.gpu.gridDim} Blocks</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span>Threads per Block:</span>
                  <span className="font-mono text-slate-200 tabular-nums">{comparisonResult.gpu.blockDim} Threads</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Match Synchronization:</span>
                  <span className="font-mono text-emerald-400">atomicCAS race-free lock</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
