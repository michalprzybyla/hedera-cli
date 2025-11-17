import type { EncryptionKeyProvider } from './encryption-key-provider.interface';
import type { AlgorithmConfig } from './algorithm-config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Auto-generates and stores encryption key in .hedera-cli/.secret-{algorithm}
 *
 * Security model:
 * - Key is auto-generated on first use (user-transparent)
 * - Key length determined by algorithm configuration
 * - Stored in .hedera-cli/.secret-{identifier} (outside of state/ directory)
 * - File permissions set to 0600 (read/write for owner only)
 */
export class LocalFileKeyProvider implements EncryptionKeyProvider {
  private readonly secretFilePath: string;
  private cachedKey: Buffer | null = null;

  constructor(
    private readonly config: AlgorithmConfig,
    baseDir?: string,
  ) {
    const base = baseDir || path.join(process.cwd(), '.hedera-cli');
    this.secretFilePath = path.join(base, `.secret-${config.identifier}`);
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
      const key = Buffer.from(hex, 'hex');

      // Validate key length matches algorithm requirements
      if (key.length !== this.config.keyLengthBytes) {
        throw new Error(
          `Invalid key length for ${this.config.identifier}: ` +
            `expected ${this.config.keyLengthBytes} bytes, got ${key.length} bytes`,
        );
      }

      this.cachedKey = key;
      return this.cachedKey;
    }

    // Generate new key based on algorithm requirements
    const key = crypto.randomBytes(this.config.keyLengthBytes);
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
