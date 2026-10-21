/**
 * Candidate Guess Generator for Bounded Password Search Space
 * Uses Radix Base-N conversion to map unique thread indices directly to strings.
 */

export const CHARSETS = {
  digits: {
    id: 'digits',
    name: 'Digits (0-9)',
    chars: '0123456789',
    base: 10,
    description: 'Numeric pins & digits only'
  },
  hex: {
    id: 'hex',
    name: 'Hexadecimal (0-9, a-f)',
    chars: '0123456789abcdef',
    base: 16,
    description: 'Hex tokens & hash fragments'
  },
  lower: {
    id: 'lower',
    name: 'Lowercase (a-z)',
    chars: 'abcdefghijklmnopqrstuvwxyz',
    base: 26,
    description: 'Standard lowercase alphabet'
  },
  upper: {
    id: 'upper',
    name: 'Uppercase (A-Z)',
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    base: 26,
    description: 'Standard uppercase alphabet'
  },
  letters: {
    id: 'letters',
    name: 'Mixed Alpha (a-z, A-Z)',
    chars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    base: 52,
    description: 'Case-sensitive full alphabetic'
  },
  alphanumeric: {
    id: 'alphanumeric',
    name: 'Alphanumeric (a-z, 0-9)',
    chars: 'abcdefghijklmnopqrstuvwxyz0123456789',
    base: 36,
    description: 'Lowercase letters & digits'
  },
  mixed_alphanumeric: {
    id: 'mixed_alphanumeric',
    name: 'Full Alphanumeric (a-z, A-Z, 0-9)',
    chars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    base: 62,
    description: 'Case-sensitive letters & digits'
  },
  special: {
    id: 'special',
    name: 'Alphanumeric + Symbols',
    chars: 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
    base: 44,
    description: 'Letters, digits & common symbols'
  },
  ascii: {
    id: 'ascii',
    name: 'Full ASCII Symbols (Base 90)',
    chars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?',
    base: 90,
    description: 'Complete printable ASCII spectrum'
  }
} as const;

export type CharsetType = keyof typeof CHARSETS;

/**
 * Maps a single integer index (or CUDA thread globalIdx) to a unique candidate string.
 * This is the exact algorithm used in GPU brute-force kernels to avoid coordination locks.
 */
export function indexToCandidateString(index: number, charsetChars: string): string {
  const base = charsetChars.length;
  let temp = index;
  let result = '';
  do {
    result = charsetChars[temp % base] + result;
    temp = Math.floor(temp / base) - 1;
  } while (temp >= 0);
  return result;
}

/**
 * Inverse mapping: converts candidate string back to its index in candidate space
 */
export function candidateStringToIndex(str: string, charsetChars: string): number {
  const base = charsetChars.length;
  let index = 0;
  for (let i = 0; i < str.length; i++) {
    const charIndex = charsetChars.indexOf(str[i]);
    if (charIndex === -1) return -1;
    index = index * base + charIndex + 1;
  }
  return index - 1;
}

/**
 * Calculates candidate space size for passwords up to maxLen
 */
export function calculateSpaceSize(charsetBase: number, maxLen: number): number {
  let total = 0;
  for (let len = 1; len <= maxLen; len++) {
    total += Math.pow(charsetBase, len);
  }
  return total;
}

// Built-in synthetic safe challenge presets
export interface ChallengePreset {
  id: string;
  name: string;
  plaintext: string;
  charset: CharsetType;
  length: number;
  hash: string;
  note: string;
}

export const SAFE_CHALLENGE_PRESETS: ChallengePreset[] = [
  {
    id: 'cat',
    name: '3-Char Word: "cat"',
    plaintext: 'cat',
    charset: 'lower',
    length: 3,
    hash: '77af778b51abd4a3c51c5ddd97204a9c3ae614ebccb75a606c3b6865aed6744e',
    note: 'Fast demonstration (< 2,500 candidates)'
  },
  {
    id: 'gpu',
    name: '3-Char Word: "gpu"',
    plaintext: 'gpu',
    charset: 'lower',
    length: 3,
    hash: 'fa2ca5b801a2c3fb668f4efc6d4fb0971b569e2956cfafba7d6e530dcab99a5e',
    note: 'Hardware theme (< 5,000 candidates)'
  },
  {
    id: 'cuda',
    name: '4-Char Word: "cuda"',
    plaintext: 'cuda',
    charset: 'lower',
    length: 4,
    hash: '04fec8b22a61ec2cbe3e120e26ca496f8c7ec10398f6d2319202166a01b0f5ef',
    note: 'Parallel architecture benchmark (~60,000 candidates)'
  },
  {
    id: 'sec9',
    name: '4-Char Alphanumeric: "sec9"',
    plaintext: 'sec9',
    charset: 'alphanumeric',
    length: 4,
    hash: 'f0fbbe0220bc0ae0eb7320499690d79d9e685f0ef77df76f4bfd8858a74ec4aa',
    note: 'Alphanumeric mix (~1.1M space, demonstrates speedup)'
  },
  {
    id: 'safe1',
    name: '5-Char Word: "safe1"',
    plaintext: 'safe1',
    charset: 'alphanumeric',
    length: 5,
    hash: 'c8774780cefd27798c8d8b9f71c4c959663ddbb46a2fe9200318e8d26df5ef34',
    note: 'Bounded 5-char synthetic verification'
  },
  {
    id: 'cybers',
    name: '6-Char Lower: "cybers"',
    plaintext: 'cybers',
    charset: 'lower',
    length: 6,
    hash: '20e408ecbbef3d76b15efb5b48bcde6d4f40f9247657922d5df68b6b1fcbb8c0',
    note: '6-char extended length test'
  },
  {
    id: 'symbol',
    name: '5-Char Symbol: "cu@9!"',
    plaintext: 'cu@9!',
    charset: 'special',
    length: 5,
    hash: '16fc98b173c2420dc15e5a95f9c11c9bbab1308a9dd7f1837648f8641a29aa24',
    note: 'Special character symbol test'
  }
];
