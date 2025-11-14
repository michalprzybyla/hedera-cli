import { KeyAlgorithm } from '../services/kms/kms-types.interface';
import { PrivateKeyWithTypeSchema } from '../schemas/common-schemas';

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
 * - Keys with optional 0x prefix: "0x123456..." or "ed25519:0x123456..."
 *
 * Uses Zod schemas from common-schemas.ts for validation.
 *
 * @param privateKeyInput - Private key string, optionally prefixed with key type
 * @returns Parsed key type and private key string
 * @throws Error if the key is empty, invalid format, or if a key type prefix is provided without a key
 */
export function parseKeyWithType(privateKeyInput: string): ParsedKeyWithType {
  const result = PrivateKeyWithTypeSchema.parse(privateKeyInput);
  return {
    keyType: result.keyType,
    privateKey: result.privateKey,
  };
}
