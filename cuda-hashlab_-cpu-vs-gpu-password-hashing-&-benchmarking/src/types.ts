export interface GpuProfile {
  name: string;
  architecture: string;
  computeCapability: string;
  streamingMultiprocessors: number;
  cudaCores: number;
  tensorCores: number;
  warpSize: number;
  maxThreadsPerBlock: number;
  maxThreadsPerSM: number;
  baseClockMhz: number;
  boostClockMhz: number;
  vramMb: number;
  memoryType: string;
  memoryBandwidthGBs: number;
  cudaToolkitVersion: string;
  peakSha256ThroughputMHs: number;
  sharedMemoryPerBlockKb: number;
  l2CacheKb: number;
}

export interface HardwareInfo {
  cpuModel: string;
  cpuCores: number;
  cpuArch: string;
  platform: string;
  totalMemoryMb: number;
  freeMemoryMb: number;
  cudaProfiles: Record<string, GpuProfile>;
  defaultProfile: string;
}

export interface CudaThreadSample {
  threadIdx: number;
  globalIdx: number;
  warpIdx: number;
  candidate: string;
  isMatch: boolean;
}

export interface CudaBlockSample {
  blockIdx: number;
  threads: CudaThreadSample[];
  containsMatch: boolean;
}

export interface CpuBenchmarkResult {
  mode: string;
  found: boolean;
  matchedPassword: string;
  matchedIndex: number;
  guessesTested: number;
  executionTimeMs: number;
  hashesPerSecond: number;
  mhashesPerSecond: number;
  samples: Array<{ index: number; candidate: string; hash: string }>;
  threadModel: string;
}

export interface GpuBenchmarkResult {
  mode: string;
  gpuProfile: string;
  cudaArchitecture: string;
  computeCapability: string;
  cudaGrid: {
    gridDim: number;
    blockDim: number;
    totalThreadsAllocated: number;
    warpSize: number;
    warpsPerBlock: number;
    formula: string;
  };
  atomicMatch: {
    algorithm: string;
    lockStatus: string;
    memoryRegion: string;
  };
  latencyBreakdownMs: {
    hostToDeviceTransfer: number;
    kernelExecution: number;
    deviceToHostTransfer: number;
    totalTimeMs: number;
  };
  found: boolean;
  matchedPassword: string;
  matchedIndex: number;
  cudaCoordinates: {
    blockIdx: number;
    threadIdx: number;
    warpIdx: number;
    globalIdx: number;
  } | null;
  guessesTested: number;
  executionTimeMs: number;
  hashesPerSecond: number;
  mhashesPerSecond: number;
  blockSamples: CudaBlockSample[];
}

export interface ComparisonBenchmarkResult {
  targetHash: string;
  charsetType: string;
  maxCandidateSpace: number;
  found: boolean;
  matchedPassword: string;
  matchedIndex: number;
  guessesTested: number;
  cpu: {
    timeMs: number;
    hashesPerSec: number;
    mhashesPerSec: number;
    threadModel: string;
  };
  gpu: {
    model: string;
    timeMs: number;
    hashesPerSec: number;
    mhashesPerSec: number;
    gridDim: number;
    blockDim: number;
    warpSize: number;
    speedupVsCpu: number;
  };
  securityTakeaway: string;
}

export interface TestVector {
  id?: number;
  input: string;
  expectedHash: string;
  description: string;
  category: string;
  computedHash?: string;
  isValid?: boolean;
}

export interface VerificationResult {
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  results: Array<{
    id: number;
    input: string;
    expectedHash: string;
    cpuHash: string;
    gpuHash: string;
    matchesCpuExpected: boolean;
    matchesGpuExpected: boolean;
    matchesBitForBit: boolean;
  }>;
}

export interface KdfComparisonItem {
  name: string;
  type: string;
  memoryCost: string;
  timeCost: string;
  parallelism: string;
  gpuVulnerability: string;
  recommendedForPasswords: boolean | string;
  rfcStandard: string;
  estimatedCrackTime8CharAlphanumeric: string;
}

export interface SecurityEducationData {
  whySha256FailsForPasswords: {
    headline: string;
    keyProblems: Array<{
      title: string;
      explanation: string;
    }>;
  };
  kdfComparison: KdfComparisonItem[];
}
