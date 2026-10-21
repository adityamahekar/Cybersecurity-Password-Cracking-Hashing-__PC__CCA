/**
 * FIPS 180-4 Secure Hash Standard (SHA-256) implementation
 * Includes educational round-by-round state inspector
 */

// Initial Hash Values (First 32 bits of fractional parts of square roots of first 8 primes: 2..19)
export const INITIAL_H = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
];

// Round Constants (First 32 bits of fractional parts of cube roots of first 64 primes: 2..311)
export const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function rightRotate(n: number, bits: number): number {
  return (n >>> bits) | (n << (32 - bits));
}

function ch(x: number, y: number, z: number): number {
  return (x & y) ^ (~x & z);
}

function maj(x: number, y: number, z: number): number {
  return (x & y) ^ (x & z) ^ (y & z);
}

function sigma0(x: number): number {
  return rightRotate(x, 2) ^ rightRotate(x, 13) ^ rightRotate(x, 22);
}

function sigma1(x: number): number {
  return rightRotate(x, 6) ^ rightRotate(x, 11) ^ rightRotate(x, 25);
}

function gamma0(x: number): number {
  return rightRotate(x, 7) ^ rightRotate(x, 18) ^ (x >>> 3);
}

function gamma1(x: number): number {
  return rightRotate(x, 17) ^ rightRotate(x, 19) ^ (x >>> 10);
}

function toHex32(n: number): string {
  return ('00000000' + (n >>> 0).toString(16)).slice(-8);
}

export interface Sha256RoundStep {
  round: number;
  k: string;
  w: string;
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
  f: string;
  g: string;
  h: string;
  t1: string;
  t2: string;
}

export interface Sha256DetailedTrace {
  input: string;
  byteLength: number;
  bitLength: number;
  paddedHex: string;
  paddedBlocksCount: number;
  rounds: Sha256RoundStep[];
  digest: string;
}

export function computeSha256Js(input: string): string {
  const enc = new TextEncoder();
  const bytes = enc.encode(input);
  const bitLength = bytes.length * 8;

  // 1. Padding: Append bit '1' (0x80), pad with 0s until 448 mod 512 bits (56 mod 64 bytes)
  const newLength = (((bytes.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(newLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  // Append original length in bits as 64-bit big-endian integer
  const view = new DataView(padded.buffer);
  view.setUint32(newLength - 4, bitLength >>> 0, false);
  // High 32 bits for lengths < 4GB is 0
  view.setUint32(newLength - 8, Math.floor(bitLength / 0x100000000), false);

  const H = [...INITIAL_H];
  const W = new Uint32Array(64);

  // Process each 512-bit (64-byte) block
  for (let offset = 0; offset < newLength; offset += 64) {
    // 2. Prepare message schedule W
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(offset + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) >>> 0;
    }

    // 3. Initialize working variables
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];

    // 4. 64 Compression Rounds
    for (let t = 0; t < 64; t++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
      const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) >>> 0;
    }

    // 5. Compute intermediate hash values
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return H.map(toHex32).join('');
}

export function traceSha256(input: string): Sha256DetailedTrace {
  const enc = new TextEncoder();
  const bytes = enc.encode(input);
  const bitLength = bytes.length * 8;

  const newLength = (((bytes.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(newLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(newLength - 4, bitLength >>> 0, false);
  view.setUint32(newLength - 8, Math.floor(bitLength / 0x100000000), false);

  const H = [...INITIAL_H];
  const W = new Uint32Array(64);
  const roundSteps: Sha256RoundStep[] = [];

  // Message schedule for block 0
  for (let t = 0; t < 16; t++) {
    W[t] = view.getUint32(t * 4, false);
  }
  for (let t = 16; t < 64; t++) {
    W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) >>> 0;
  }

  let a = H[0];
  let b = H[1];
  let c = H[2];
  let d = H[3];
  let e = H[4];
  let f = H[5];
  let g = H[6];
  let h = H[7];

  for (let t = 0; t < 64; t++) {
    const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
    const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
    
    roundSteps.push({
      round: t,
      k: toHex32(K[t]),
      w: toHex32(W[t]),
      a: toHex32(a),
      b: toHex32(b),
      c: toHex32(c),
      d: toHex32(d),
      e: toHex32(e),
      f: toHex32(f),
      g: toHex32(g),
      h: toHex32(h),
      t1: toHex32(T1),
      t2: toHex32(T2)
    });

    h = g;
    g = f;
    f = e;
    e = (d + T1) >>> 0;
    d = c;
    c = b;
    b = a;
    a = (T1 + T2) >>> 0;
  }

  H[0] = (H[0] + a) >>> 0;
  H[1] = (H[1] + b) >>> 0;
  H[2] = (H[2] + c) >>> 0;
  H[3] = (H[3] + d) >>> 0;
  H[4] = (H[4] + e) >>> 0;
  H[5] = (H[5] + f) >>> 0;
  H[6] = (H[6] + g) >>> 0;
  H[7] = (H[7] + h) >>> 0;

  // Format padded hex preview
  let paddedHex = '';
  for (let i = 0; i < Math.min(64, padded.length); i++) {
    paddedHex += ('00' + padded[i].toString(16)).slice(-2) + ' ';
  }

  return {
    input,
    byteLength: bytes.length,
    bitLength,
    paddedHex: paddedHex.trim(),
    paddedBlocksCount: newLength / 64,
    rounds: roundSteps,
    digest: H.map(toHex32).join('')
  };
}
