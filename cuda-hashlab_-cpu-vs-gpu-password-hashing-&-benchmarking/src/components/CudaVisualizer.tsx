import React, { useState } from 'react';
import { GpuBenchmarkResult } from '../types';
import { indexToCandidateString, CHARSETS, CharsetType } from '../utils/candidateGenerator';
import { Layers, Cpu, ShieldCheck, CheckCircle2, Lock, Terminal, Info } from 'lucide-react';

interface CudaVisualizerProps {
  gpuResult: GpuBenchmarkResult | null;
  charsetType: CharsetType;
  threadsPerBlock: number;
}

export const CudaVisualizer: React.FC<CudaVisualizerProps> = ({
  gpuResult,
  charsetType,
  threadsPerBlock
}) => {
  const [selectedThread, setSelectedThread] = useState<{
    blockIdx: number;
    threadIdx: number;
    globalIdx: number;
    warpIdx: number;
    candidate: string;
    isMatch: boolean;
  }>({
    blockIdx: 0,
    threadIdx: 0,
    globalIdx: 0,
    warpIdx: 0,
    candidate: 'a',
    isMatch: false
  });

  const charsetChars = CHARSETS[charsetType].chars;
  const blocksToDisplay = 4; // visual sample blocks
  const threadsToDisplayPerBlock = 32; // 1 full warp per block in visual preview

  const matchedGlobalIdx = gpuResult?.matchedIndex ?? -1;

  const handleSelectThread = (blockIdx: number, threadIdx: number) => {
    const globalIdx = blockIdx * threadsPerBlock + threadIdx;
    const candidate = indexToCandidateString(globalIdx, charsetChars);
    const isMatch = globalIdx === matchedGlobalIdx;

    setSelectedThread({
      blockIdx,
      threadIdx,
      globalIdx,
      warpIdx: Math.floor(threadIdx / 32),
      candidate,
      isMatch
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>SIMT Thread Hierarchy & Execution Mapping</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              CUDA 1D Grid & Block Dispatch Model
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Each GPU thread computes a candidate index deterministically from its hardware coordinates without memory locks or branch contention.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Mapping Equation</div>
            <div className="text-emerald-400 font-bold">
              int idx = blockIdx.x * blockDim.x + threadIdx.x;
            </div>
          </div>
        </div>

        {/* Interactive Block Matrix */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
            <span>Sample Grid View (Blocks 0 to {blocksToDisplay - 1}, Warp 0 of each block):</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700 inline-block"></span>
                <span>Active Thread</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-400 inline-block"></span>
                <span>Digest Match (atomicCAS Acquired)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: blocksToDisplay }).map((_, blockIdx) => {
              const blockContainsMatch =
                matchedGlobalIdx >= blockIdx * threadsPerBlock &&
                matchedGlobalIdx < (blockIdx + 1) * threadsPerBlock;

              return (
                <div
                  key={blockIdx}
                  className={`bg-slate-950/80 border rounded-lg p-3.5 transition-all ${
                    blockContainsMatch
                      ? 'border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-slate-300 font-semibold">
                      Block {blockIdx}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      dim: {threadsPerBlock}
                    </span>
                  </div>

                  {/* 32 Thread Cells representing Warp 0 */}
                  <div className="grid grid-cols-8 gap-1.5">
                    {Array.from({ length: threadsToDisplayPerBlock }).map((_, threadIdx) => {
                      const globalIdx = blockIdx * threadsPerBlock + threadIdx;
                      const isMatch = globalIdx === matchedGlobalIdx;
                      const isSelected =
                        selectedThread.blockIdx === blockIdx &&
                        selectedThread.threadIdx === threadIdx;

                      return (
                        <button
                          key={threadIdx}
                          onClick={() => handleSelectThread(blockIdx, threadIdx)}
                          title={`Block ${blockIdx}, Thread ${threadIdx} (Global: ${globalIdx})`}
                          className={`h-6 rounded-sm text-[10px] font-mono flex items-center justify-center transition-all cursor-pointer ${
                            isMatch
                              ? 'bg-emerald-500 text-slate-950 font-bold ring-2 ring-emerald-400'
                              : isSelected
                              ? 'bg-slate-700 text-white ring-1 ring-emerald-400/50'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {threadIdx}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 font-mono flex justify-between">
                    <span>Warp 0 (Threads 0-31)</span>
                    <span>+{threadsPerBlock - 32} more</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Thread Inspector */}
        <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Thread Coordinate & Candidate Inspector</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">blockIdx.x</span>
              <span className="text-white font-mono font-bold text-sm tabular-nums">
                {selectedThread.blockIdx}
              </span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">threadIdx.x</span>
              <span className="text-white font-mono font-bold text-sm tabular-nums">
                {selectedThread.threadIdx}
              </span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">warpIdx</span>
              <span className="text-white font-mono font-bold text-sm tabular-nums">
                {selectedThread.warpIdx} (Lane {selectedThread.threadIdx % 32})
              </span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Global Index</span>
              <span className="text-emerald-400 font-mono font-bold text-sm tabular-nums">
                {selectedThread.globalIdx}
              </span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Candidate String</span>
              <span className="text-amber-300 font-mono font-bold text-sm">
                "{selectedThread.candidate}"
              </span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Match Status</span>
              <span className={`font-mono font-bold text-sm ${selectedThread.isMatch ? 'text-emerald-400' : 'text-slate-400'}`}>
                {selectedThread.isMatch ? 'MATCH FOUND' : 'No Match'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Atomic Operation & Kernel Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atomic Match Detection Explanation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Race-Free Synchronization</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mb-2">
            Atomic Match Detection with atomicCAS
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            When millions of GPU threads execute in parallel, multiple threads could finish simultaneously. Without atomic primitives, recording a found match would trigger catastrophic data races in device memory.
          </p>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-slate-400">// In Device Global Memory:</div>
            <div>__device__ int d_found_flag = 0;</div>
            <div>__device__ unsigned int d_matched_index = 0;</div>
            <div className="pt-2 text-slate-400">// Inside __global__ sha256_crack_kernel:</div>
            <div className="text-emerald-300">
              if (digest_matches(computed_hash, target_hash)) &#123;
            </div>
            <div className="pl-4 text-emerald-400">
              // atomicCAS returns the old value. Only the FIRST thread receives 0!
            </div>
            <div className="pl-4 text-amber-300">
              if (atomicCAS(&amp;d_found_flag, 0, 1) == 0) &#123;
            </div>
            <div className="pl-8 text-white">
              atomicExch(&amp;d_matched_index, globalIdx);
            </div>
            <div className="pl-4 text-amber-300">&#125;</div>
            <div className="text-emerald-300">&#125;</div>
          </div>

          <div className="mt-4 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero lock contention during non-matching iterations.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hardware-level memory bus serialization only when match is triggered.</span>
            </div>
          </div>
        </div>

        {/* Complete CUDA C Kernel Code */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>CUDA C / C++ Kernel</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mb-2">
            sha256_crack_kernel.cu
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Production CUDA kernel showing thread index mapping, candidate string synthesis, and registers-only SHA-256 computation.
          </p>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
            <pre className="text-slate-300 leading-relaxed">
{`__global__ void sha256_crack_kernel(
    const uint32_t* __restrict__ d_target_hash,
    const char* __restrict__ d_charset,
    int charset_len,
    uint32_t total_candidates,
    int* d_found_flag,
    uint32_t* d_matched_index
) {
    // 1. Thread Mapping
    uint32_t idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx >= total_candidates || *d_found_flag) return;

    // 2. Base-N Candidate Guess Generation (Registers only)
    char candidate[8];
    int len = radix_to_string(idx, d_charset, charset_len, candidate);

    // 3. Parallel SHA-256 Compression (64 rounds)
    uint32_t digest[8];
    cuda_sha256_transform(candidate, len, digest);

    // 4. Constant-Time 256-bit Comparison
    bool match = true;
    #pragma unroll
    for (int i = 0; i < 8; i++) {
        if (digest[i] != d_target_hash[i]) match = false;
    }

    // 5. Atomic Match Resolution
    if (match) {
        if (atomicCAS(d_found_flag, 0, 1) == 0) {
            atomicExch(d_matched_index, idx);
        }
    }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
