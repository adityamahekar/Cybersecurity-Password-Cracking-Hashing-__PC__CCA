import {
  HardwareInfo,
  CpuBenchmarkResult,
  GpuBenchmarkResult,
  ComparisonBenchmarkResult,
  TestVector,
  VerificationResult,
  SecurityEducationData
} from '../types';
import { computeSha256Js } from '../utils/sha256';
import { indexToCandidateString, CHARSETS, CharsetType } from '../utils/candidateGenerator';

export async function fetchHardwareInfo(): Promise<HardwareInfo> {
  try {
    const res = await fetch('/api/hardware');
    if (!res.ok) throw new Error('Failed to fetch hardware info');
    return await res.json();
  } catch (err) {
    // Client-side fallback
    return {
      cpuModel: navigator.userAgent.includes('Mac') ? 'Apple Silicon Host Core' : 'x86_64 Host Processor',
      cpuCores: navigator.hardwareConcurrency || 8,
      cpuArch: 'x64',
      platform: navigator.platform || 'web',
      totalMemoryMb: 16384,
      freeMemoryMb: 8192,
      cudaProfiles: {
        'rtx4090': {
          name: 'NVIDIA GeForce RTX 4090',
          architecture: 'Ada Lovelace (AD102)',
          computeCapability: '8.9',
          streamingMultiprocessors: 128,
          cudaCores: 16384,
          tensorCores: 512,
          warpSize: 32,
          maxThreadsPerBlock: 1024,
          maxThreadsPerSM: 1536,
          baseClockMhz: 2235,
          boostClockMhz: 2520,
          vramMb: 24576,
          memoryType: 'GDDR6X (384-bit)',
          memoryBandwidthGBs: 1008,
          cudaToolkitVersion: '12.6.2',
          peakSha256ThroughputMHs: 28500,
          sharedMemoryPerBlockKb: 48,
          l2CacheKb: 73728
        },
        'a100': {
          name: 'NVIDIA A100-SXM4-80GB',
          architecture: 'Ampere (GA100)',
          computeCapability: '8.0',
          streamingMultiprocessors: 108,
          cudaCores: 6912,
          tensorCores: 432,
          warpSize: 32,
          maxThreadsPerBlock: 1024,
          maxThreadsPerSM: 2048,
          baseClockMhz: 1095,
          boostClockMhz: 1410,
          vramMb: 81920,
          memoryType: 'HBM2e (5120-bit)',
          memoryBandwidthGBs: 2039,
          cudaToolkitVersion: '12.4.1',
          peakSha256ThroughputMHs: 22000,
          sharedMemoryPerBlockKb: 164,
          l2CacheKb: 40960
        },
        't4': {
          name: 'NVIDIA Tesla T4',
          architecture: 'Turing (TU104)',
          computeCapability: '7.5',
          streamingMultiprocessors: 40,
          cudaCores: 2560,
          tensorCores: 320,
          warpSize: 32,
          maxThreadsPerBlock: 1024,
          maxThreadsPerSM: 1024,
          baseClockMhz: 585,
          boostClockMhz: 1590,
          vramMb: 16384,
          memoryType: 'GDDR6 (256-bit)',
          memoryBandwidthGBs: 320,
          cudaToolkitVersion: '12.2.0',
          peakSha256ThroughputMHs: 4800,
          sharedMemoryPerBlockKb: 64,
          l2CacheKb: 4096
        }
      },
      defaultProfile: 'rtx4090'
    };
  }
}

export async function hashText(text: string): Promise<string> {
  try {
    const res = await fetch('/api/hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      const data = await res.json();
      return data.hash;
    }
  } catch {
    // fallback
  }
  return computeSha256Js(text);
}

export async function runCpuBenchmark(params: {
  targetHash: string;
  charsetType: string;
  maxLength: number;
  maxCandidates: number;
}): Promise<CpuBenchmarkResult> {
  const res = await fetch('/api/benchmark/cpu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('CPU benchmark failed');
  return await res.json();
}

export async function runGpuBenchmark(params: {
  targetHash: string;
  charsetType: string;
  maxLength: number;
  maxCandidates: number;
  threadsPerBlock: number;
  selectedGpuProfile: string;
}): Promise<GpuBenchmarkResult> {
  const res = await fetch('/api/benchmark/gpu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('GPU benchmark failed');
  return await res.json();
}

export async function runComparisonBenchmark(params: {
  targetHash: string;
  charsetType: string;
  maxLength: number;
  maxCandidates: number;
  threadsPerBlock: number;
  selectedGpuProfile: string;
}): Promise<ComparisonBenchmarkResult> {
  const res = await fetch('/api/benchmark/comparison', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Comparison benchmark failed');
  return await res.json();
}

export async function fetchTestVectors(): Promise<{ testVectors: TestVector[] }> {
  const res = await fetch('/api/test-vectors');
  if (!res.ok) throw new Error('Failed to fetch test vectors');
  return await res.json();
}

export async function runVerification(): Promise<VerificationResult> {
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Verification test failed');
  return await res.json();
}

export async function fetchSecurityEducation(): Promise<SecurityEducationData> {
  const res = await fetch('/api/security/education');
  if (!res.ok) throw new Error('Failed to fetch security education');
  return await res.json();
}

export async function simulateCudaError(errorType: string) {
  const res = await fetch('/api/cuda/simulate-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ errorType })
  });
  if (!res.ok) throw new Error('Failed to simulate CUDA error');
  return await res.json();
}
