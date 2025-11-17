import type { EncryptionService } from './encryption-service.interface';
import type { AlgorithmConfig } from './algorithm-config';
import { LocalFileKeyProvider } from './local-file-key-provider';
import * as crypto from 'crypto';

/**
 * Configurable encryption implementation using AES-GCM.
 *
 * Algorithm details:
 * - Supports AES-GCM (Galois/Counter Mode) variants
 * - Key length and IV length configured via AlgorithmConfig
 * - Random IV generated per encryption
 * - Authenticated encryption (integrity + confidentiality)
 *
 * Output format: `iv:authTag:ciphertext` (all hex-encoded)
 *
 * Internally creates and manages LocalFileKeyProvider with matching configuration.
 */
export class EncryptionServiceImpl implements EncryptionService {
  private readonly keyProvider: LocalFileKeyProvider;

  constructor(
    private readonly config: AlgorithmConfig,
    baseDir?: string,
  ) {
    this.keyProvider = new LocalFileKeyProvider(config, baseDir);
  }

  encrypt(plaintext: string): string {
    try {
      const key = this.keyProvider.getOrCreateKey();
      const iv = crypto.randomBytes(this.config.ivLengthBytes);

      const cipher = crypto.createCipheriv(this.config.name, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = (cipher as crypto.CipherGCM).getAuthTag();

      // Format: iv:authTag:ciphertext (all hex)
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  decrypt(ciphertext: string): string {
    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format (expected iv:authTag:data)');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const key = this.keyProvider.getOrCreateKey();

      const decipher = crypto.createDecipheriv(
        this.config.name,
        key,
        Buffer.from(ivHex, 'hex'),
      );
      (decipher as crypto.DecipherGCM).setAuthTag(
        Buffer.from(authTagHex, 'hex'),
      );

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
