import React from 'react';
import { HardwareInfo, GpuProfile } from '../types';
import { Cpu, Zap, HardDrive, Layers, Server, Activity } from 'lucide-react';

interface HardwareInspectorProps {
  hardwareInfo: HardwareInfo | null;
  selectedGpuKey: string;
  onSelectGpu: (key: string) => void;
}

export const HardwareInspector: React.FC<HardwareInspectorProps> = ({
  hardwareInfo,
  selectedGpuKey,
  onSelectGpu
}) => {
  if (!hardwareInfo) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        Loading hardware telemetry...
      </div>
    );
  }

  const currentGpu: GpuProfile =
    hardwareInfo.cudaProfiles[selectedGpuKey] ||
    hardwareInfo.cudaProfiles[hardwareInfo.defaultProfile];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Server className="w-3.5 h-3.5" />
            <span>Hardware Execution Topology</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            NVIDIA CUDA & Host Architecture Profiler
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Inspecting Streaming Multiprocessor (SM) concurrency, warp dispatch, and memory hierarchy parameters.
          </p>
        </div>

        {/* GPU Profile Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 shrink-0">
          <span className="text-xs text-slate-400 px-2 font-medium">GPU Profile:</span>
          {Object.entries(hardwareInfo.cudaProfiles).map(([key, profile]) => (
            <button
              key={key}
              onClick={() => onSelectGpu(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedGpuKey === key
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {profile.name.split(' ')[1] || profile.name}
            </button>
          ))}
        </div>
      </div>

      {/* Hardware Spec Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Metric 1 */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Compute Architecture</span>
            <Layers className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            CC {currentGpu.computeCapability}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {currentGpu.architecture}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Streaming Multiprocessors</span>
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
            {currentGpu.streamingMultiprocessors} SMs
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
            {currentGpu.cudaCores.toLocaleString()} CUDA Cores
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Memory Bandwidth</span>
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-lg font-bold text-white font-mono tabular-nums">
            {currentGpu.memoryBandwidthGBs} GB/s
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {currentGpu.memoryType}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>CUDA Runtime</span>
            <Activity className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            v{currentGpu.cudaToolkitVersion}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Warp Size: {currentGpu.warpSize} Threads
          </div>
        </div>
      </div>

      {/* Memory & Hierarchy Details */}
      <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            CUDA Device Execution Limits
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">Max Threads Per Block</span>
              <span className="font-mono text-slate-200 tabular-nums">{currentGpu.maxThreadsPerBlock}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">Max Resident Threads Per SM</span>
              <span className="font-mono text-slate-200 tabular-nums">{currentGpu.maxThreadsPerSM.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">Total Concurrent Active Threads</span>
              <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                {(currentGpu.streamingMultiprocessors * currentGpu.maxThreadsPerSM).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Boost Engine Clock</span>
              <span className="font-mono text-slate-200 tabular-nums">{currentGpu.boostClockMhz} MHz</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            On-Chip Memory Hierarchy
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">Configurable Shared Memory / L1</span>
              <span className="font-mono text-slate-200 tabular-nums">{currentGpu.sharedMemoryPerBlockKb} KB / Block</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">L2 Unified Cache</span>
              <span className="font-mono text-slate-200 tabular-nums">{(currentGpu.l2CacheKb / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">Dedicated Device Global VRAM</span>
              <span className="font-mono text-slate-200 tabular-nums">{(currentGpu.vramMb / 1024).toFixed(0)} GB</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Host CPU Cores (Sequential Reference)</span>
              <span className="font-mono text-slate-200 tabular-nums">{hardwareInfo.cpuCores} Cores ({hardwareInfo.cpuArch})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
