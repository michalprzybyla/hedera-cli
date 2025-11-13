import { KeyAlgorithm } from '../services/kms/kms-types.interface';

/**
 * Result of parsing a private key with optional key type prefix
 */
export interface ParsedKeyWithType {
  keyType: KeyAlgorithm;
  privateKey: string;
}

/**
 * Parse a private key string that may have an optional key type prefix.
 * Supports formats:
 * - "ed25519:123456..." - ED25519 key with explicit type
 * - "ecdsa:123456..." - ECDSA key with explicit type
 * - "123456..." - Key without prefix (defaults to ecdsa)
 *
 * @param privateKeyInput - Private key string, optionally prefixed with key type
 * @returns Parsed key type and private key string
 * @throws Error if the key is empty or if a key type prefix is provided without a key
 */
export function parseKeyWithType(privateKeyInput: string): ParsedKeyWithType {
  if (!privateKeyInput || privateKeyInput.trim() === '') {
    throw new Error('Private key cannot be empty');
  }

  let keyType: KeyAlgorithm = 'ecdsa';
  let privateKey: string = privateKeyInput;

  const keyTypeMatch = privateKeyInput.match(/^(ecdsa|ed25519):(.*)$/i);
  if (keyTypeMatch) {
    const detectedKeyType = keyTypeMatch[1].toLowerCase();
    if (detectedKeyType === 'ecdsa' || detectedKeyType === 'ed25519') {
      keyType = detectedKeyType as KeyAlgorithm;
      privateKey = keyTypeMatch[2];
      if (!privateKey || privateKey.trim() === '') {
        throw new Error(
          `Private key cannot be empty. Key type prefix '${detectedKeyType}' provided but no key follows.`,
        );
      }
    }
  }

  return {
    keyType,
    privateKey,
  };
}
