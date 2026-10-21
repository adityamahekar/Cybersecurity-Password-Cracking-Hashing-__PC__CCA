import React, { useState } from 'react';
import { simulateCudaError } from '../services/api';
import { AlertCircle, ShieldAlert, CheckCircle2, RotateCcw, Terminal, HardDrive, Cpu } from 'lucide-react';

export const CudaErrorSimulator: React.FC = () => {
  const [selectedError, setSelectedError] = useState<string>('cudaSuccess');
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const errorTypes = [
    {
      id: 'cudaSuccess',
      label: 'cudaSuccess (0)',
      desc: 'Nominal execution & safe memory teardown'
    },
    {
      id: 'cudaErrorMemoryAllocation',
      label: 'cudaErrorMemoryAllocation (2)',
      desc: 'Host or Device VRAM allocation exhaustion'
    },
    {
      id: 'cudaErrorLaunchTimeout',
      label: 'cudaErrorLaunchTimeout (6)',
      desc: 'Kernel exceeded operating system WDDM watchdog timeout'
    },
    {
      id: 'cudaErrorInvalidConfiguration',
      label: 'cudaErrorInvalidConfiguration (9)',
      desc: 'Requested blockDim exceeds device capability limit'
    }
  ];

  const handleSimulate = async (type: string) => {
    setSelectedError(type);
    setLoading(true);
    try {
      const res = await simulateCudaError(type);
      setErrorDetails(res);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Resilient GPU Systems Engineering</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            CUDA Runtime Error Handling & Resource Cleanup
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            GPU drivers execute kernel dispatches asynchronously. Defensive CUDA programming requires systematic error wrapping and deterministic VRAM deallocation to prevent memory leaks and hardware hangs.
          </p>
        </div>

        {/* Error Scenarios Selector */}
        <div className="mt-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Simulate GPU Failure Scenarios:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {errorTypes.map((err) => (
              <button
                key={err.id}
                onClick={() => handleSimulate(err.id)}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedError === err.id
                    ? err.id === 'cudaSuccess'
                      ? 'bg-slate-800 border-emerald-500/50 text-white'
                      : 'bg-slate-800 border-rose-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`font-mono text-xs font-bold ${err.id === 'cudaSuccess' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {err.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {err.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Output */}
        {errorDetails && (
          <div className="mt-6 p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400 uppercase text-[10px]">Error Status Code:</span>
              <span className={`font-mono font-bold ${errorDetails.simulatedError.code === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {errorDetails.simulatedError.name} (Code {errorDetails.simulatedError.code})
              </span>
            </div>
            <div className="py-2.5 text-slate-200">
              <span className="text-slate-400 font-semibold">Driver Message: </span>
              {errorDetails.simulatedError.message}
            </div>
            <div className="pt-2 text-emerald-400 border-t border-slate-800/60">
              <span className="text-slate-400 font-semibold">Defensive Action: </span>
              {errorDetails.simulatedError.resolution}
            </div>
          </div>
        )}
      </div>

      {/* Defensive Macro Pattern */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          <Terminal className="w-3.5 h-3.5" />
          <span>Production Resource Teardown Pattern</span>
        </div>
        <h3 className="text-base font-bold text-white tracking-tight mb-2">
          Defensive CUDA Error Handling Macro (CHECK_CUDA)
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          In production systems, every API call (`cudaMalloc`, `cudaMemcpy`, `cudaDeviceSynchronize`) is wrapped in a validation macro that captures line numbers, logs error strings, and safely frees device memory pointers before terminating.
        </p>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
          <pre className="text-emerald-300 leading-relaxed overflow-x-auto">
{`#define CHECK_CUDA(call) do { \\
    cudaError_t err = call; \\
    if (err != cudaSuccess) { \\
        fprintf(stderr, "CUDA Fatal Error: %s in %s at line %d: %s\\n", \\
                #call, __FILE__, __LINE__, cudaGetErrorString(err)); \\
        /* Resource Safety: Guaranteed Teardown */ \\
        if (d_target_hash) cudaFree(d_target_hash); \\
        if (d_found_flag)  cudaFree(d_found_flag); \\
        if (d_matched_idx) cudaFree(d_matched_idx); \\
        cudaDeviceReset(); \\
        return EXIT_FAILURE; \\
    } \\
} while (0)

/* Safe Kernel Launch Pipeline */
CHECK_CUDA(cudaMalloc(&d_target_hash, 32));
CHECK_CUDA(cudaMemcpy(d_target_hash, h_target_hash, 32, cudaMemcpyHostToDevice));

sha256_crack_kernel<<<numBlocks, threadsPerBlock>>>(d_target_hash, ...);
CHECK_CUDA(cudaGetLastError());          // Check launch configuration
CHECK_CUDA(cudaDeviceSynchronize());     // Await asynchronous completion`}
          </pre>
        </div>
      </div>
    </div>
  );
};
