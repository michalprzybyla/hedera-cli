import { KeyAlgorithm } from '../services/kms/kms-types.interface';

export interface ParsedIdKey {
  accountId: string;
  privateKey: string;
  keyType?: KeyAlgorithm;
}

/**
 * Parse id:key or id:keyType:key format string into accountId, privateKey, and optional keyType
 * @param idKeyPair - String in format "accountId:privateKey" or "accountId:keyType:privateKey"
 * @returns Parsed accountId, privateKey, and optional keyType
 * @throws Error if format is invalid
 */
export function parseIdKeyPair(idKeyPair: string): ParsedIdKey {
  const parts = idKeyPair.split(':');
  if (parts.length < 2 || parts.length > 3) {
    throw new Error(
      'Invalid format. Expected id:key or id:keyType:key (e.g., 0.0.123:key or 0.0.123:ed25519:key)',
    );
  }

  if (parts.length === 2) {
    // Format: accountId:privateKey
    const [accountId, privateKey] = parts;
    return {
      accountId,
      privateKey,
    };
  } else {
    // Format: accountId:keyType:privateKey
    const [accountId, keyTypeStr, privateKey] = parts;
    const keyType = keyTypeStr.toLowerCase();
    if (keyType !== 'ecdsa' && keyType !== 'ed25519') {
      throw new Error(
        `Invalid key type: ${keyTypeStr}. Must be 'ecdsa' or 'ed25519'`,
      );
    }
    return {
      accountId,
      privateKey,
      keyType: keyType as KeyAlgorithm,
    };
  }
}
