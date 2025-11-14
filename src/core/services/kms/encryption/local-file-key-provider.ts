import type { EncryptionKeyProvider } from './encryption-key-provider.interface';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Auto-generates and stores encryption key in .hedera-cli/.secret
 *
 * Security model:
 * - Key is auto-generated on first use (user-transparent)
 * - Stored in .hedera-cli/.secret (outside of state/ directory)
 * - File permissions set to 0600 (read/write for owner only)
 * - 256-bit key (32 bytes) for AES-256
 */
export class LocalFileKeyProvider implements EncryptionKeyProvider {
  private readonly secretFilePath: string;
  private cachedKey: Buffer | null = null;

  constructor(baseDir?: string) {
    const base = baseDir || path.join(process.cwd(), '.hedera-cli');
    this.secretFilePath = path.join(base, '.secret');
  }

  getOrCreateKey(): Buffer {
    // Return cached key if available
    if (this.cachedKey) {
      return this.cachedKey;
    }

    // Check if secret file exists
    if (fs.existsSync(this.secretFilePath)) {
      // Read existing key
      const hex = fs.readFileSync(this.secretFilePath, 'utf8').trim();
      this.cachedKey = Buffer.from(hex, 'hex');
      return this.cachedKey;
    }

    // Generate new key
    const key = crypto.randomBytes(32); // 256 bits for AES-256
    const hex = key.toString('hex');

    // Ensure .hedera-cli directory exists
    const dir = path.dirname(this.secretFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write key to file with restrictive permissions
    fs.writeFileSync(this.secretFilePath, hex, {
      encoding: 'utf8',
      mode: 0o600,
    });

    this.cachedKey = key;
    return this.cachedKey;
  }
}
