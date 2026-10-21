import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HardwareInspector } from './components/HardwareInspector';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import { CudaVisualizer } from './components/CudaVisualizer';
import { Sha256Internals } from './components/Sha256Internals';
import { SecurityEducation } from './components/SecurityEducation';
import { CorrectnessTester } from './components/CorrectnessTester';
import { CudaErrorSimulator } from './components/CudaErrorSimulator';
import { HardwareInfo, CpuBenchmarkResult, GpuBenchmarkResult } from './types';
import { fetchHardwareInfo, runComparisonBenchmark, runGpuBenchmark, runCpuBenchmark } from './services/api';
import { ShieldCheck, Cpu, Zap, Layers, Binary, ShieldAlert, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('benchmark');
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [selectedGpuKey, setSelectedGpuKey] = useState<string>('rtx4090');
  const [isGlobalRunning, setIsGlobalRunning] = useState<boolean>(false);
  const [lastGpuResult, setLastGpuResult] = useState<GpuBenchmarkResult | null>(null);
  const [lastCharsetType, setLastCharsetType] = useState<any>('lower');

  useEffect(() => {
    fetchHardwareInfo()
      .then((info) => {
        setHardwareInfo(info);
        if (info.defaultProfile) {
          setSelectedGpuKey(info.defaultProfile);
        }
      })
      .catch((err) => {
        console.error('Hardware query error:', err);
      });
  }, []);

  const handleQuickRun = async () => {
    setIsGlobalRunning(true);
    setActiveTab('benchmark');
    try {
      const gpuRes = await runGpuBenchmark({
        targetHash: '77af778b51abd4a3c51c5ddd97204a9c3ae614ebccb75a606c3b6865aed6744e', // "cat"
        charsetType: 'lower',
        maxLength: 3,
        maxCandidates: 50000,
        threadsPerBlock: 256,
        selectedGpuProfile: selectedGpuKey
      });
      setLastGpuResult(gpuRes);
    } catch (err) {
      console.error('Quick run benchmark failed:', err);
    } finally {
      setIsGlobalRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickRun={handleQuickRun}
        isRunning={isGlobalRunning}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Tab 1: Benchmark Lab */}
        {activeTab === 'benchmark' && (
          <div className="space-y-8">
            <HardwareInspector
              hardwareInfo={hardwareInfo}
              selectedGpuKey={selectedGpuKey}
              onSelectGpu={setSelectedGpuKey}
            />
            <BenchmarkPanel
              hardwareInfo={hardwareInfo}
              selectedGpuKey={selectedGpuKey}
              onBenchmarkComplete={(res) => {
                if (res.gpu) setLastGpuResult(res.gpu);
                if (res.charsetType) setLastCharsetType(res.charsetType);
              }}
            />
          </div>
        )}

        {/* Tab 2: CUDA Architecture & Thread Mapping */}
        {activeTab === 'cuda' && (
          <div className="space-y-8">
            <CudaVisualizer
              gpuResult={lastGpuResult}
              charsetType={lastCharsetType}
              threadsPerBlock={256}
            />
          </div>
        )}

        {/* Tab 3: SHA-256 Internals */}
        {activeTab === 'internals' && (
          <div className="space-y-8">
            <Sha256Internals />
          </div>
        )}

        {/* Tab 4: Security Awareness & Memory-Hard KDFs */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <SecurityEducation />
          </div>
        )}

        {/* Tab 5: NIST Correctness Verification */}
        {activeTab === 'verify' && (
          <div className="space-y-8">
            <CorrectnessTester />
          </div>
        )}

        {/* Tab 6: CUDA Error Safety */}
        {activeTab === 'errors' && (
          <div className="space-y-8">
            <CudaErrorSimulator />
          </div>
        )}
      </main>

      {/* Quiet, Compliant Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CUDA HashLab: Defensive Cryptography & Acceleration Research</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FIPS 180-4 SHA-256</span>
            <span>·</span>
            <span>RFC 9106 Argon2id</span>
            <span>·</span>
            <span>Strictly Synthetic Testing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
